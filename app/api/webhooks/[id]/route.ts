import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/client';
import { WorkflowService } from '@/lib/services/workflow.service';
import { ExecutionService } from '@/lib/services/execution.service';
import { N8nService } from '@/lib/services/n8n.service';
import { headers } from 'next/headers';

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
 * Handle webhook requests for workflow triggers
 * This endpoint receives webhooks and triggers workflow execution
 */
async function handleWebhook(
  request: NextRequest,
  { params }: RouteParams,
  method: string
) {
  try {
    const { id: webhookId } = await params;
    const supabase = await createRouteHandlerClient();
    const workflowService = new WorkflowService(supabase);
    const executionService = new ExecutionService(supabase);
    const n8nService = new N8nService(n8nCredentials);

    // Get headers
    const headersList = await headers();
    const webhookHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      webhookHeaders[key] = value;
    });

    // Get request body
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      // If not JSON, treat as plain text
      body = await request.text();
    }

    // Find workflow with this webhook ID
    const { data: workflows, error: searchError } = await workflowService.getWorkflows();
    
    if (searchError || !workflows) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    // Find workflow that has a webhook node with this ID
    const workflow = workflows.find((wf: any) => {
      const webhookConfig = wf.config?.webhook_config;
      return webhookConfig?.webhook_id === webhookId || webhookConfig?.path === webhookId;
    });

    if (!workflow) {
      return NextResponse.json(
        { error: 'Webhook not associated with any workflow' },
        { status: 404 }
      );
    }

    // Check if workflow is active
    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: 'Workflow is not active' },
        { status: 400 }
      );
    }

    // Check if workflow is synced with n8n
    const n8nWorkflowId = workflow.config?.n8n_workflow_id;
    
    if (!n8nWorkflowId) {
      return NextResponse.json(
        { error: 'Workflow not synced with n8n' },
        { status: 400 }
      );
    }

    // Start execution in our database
    const { data: execution, error: execError } = await executionService.startExecution({
      workflow_id: workflow.id,
      trigger_type: 'webhook',
      trigger_data: {
        webhook_id: webhookId,
        method,
        headers: webhookHeaders,
        body,
      },
      input_data: body,
    });

    if (execError || !execution) {
      return NextResponse.json(
        { error: execError?.message || 'Failed to start execution' },
        { status: 400 }
      );
    }

    // Execute workflow in n8n with webhook data
    try {
      await executionService.updateExecutionStatus(execution.id, 'running');
      
      await executionService.addExecutionLog(
        execution.id,
        'info',
        'Webhook received, starting n8n workflow execution',
        { 
          n8nWorkflowId,
          webhookId,
          method,
        }
      );

      // Execute in n8n
      const { data: n8nExecution } = await n8nService.executeWorkflow(
        n8nWorkflowId,
        body
      );

      // Store n8n execution ID
      await executionService.updateExecutionStatus(
        execution.id,
        'running',
        { n8n_execution_id: n8nExecution.id }
      );

      // Monitor n8n execution in background
      monitorN8nExecution(
        execution.id,
        n8nExecution.id,
        n8nService,
        executionService
      );

      // Return immediate response
      return NextResponse.json({ 
        success: true,
        message: 'Webhook received and workflow triggered',
        execution_id: execution.id,
        n8n_execution_id: n8nExecution.id,
      }, { status: 200 });
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
        { error: 'Failed to execute workflow' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
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

// Handle different HTTP methods
export async function GET(request: NextRequest, params: RouteParams) {
  return handleWebhook(request, params, 'GET');
}

export async function POST(request: NextRequest, params: RouteParams) {
  return handleWebhook(request, params, 'POST');
}

export async function PUT(request: NextRequest, params: RouteParams) {
  return handleWebhook(request, params, 'PUT');
}

export async function PATCH(request: NextRequest, params: RouteParams) {
  return handleWebhook(request, params, 'PATCH');
}

export async function DELETE(request: NextRequest, params: RouteParams) {
  return handleWebhook(request, params, 'DELETE');
}

export async function HEAD(request: NextRequest, params: RouteParams) {
  return handleWebhook(request, params, 'HEAD');
}