import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/client';
import { ExecutionService } from '@/lib/services/execution.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/workflows/[id]/executions - Get all executions for a workflow
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const executionService = new ExecutionService(supabase);

    try {
      const data = await executionService.getExecutions({ workflowId: id }, 1, 20);
      return NextResponse.json({ data });
    } catch (execError: any) {
      console.error('Execution fetch error:', execError);
      return NextResponse.json(
        { error: execError.message || 'Failed to fetch workflow executions' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching workflow executions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}