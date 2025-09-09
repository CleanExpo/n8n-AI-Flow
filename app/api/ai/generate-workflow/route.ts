import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This would integrate with OpenAI, Anthropic, or your preferred LLM
async function generateWorkflowFromPrompt(
  message: string,
  attachments: any[],
  context: any[]
) {
  // For now, we'll create a sample workflow generator
  // In production, this would call your LLM API
  
  const workflow = {
    name: `AI Generated - ${message.slice(0, 30)}...`,
    nodes: [],
    connections: [],
    settings: {}
  };

  // Analyze the message to understand intent
  const lowerMessage = message.toLowerCase();
  
  // Pattern recognition for common automation scenarios
  if (lowerMessage.includes('email') || lowerMessage.includes('gmail')) {
    workflow.nodes.push({
      id: 'gmail_trigger',
      type: 'n8n-nodes-base.gmailTrigger',
      position: [250, 300],
      parameters: {
        pollTimes: { item: [{ mode: 'everyMinute' }] }
      }
    });
  }

  if (lowerMessage.includes('slack') || lowerMessage.includes('notify')) {
    workflow.nodes.push({
      id: 'slack_node',
      type: 'n8n-nodes-base.slack',
      position: [450, 300],
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
      position: [650, 300],
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
      position: [250, 300],
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
      position: [450, 300],
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
      position: [650, 300],
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
          position: [450, 500],
          parameters: {
            operation: 'resize',
            width: 800
          }
        });
      }
      
      if (attachment.type === 'file' && attachment.content) {
        try {
          const parsed = JSON.parse(attachment.content);
          // If it's a JSON file, add appropriate nodes
          workflow.nodes.push({
            id: `json_parser_${Date.now()}`,
            type: 'n8n-nodes-base.set',
            position: [450, 400],
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
              position: [450, 400],
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
        position: [250, 300],
        parameters: {}
      },
      {
        id: 'set_data',
        type: 'n8n-nodes-base.set',
        position: [450, 300],
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

function generateExplanation(workflow: any, originalMessage: string): string {
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
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, attachments, context } = body;

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message or attachments required' },
        { status: 400 }
      );
    }

    // Generate workflow using AI
    const result = await generateWorkflowFromPrompt(message, attachments, context);

    // Store the generated workflow in database for history
    // await storeWorkflowGeneration(session.user.id, message, result.workflow);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}