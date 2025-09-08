import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { WorkflowService } from '@/lib/services/workflow.service';
import { CreateWorkflowDTO, WorkflowFilter } from '@/lib/types/database';
import { getServerSession } from 'next-auth';

/**
 * GET /api/workflows - Get all workflows for the current user
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
    const workflowService = new WorkflowService(supabase);

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const filter: WorkflowFilter = {};

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');

    if (status) filter.status = status as any;
    if (search) filter.search = search;
    if (tags) filter.tags = tags.split(',');

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

    // Add user filter
    filter.userId = user.id;

    const { data, error } = await workflowService.getWorkflows(filter);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows - Create a new workflow
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
    const workflowService = new WorkflowService(supabase);

    const body: CreateWorkflowDTO = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Workflow name is required' },
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

    // Add user_id to the workflow
    const workflowData = {
      ...body,
      user_id: user.id
    };

    const { data, error } = await workflowService.createWorkflow(workflowData);

    if (error) {
      console.error('Workflow creation error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}