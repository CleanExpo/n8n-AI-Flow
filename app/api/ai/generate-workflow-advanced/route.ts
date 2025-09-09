import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import OpenAI from 'openai';

// Initialize OpenAI if available
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  position: [number, number];
  parameters: Record<string, any>;
}

interface WorkflowConnection {
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

interface GeneratedWorkflow {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  name: string;
  description: string;
  tags: string[];
  confidence: number;
  suggestions: string[];
}

// N8n node templates
const nodeTemplates = {
  // Triggers
  webhook: {
    type: 'n8n-nodes-base.webhook',
    parameters: {
      path: 'webhook',
      responseMode: 'onReceived',
      responseData: 'allEntries'
    }
  },
  schedule: {
    type: 'n8n-nodes-base.cron',
    parameters: {
      triggerTimes: {
        item: [{
          mode: 'everyX',
          value: 1,
          unit: 'hours'
        }]
      }
    }
  },
  emailTrigger: {
    type: 'n8n-nodes-base.emailReadImap',
    parameters: {
      mailbox: 'INBOX',
      postProcessAction: 'nothing',
      options: {}
    }
  },
  
  // Actions
  httpRequest: {
    type: 'n8n-nodes-base.httpRequest',
    parameters: {
      method: 'GET',
      url: '',
      authentication: 'none',
      options: {}
    }
  },
  slack: {
    type: 'n8n-nodes-base.slack',
    parameters: {
      operation: 'post',
      channel: '#general',
      text: ''
    }
  },
  email: {
    type: 'n8n-nodes-base.emailSend',
    parameters: {
      fromEmail: '',
      toEmail: '',
      subject: '',
      text: ''
    }
  },
  sheets: {
    type: 'n8n-nodes-base.googleSheets',
    parameters: {
      operation: 'append',
      sheetId: '',
      range: 'A:Z'
    }
  },
  database: {
    type: 'n8n-nodes-base.postgres',
    parameters: {
      operation: 'executeQuery',
      query: ''
    }
  },
  
  // Logic
  ifNode: {
    type: 'n8n-nodes-base.if',
    parameters: {
      conditions: {
        string: [],
        number: [],
        boolean: []
      }
    }
  },
  switchNode: {
    type: 'n8n-nodes-base.switch',
    parameters: {
      dataType: 'string',
      value1: '',
      rules: {
        rules: []
      }
    }
  },
  merge: {
    type: 'n8n-nodes-base.merge',
    parameters: {
      mode: 'append'
    }
  },
  
  // Data Processing
  setNode: {
    type: 'n8n-nodes-base.set',
    parameters: {
      values: {
        string: [],
        number: [],
        boolean: []
      }
    }
  },
  functionNode: {
    type: 'n8n-nodes-base.function',
    parameters: {
      functionCode: 'return items;'
    }
  },
  itemLists: {
    type: 'n8n-nodes-base.itemLists',
    parameters: {
      operation: 'aggregateItems',
      aggregate: 'aggregateIndividualFields',
      options: {}
    }
  }
};

async function generateWorkflowWithOpenAI(
  prompt: string,
  context: any
): Promise<GeneratedWorkflow> {
  if (!openai) {
    throw new Error('OpenAI not configured');
  }

  const systemPrompt = `You are an n8n workflow automation expert. Generate a complete n8n workflow JSON structure based on the user's requirements.

Available node types:
- Triggers: webhook, cron (schedule), emailReadImap, gmailTrigger
- Communication: slack, emailSend, telegram, discord
- Data: googleSheets, postgres, mysql, mongodb, redis
- Logic: if, switch, merge, splitInBatches
- HTTP: httpRequest, graphql, webhook
- Transform: set, function, itemLists, code

Return a JSON object with:
{
  "nodes": [
    {
      "id": "node_0",
      "type": "n8n-nodes-base.webhook",
      "name": "Webhook Trigger",
      "position": [250, 300],
      "parameters": { ... }
    }
  ],
  "connections": [
    {
      "source": "node_0",
      "target": "node_1"
    }
  ],
  "name": "Workflow Name",
  "description": "What this workflow does",
  "tags": ["automation", "integration"],
  "confidence": 0.95,
  "suggestions": ["Consider adding error handling", "You might want to add data validation"]
}`;

  const userPrompt = `Create an n8n workflow for: ${prompt}

Context from uploaded files:
${JSON.stringify(context, null, 2).substring(0, 2000)}

Requirements:
1. Use appropriate trigger nodes based on the use case
2. Include necessary data transformations
3. Add error handling where appropriate
4. Use the correct node types and parameters
5. Position nodes logically (x: 250-1250, y: 100-900)
6. Create proper connections between nodes`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    // Validate and enhance the generated workflow
    return enhanceGeneratedWorkflow(result);
  } catch (error) {
    console.error('OpenAI generation error:', error);
    throw error;
  }
}

