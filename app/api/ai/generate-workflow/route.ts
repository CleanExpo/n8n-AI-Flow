import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This would integrate with OpenAI, Anthropic, or your preferred LLM
async function generateWorkflowFromPrompt(
  message: string,
  attachments: any[],
  _context: any[]
) {
  // For now, we'll create a sample workflow generator
  // In production, this would call your LLM API
  
  const workflow = {
    name: `AI Generated - ${message.slice(0, 30)}...`,
    nodes: [] as any[],
    connections: [] as any[],
    settings: {}
  };

  // Analyze the message to understand intent
  const lowerMessage = message.toLowerCase();
  
  // Pattern recognition for common automation scenarios
  if (lowerMessage.includes('email') || lowerMessage.includes('gmail')) {
    workflow.nodes.push({
      id: 'gmail_trigger',
      type: 'n8n-nodes-base.gmailTrigger',
      position: { x: 250, y: 300 },
      parameters: {
        pollTimes: { item: [{ mode: 'everyMinute' }] }
      }
    });
  }

  if (lowerMessage.includes('slack') || lowerMessage.includes('notify')) {
    workflow.nodes.push({
      id: 'slack_node',
      type: 'n8n-nodes-base.slack',
      position: { x: 450, y: 300 },
      parameters: {
        channel: '#general',
        text: 'Notification from automated workflow'
      }
    });
  }

  if (lowerMessage.includes('spreadsheet') || lowerMessage.includes('sheets')) {
    workflow.nodes.push({
      id: 'sheets_node',
      type: 'n8n-nodes-base.googleSheets',
      position: { x: 650, y: 300 },
      parameters: {
        operation: 'append',
        sheetId: ''
      }
    });
  }

  if (lowerMessage.includes('webhook') || lowerMessage.includes('api')) {
    workflow.nodes.push({
      id: 'webhook_trigger',
      type: 'n8n-nodes-base.webhook',
      position: { x: 250, y: 300 },
      parameters: {
        path: 'webhook-path',
        responseMode: 'onReceived',
        responseData: 'allEntries'
      }
    });
  }

  if (lowerMessage.includes('http') || lowerMessage.includes('request')) {
    workflow.nodes.push({
      id: 'http_request',
      type: 'n8n-nodes-base.httpRequest',
      position: { x: 450, y: 300 },
      parameters: {
        method: 'GET',
        url: '',
        authentication: 'none'
      }
    });
  }

  if (lowerMessage.includes('database') || lowerMessage.includes('sql')) {
    workflow.nodes.push({
      id: 'database_node',
      type: 'n8n-nodes-base.postgres',
      position: { x: 650, y: 300 },
      parameters: {
        operation: 'executeQuery'
      }
    });
  }

  // Process attachments
  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.type === 'image') {
        workflow.nodes.push({
          id: `image_process_${Date.now()}`,
          type: 'n8n-nodes-base.imageResize',
          position: { x: 450, y: 500 },
          parameters: {
            operation: 'resize',
            width: 800
          }
        });
      }
      
      if (attachment.type === 'file' && attachment.content) {
        try {
          const _parsed = JSON.parse(attachment.content);
          // If it's a JSON file, add appropriate nodes
          workflow.nodes.push({
            id: `json_parser_${Date.now()}`,
            type: 'n8n-nodes-base.set',
            position: { x: 450, y: 400 },
            parameters: {
              values: { string: [], number: [], boolean: [] }
            }
          });
        } catch {
          // Not JSON, might be CSV or text
          if (attachment.name.endsWith('.csv')) {
            workflow.nodes.push({
              id: `csv_parser_${Date.now()}`,
              type: 'n8n-nodes-base.spreadsheetFile',
              position: { x: 450, y: 400 },
              parameters: {
                operation: 'fromFile'
              }
            });
          }
        }
      }
    }
  }

  // Auto-connect nodes based on logical flow
  if (workflow.nodes.length > 1) {
    for (let i = 0; i < workflow.nodes.length - 1; i++) {
      workflow.connections.push({
        source: workflow.nodes[i].id,
        sourceHandle: 'output-0',
        target: workflow.nodes[i + 1].id,
        targetHandle: 'input-0'
      });
    }
  }

  // If no nodes were generated, create a basic template
  if (workflow.nodes.length === 0) {
    workflow.nodes = [
      {
        id: 'start',
        type: 'n8n-nodes-base.start',
        position: { x: 250, y: 300 },
        parameters: {}
      },
      {
        id: 'set_data',
        type: 'n8n-nodes-base.set',
        position: { x: 450, y: 300 },
        parameters: {
          values: {
            string: [
              {
                name: 'message',
                value: message
              }
            ]
          }
        }
      }
    ];
    
    workflow.connections = [{
      source: 'start',
      sourceHandle: 'output-0',
      target: 'set_data',
      targetHandle: 'input-0'
    }];
  }

  const explanation = generateExplanation(workflow, message);
  
  return { workflow, explanation };
}

