import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { ExecutionService } from '@/lib/services/execution.service';
import { CreateExecutionDTO, ExecutionFilter } from '@/lib/types/database';
import { getServerSession } from 'next-auth';

/**
 * GET /api/executions - Get all executions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const executionService = new ExecutionService(supabase);

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const filter: ExecutionFilter = {};

    const workflowId = searchParams.get('workflowId');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (workflowId) filter.workflowId = workflowId;
    if (status) filter.status = status as any;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;

    // Look up the user ID from the users table using email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { data, error } = await executionService.getExecutions(filter, user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/executions - Create a new execution
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();
    const executionService = new ExecutionService(supabase);

    const body: CreateExecutionDTO = await request.json();

    // Validate required fields
    if (!body.workflow_id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    // Look up the user ID from the users table using email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Add user_id to the execution
    const executionData = {
      ...body,
      user_id: user.id
    };

    const { data, error } = await executionService.createExecution(executionData);

    if (error) {
      console.error('Execution creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating execution:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}