import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/client';
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
 * POST /api/workflows/[id]/sync - Sync workflow with n8n
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const workflowService = new WorkflowService(supabase);
    const n8nService = new N8nService(n8nCredentials);

    // Test n8n connection
    const isConnected = await n8nService.testConnection();
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Cannot connect to n8n. Please check if n8n is running.' },
        { status: 503 }
      );
    }

    // Get the request body (nodes and edges from React Flow)
    const { nodes, edges, operation = 'sync' } = await request.json();

    // Get workflow from database
    const { data: workflow, error: workflowError } = await workflowService.getWorkflowWithNodes(id);
    
    if (workflowError || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Convert to n8n format
    const n8nWorkflow = n8nService.convertToN8nWorkflow(
      workflow.name,
      nodes,
      edges
    );

    let n8nWorkflowId = workflow.config?.n8n_workflow_id;
    let result;

    if (operation === 'sync') {
      // Sync workflow with n8n
      if (n8nWorkflowId) {
        // Update existing n8n workflow
        try {
          result = await n8nService.updateWorkflow(n8nWorkflowId, n8nWorkflow);
        } catch (error) {
          // If update fails, try creating a new one
          result = await n8nService.createWorkflow(n8nWorkflow);
          n8nWorkflowId = result.data.id;
        }
      } else {
        // Create new n8n workflow
        result = await n8nService.createWorkflow(n8nWorkflow);
        n8nWorkflowId = result.data.id;
      }

      // Save n8n workflow ID to our database
      await workflowService.updateWorkflow(id, {
        config: {
          ...workflow.config,
          n8n_workflow_id: n8nWorkflowId,
          last_synced: new Date().toISOString(),
        },
      });

      // Also save the nodes and edges to our database
      await workflowService.syncFlowChanges(id, nodes, edges);

      return NextResponse.json({
        success: true,
        data: {
          n8nWorkflowId,
          message: 'Workflow synced with n8n successfully',
        },
      });
    } else if (operation === 'activate') {
      // Activate workflow in n8n
      if (!n8nWorkflowId) {
        return NextResponse.json(
          { error: 'Workflow not synced with n8n yet' },
          { status: 400 }
        );
      }

      result = await n8nService.activateWorkflow(n8nWorkflowId);
      
      // Update status in our database
      await workflowService.updateWorkflow(id, {
        status: 'active',
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Workflow activated successfully',
          active: true,
        },
      });
    } else if (operation === 'deactivate') {
      // Deactivate workflow in n8n
      if (!n8nWorkflowId) {
        return NextResponse.json(
          { error: 'Workflow not synced with n8n yet' },
          { status: 400 }
        );
      }

      result = await n8nService.deactivateWorkflow(n8nWorkflowId);
      
      // Update status in our database
      await workflowService.updateWorkflow(id, {
        status: 'inactive',
      });

      return NextResponse.json({
        success: true,
        data: {
          message: 'Workflow deactivated successfully',
          active: false,
        },
      });
    } else {
      // Invalid operation
      return NextResponse.json(
        { error: 'Invalid operation. Supported operations: sync, activate, deactivate' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error syncing workflow:', error);
    return NextResponse.json(
      { error: 'Failed to sync workflow with n8n' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/[id]/sync - Get n8n workflow status
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const workflowService = new WorkflowService(supabase);
    const n8nService = new N8nService(n8nCredentials);

    // Get workflow from database
    const { data: workflow, error } = await workflowService.getWorkflowWithNodes(id);
    
    if (error || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const n8nWorkflowId = workflow.config?.n8n_workflow_id;
    
    if (!n8nWorkflowId) {
      return NextResponse.json({
        synced: false,
        message: 'Workflow not synced with n8n',
      });
    }

    try {
      // Get n8n workflow status
      const { data: n8nWorkflow } = await n8nService.getWorkflow(n8nWorkflowId);

      // Get recent executions
      const { data: executions } = await n8nService.getExecutions(n8nWorkflowId);

      return NextResponse.json({
        synced: true,
        active: n8nWorkflow.active,
        lastSynced: workflow.config?.last_synced,
        executions: executions?.slice(0, 5) || [], // Last 5 executions
        n8nWorkflow: {
          id: n8nWorkflow.id,
          name: n8nWorkflow.name,
          active: n8nWorkflow.active,
          nodeCount: n8nWorkflow.nodes.length,
        },
      });
    } catch (error) {
      return NextResponse.json({
        synced: false,
        error: 'Failed to fetch n8n workflow status',
      });
    }
  } catch (error) {
    console.error('Error fetching workflow sync status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}