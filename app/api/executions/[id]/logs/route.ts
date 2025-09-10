import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { ExecutionService } from '@/lib/services/execution.service';
import { getServerSession } from 'next-auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/executions/[id]/logs - Get logs for an execution
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { data, error } = await executionService.getExecutionWithLogs(id);

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