import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { ExecutionService } from '@/lib/services/execution.service';
import { N8nService } from '@/lib/services/n8n.service';
import { getServerSession } from 'next-auth';

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
 * POST /api/executions/[id]/stop - Stop a running execution
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = createAdminClient();
    const executionService = new ExecutionService(supabase);
    const n8nService = new N8nService(n8nCredentials);

    // Get execution details
    const { data: execution, error } = await executionService.getExecutionWithLogs(id);

    if (error || !execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Stop n8n execution if it exists
    // Check if n8n execution ID is stored in trigger_data
    if (execution.trigger_data?.n8n_execution_id) {
      try {
        // Note: n8n doesn't have a direct stop API, we'll mark it as cancelled in our DB
        // In production, you might want to implement a webhook or polling mechanism
        console.log('Stopping n8n execution:', execution.trigger_data.n8n_execution_id);
      } catch (n8nError) {
        console.error('Failed to stop n8n execution:', n8nError);
      }
    }

    // Update execution status to cancelled
    await executionService.updateExecutionStatus(
      id,
      'cancelled',
      null,
      'Execution cancelled by user'
    );

    // Add log entry
    await executionService.addExecutionLog(
      id,
      'warning',
      'Execution cancelled by user'
    );

    return NextResponse.json({ 
      success: true,
      message: 'Execution cancelled successfully'
    });
  } catch (error) {
    console.error('Error stopping execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}