function enhanceGeneratedWorkflow(workflow: any): GeneratedWorkflow {
  // Ensure all required fields exist
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    workflow.nodes = [];
  }
  
  if (!workflow.connections || !Array.isArray(workflow.connections)) {
    workflow.connections = [];
  }
  
  // Add IDs if missing
  workflow.nodes = workflow.nodes.map((node: any, index: number) => ({
    id: node.id || `node_${index}`,
    type: node.type || 'n8n-nodes-base.noOp',
    name: node.name || `Node ${index + 1}`,
    position: node.position || [250 + (index * 200), 300],
    parameters: node.parameters || {}
  }));
  
  // Validate connections
  workflow.connections = workflow.connections.filter((conn: any) => {
    const sourceExists = workflow.nodes.some((n: any) => n.id === conn.source);
    const targetExists = workflow.nodes.some((n: any) => n.id === conn.target);
    return sourceExists && targetExists;
  });
  
  return {
    nodes: workflow.nodes,
    connections: workflow.connections,
    name: workflow.name || 'Generated Workflow',
    description: workflow.description || 'AI-generated workflow',
    tags: workflow.tags || ['ai-generated'],
    confidence: workflow.confidence || 0.8,
    suggestions: workflow.suggestions || []
  };
}

function generateWorkflowFromPatterns(
  message: string,
  fileContent?: string,
  attachments?: any[]
): GeneratedWorkflow {
  const nodes: WorkflowNode[] = [];
  const connections: WorkflowConnection[] = [];
  const tags: string[] = [];
  const suggestions: string[] = [];
  
  const lowerMessage = message.toLowerCase();
  const combinedText = `${lowerMessage} ${fileContent?.toLowerCase() || ''}`;
  
  let nodeIdCounter = 0;
  let yPosition = 100;
  
  // Determine trigger type
  let triggerId: string | null = null;
  
  if (combinedText.includes('webhook') || combinedText.includes('api')) {
    triggerId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: triggerId,
      type: 'n8n-nodes-base.webhook',
      name: 'Webhook Trigger',
      position: [250, yPosition],
      parameters: nodeTemplates.webhook.parameters
    });
    tags.push('webhook', 'api');
    yPosition += 150;
  } else if (combinedText.includes('schedule') || combinedText.includes('daily') || 
             combinedText.includes('weekly') || combinedText.includes('cron')) {
    triggerId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: triggerId,
      type: 'n8n-nodes-base.cron',
      name: 'Schedule Trigger',
      position: [250, yPosition],
      parameters: nodeTemplates.schedule.parameters
    });
    tags.push('schedule', 'cron');
    yPosition += 150;
  } else if (combinedText.includes('email') && combinedText.includes('receive')) {
    triggerId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: triggerId,
      type: 'n8n-nodes-base.emailReadImap',
      name: 'Email Trigger',
      position: [250, yPosition],
      parameters: nodeTemplates.emailTrigger.parameters
    });
    tags.push('email', 'trigger');
    yPosition += 150;
  } else {
    // Default to webhook trigger
    triggerId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: triggerId,
      type: 'n8n-nodes-base.webhook',
      name: 'Start Workflow',
      position: [250, yPosition],
      parameters: nodeTemplates.webhook.parameters
    });
    yPosition += 150;
  }
  
  let lastNodeId = triggerId;
  
  // Add data processing if needed
  if (combinedText.includes('transform') || combinedText.includes('process') || 
      combinedText.includes('format')) {
    const transformId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: transformId,
      type: 'n8n-nodes-base.function',
      name: 'Process Data',
      position: [250, yPosition],
      parameters: {
        functionCode: `// Process the incoming data
const processedItems = items.map(item => {
  // Add your transformation logic here
  return {
    json: {
      ...item.json,
      processed: true,
      timestamp: new Date().toISOString()
    }
  };
});

return processedItems;`
      }
    });
    
    connections.push({
      source: lastNodeId,
      target: transformId
    });
    
    lastNodeId = transformId;
    tags.push('transform', 'data-processing');
    yPosition += 150;
  }
  
  // Add conditional logic if mentioned
  if (combinedText.includes('if') || combinedText.includes('condition') || 
      combinedText.includes('check')) {
    const ifId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: ifId,
      type: 'n8n-nodes-base.if',
      name: 'Check Condition',
      position: [250, yPosition],
      parameters: {
        conditions: {
          string: [{
            value1: '={{$json["status"]}}',
            operation: 'equals',
            value2: 'active'
          }]
        }
      }
    });
    
    connections.push({
      source: lastNodeId,
      target: ifId
    });
    
    lastNodeId = ifId;
    tags.push('conditional', 'logic');
    suggestions.push('Configure the condition parameters based on your data structure');
    yPosition += 150;
  }
  
  // Add actions based on keywords
  const actions = [];
  
  if (combinedText.includes('slack')) {
    actions.push({
      type: 'slack',
      name: 'Send to Slack'
    });
    tags.push('slack', 'notification');
  }
  
  if (combinedText.includes('email') && combinedText.includes('send')) {
    actions.push({
      type: 'email',
      name: 'Send Email'
    });
    tags.push('email', 'notification');
  }
  
  if (combinedText.includes('sheet') || combinedText.includes('spreadsheet')) {
    actions.push({
      type: 'sheets',
      name: 'Update Spreadsheet'
    });
    tags.push('google-sheets', 'spreadsheet');
  }
  
  if (combinedText.includes('database') || combinedText.includes('sql')) {
    actions.push({
      type: 'database',
      name: 'Database Operation'
    });
    tags.push('database', 'sql');
  }
  
  if (combinedText.includes('http') || combinedText.includes('request') || 
      combinedText.includes('api call')) {
    actions.push({
      type: 'httpRequest',
      name: 'HTTP Request'
    });
    tags.push('http', 'api');
  }
  
  // Add action nodes
  actions.forEach(action => {
    const actionId = `node_${nodeIdCounter++}`;
    const template = nodeTemplates[action.type as keyof typeof nodeTemplates];
    
    nodes.push({
      id: actionId,
      type: template.type,
      name: action.name,
      position: [250, yPosition],
      parameters: template.parameters
    });
    
    connections.push({
      source: lastNodeId,
      target: actionId
    });
    
    lastNodeId = actionId;
    yPosition += 150;
  });
  
  // If no actions were added, add a default response node
  if (actions.length === 0) {
    const responseId = `node_${nodeIdCounter++}`;
    nodes.push({
      id: responseId,
      type: 'n8n-nodes-base.respondToWebhook',
      name: 'Send Response',
      position: [250, yPosition],
      parameters: {
        respondWith: 'json',
        responseBody: '={{ { "success": true, "message": "Workflow completed" } }}'
      }
    });
    
    connections.push({
      source: lastNodeId,
      target: responseId
    });
    
    suggestions.push('Add specific actions based on your requirements');
  }
  
  // Add suggestions based on what's missing
  if (!combinedText.includes('error')) {
    suggestions.push('Consider adding error handling nodes');
  }
  
  if (nodes.length > 5) {
    suggestions.push('Complex workflow detected - consider breaking into sub-workflows');
  }
  
  if (!combinedText.includes('test')) {
    suggestions.push('Remember to test the workflow with sample data');
  }
  
  return {
    nodes,
    connections,
    name: generateWorkflowName(combinedText),
    description: generateWorkflowDescription(combinedText, nodes),
    tags: [...new Set(tags)],
    confidence: calculateConfidence(nodes, connections),
    suggestions
  };
}

