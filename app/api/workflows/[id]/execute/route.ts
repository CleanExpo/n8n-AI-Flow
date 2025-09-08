import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/client';
import { ExecutionService } from '@/lib/services/execution.service';
import { WorkflowService } from '@/lib/services/workflow.service';
import { N8nService } from '@/lib/services/n8n.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Get n8n credentials from environment
const n8nCredentials = {
  baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678',
  username: process.env.N8N_USERNAME || 'admin',
  password: process.env.N8N_PASSWORD || 'admin123',
  apiKey: process.env.N8N_API_KEY,
};

/**
 * POST /api/workflows/[id]/execute - Execute a workflow
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const executionService = new ExecutionService(supabase);
    const workflowService = new WorkflowService(supabase);
    const n8nService = new N8nService(n8nCredentials);

    // Verify workflow exists and user has access
    const { data: workflow, error: workflowError } = await workflowService.getWorkflowWithNodes(id);
    
    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Workflow is not active. Please activate it first.' },
        { status: 400 }
      );
    }

    // Get input data from request body
    const body = await request.json();
    const inputData = body.input_data || {};
    const startNode = body.start_node;

    // Check if workflow is synced with n8n
    const n8nWorkflowId = workflow.config?.n8n_workflow_id;
    
    if (!n8nWorkflowId) {
      return NextResponse.json(
        { error: 'Workflow not synced with n8n. Please sync first.' },
        { status: 400 }
      );
    }

    // Start execution in our database
    const { data: execution, error: execError } = await executionService.startExecution({
      workflow_id: id,
      trigger_type: 'api',
      trigger_data: { source: 'api', n8n_workflow_id: n8nWorkflowId },
      input_data: inputData
    });

    if (execError || !execution) {
      return NextResponse.json(
        { error: execError?.message || 'Failed to start execution' },
        { status: 400 }
      );
    }

    // Execute workflow in n8n
    try {
      // Update execution status to running
      await executionService.updateExecutionStatus(execution.id, 'running');
      
      // Add log entry
      await executionService.addExecutionLog(
        execution.id,
        'info',
        'Starting n8n workflow execution',
        { n8nWorkflowId }
      );

      // Execute in n8n
      const { data: n8nExecution } = await n8nService.executeWorkflow(
        n8nWorkflowId,
        inputData,
        startNode
      );

      // Store n8n execution ID
      await executionService.updateExecutionStatus(
        execution.id,
        'running',
        { n8n_execution_id: n8nExecution.id }
      );

      // Start monitoring n8n execution
      monitorN8nExecution(
        execution.id,
        n8nExecution.id,
        n8nService,
        executionService
      );

      return NextResponse.json({ 
        data: {
          ...execution,
          n8n_execution_id: n8nExecution.id,
        },
        message: 'Workflow execution started successfully'
      }, { status: 202 });
    } catch (n8nError) {
      // Update execution as failed
      await executionService.updateExecutionStatus(
        execution.id,
        'failed',
        null,
        'Failed to execute in n8n',
        { error: String(n8nError) }
      );

      return NextResponse.json(
        { error: 'Failed to execute workflow in n8n' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error executing workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Monitor n8n execution and update our database
 */
async function monitorN8nExecution(
  executionId: string,
  n8nExecutionId: string,
  n8nService: N8nService,
  executionService: ExecutionService
) {
  const maxAttempts = 60; // Monitor for up to 60 seconds
  let attempts = 0;

  const checkExecution = async () => {
    try {
      attempts++;
      
      // Get n8n execution status
      const { data: n8nExecution } = await n8nService.getExecution(n8nExecutionId);

      if (n8nExecution.finished) {
        // Execution completed
        const hasError = n8nExecution.data?.resultData?.error;
        
        if (hasError) {
          // Execution failed
          await executionService.updateExecutionStatus(
            executionId,
            'failed',
            n8nExecution.data?.resultData?.runData,
            'Workflow execution failed',
            { 
              error: hasError,
              n8n_execution: n8nExecution 
            }
          );

          await executionService.addExecutionLog(
            executionId,
            'error',
            'Workflow execution failed',
            { error: hasError }
          );
        } else {
          // Execution succeeded
          await executionService.updateExecutionStatus(
            executionId,
            'success',
            n8nExecution.data?.resultData?.runData
          );

          await executionService.addExecutionLog(
            executionId,
            'info',
            'Workflow execution completed successfully',
            { 
              duration: n8nExecution.stoppedAt ? 
                new Date(n8nExecution.stoppedAt).getTime() - new Date(n8nExecution.startedAt).getTime() : 
                0 
            }
          );
        }
      } else if (attempts < maxAttempts) {
        // Still running, check again in 1 second
        setTimeout(checkExecution, 1000);
      } else {
        // Timeout
        await executionService.updateExecutionStatus(
          executionId,
          'failed',
          null,
          'Execution timeout',
          { error: 'Execution took too long' }
        );
      }
    } catch (error) {
      console.error('Error monitoring n8n execution:', error);
      
      await executionService.updateExecutionStatus(
        executionId,
        'failed',
        null,
        'Failed to monitor execution',
        { error: String(error) }
      );
    }
  };

  // Start monitoring after a short delay
  setTimeout(checkExecution, 1000);
}

/**
 * Simulate workflow execution (placeholder for actual execution engine)
 */
async function simulateWorkflowExecution(
  supabase: any,
  executionId: string,
  workflow: any
) {
  const executionService = new ExecutionService(supabase);

  try {
    // Update status to running
    await executionService.updateExecutionStatus(executionId, 'running');
    
    // Add some logs
    await executionService.addExecutionLog(
      executionId,
      'info',
      'Starting workflow execution'
    );

    // Simulate processing each node
    if (workflow.nodes) {
      for (const node of workflow.nodes) {
        await executionService.addExecutionLog(
          executionId,
          'info',
          `Processing node: ${node.name}`,
          { nodeType: node.type },
          node.id
        );
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Complete execution
    await executionService.updateExecutionStatus(
      executionId,
      'success',
      { result: 'Workflow completed successfully' }
    );

    await executionService.addExecutionLog(
      executionId,
      'info',
      'Workflow execution completed'
    );
  } catch (error) {
    // Handle execution failure
    await executionService.updateExecutionStatus(
      executionId,
      'failed',
      null,
      'Execution failed',
      { error: error }
    );

    await executionService.addExecutionLog(
      executionId,
      'error',
      'Workflow execution failed',
      { error: String(error) }
    );
  }
}