import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/client';
import { ExecutionService } from '@/lib/services/execution.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/executions/[id]/logs - Get logs for an execution
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createRouteHandlerClient();
    const executionService = new ExecutionService(supabase);

    const { data, error } = await executionService.getExecutionLogs(id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}