function generateExplanation(workflow: any, _originalMessage: string): string {
  const nodeCount = workflow.nodes.length;
  const connectionCount = workflow.connections.length;
  
  let explanation = `I've created a workflow with ${nodeCount} nodes and ${connectionCount} connections based on your request. `;
  
  // Add specific explanations based on nodes
  const nodeTypes = workflow.nodes.map((n: any) => n.type);
  
  if (nodeTypes.includes('n8n-nodes-base.webhook')) {
    explanation += "The workflow starts with a webhook trigger that will listen for incoming requests. ";
  }
  
  if (nodeTypes.includes('n8n-nodes-base.gmailTrigger')) {
    explanation += "It monitors Gmail for new emails. ";
  }
  
  if (nodeTypes.includes('n8n-nodes-base.slack')) {
    explanation += "It sends notifications to Slack. ";
  }
  
  if (nodeTypes.includes('n8n-nodes-base.googleSheets')) {
    explanation += "Data is stored in Google Sheets. ";
  }
  
  explanation += "\n\nYou can preview the workflow, modify it, or deploy it directly to n8n. Would you like me to make any adjustments?";
  
  return explanation;
}

export async function POST(request: NextRequest) {
  console.log('API: /api/ai/generate-workflow called');
  
  try {
    const session = await getServerSession(authOptions);
    console.log('API: Session:', session?.user?.email || 'no session');
    
    // For now, allow demo mode if no session
    const isDemoMode = !session?.user;
    if (isDemoMode) {
      console.log('API: Running in demo mode (no auth required)');
    }

    const body = await request.json();
    console.log('API: Request body received:', { message: body.message?.substring(0, 50) });
    const { message, attachments, context } = body;

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      );
    }

    // Generate workflow using AI
    console.log('API: Generating workflow...');
    const result = await generateWorkflowFromPrompt(message, attachments, context);
    console.log('API: Workflow generated with', result.workflow?.nodes?.length || 0, 'nodes');

    // Store the generated workflow in database for history
    // await storeWorkflowGeneration(session.user.id, message, result.workflow);

    // Ensure consistent response structure
    const response = {
      workflow: result.workflow,
      explanation: result.explanation,
      success: true,
      metadata: {
        nodeCount: result.workflow?.nodes?.length || 0,
        connectionCount: result.workflow?.connections?.length || 0,
        generatedAt: new Date().toISOString(),
        processingTime: Date.now() - Date.now() // This would be calculated properly
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API: Workflow generation error:', error);
    
    // Return user-friendly error response
    const errorResponse = {
      success: false,
      error: 'Unable to generate workflow',
      userMessage: 'I had trouble creating your workflow. This could be due to a complex request or temporary service issues.',
      suggestions: [
        'Try simplifying your request',
        'Break complex workflows into smaller parts', 
        'Check if all required information is provided',
        'Try again in a moment'
      ],
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    };
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}