function generateWorkflowName(text: string): string {
  if (text.includes('slack') && text.includes('email')) {
    return 'Email to Slack Notification';
  }
  if (text.includes('sheet') && text.includes('database')) {
    return 'Spreadsheet Database Sync';
  }
  if (text.includes('webhook') && text.includes('process')) {
    return 'Webhook Data Processor';
  }
  if (text.includes('schedule') && text.includes('report')) {
    return 'Scheduled Report Generator';
  }
  return 'Custom Automation Workflow';
}

function generateWorkflowDescription(text: string, nodes: WorkflowNode[]): string {
  const triggers = nodes.filter(n => n.type.includes('Trigger') || n.type.includes('webhook') || n.type.includes('cron'));
  const actions = nodes.filter(n => !n.type.includes('Trigger') && !n.type.includes('webhook') && !n.type.includes('cron'));
  
  let description = 'This workflow ';
  
  if (triggers.length > 0) {
    description += `starts with a ${triggers[0].name} `;
  }
  
  if (actions.length > 0) {
    description += `and performs ${actions.length} action(s): `;
    description += actions.map(a => a.name).join(', ');
  }
  
  return description + '.';
}

function calculateConfidence(nodes: WorkflowNode[], connections: WorkflowConnection[]): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on completeness
  if (nodes.length > 0) confidence += 0.1;
  if (nodes.length > 2) confidence += 0.1;
  if (connections.length >= nodes.length - 1) confidence += 0.2; // Properly connected
  if (nodes.some(n => n.type.includes('Trigger') || n.type.includes('webhook'))) confidence += 0.1;
  
  return Math.min(confidence, 0.95);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, fileContent, attachments, context, useAI = true } = await request.json();

    let workflow: GeneratedWorkflow;

    // Try to use OpenAI if available and requested
    if (useAI && openai) {
      try {
        workflow = await generateWorkflowWithOpenAI(message, { fileContent, attachments, ...context });
      } catch (error) {
        console.error('AI generation failed, falling back to pattern matching:', error);
        workflow = generateWorkflowFromPatterns(message, fileContent, attachments);
      }
    } else {
      // Use pattern-based generation
      workflow = generateWorkflowFromPatterns(message, fileContent, attachments);
    }

    // Add metadata
    const result = {
      ...workflow,
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: useAI && openai ? 'ai' : 'patterns',
        userId: session.user.id || session.user.email
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Workflow generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate workflow' },
      { status: 500 }
    );
  }
}