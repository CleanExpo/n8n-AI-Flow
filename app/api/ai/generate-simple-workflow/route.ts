import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client lazily to avoid build-time errors
let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    });
  }
  return openai;
}

const SYSTEM_PROMPT = `You are an n8n workflow expert. Generate complete, working n8n workflows from user descriptions.

IMPORTANT RULES:
1. Always return valid JSON that can be imported into n8n
2. Use real n8n node types and properties
3. Keep workflows simple and focused on the user's need
4. Include proper node connections
5. Add helpful descriptions and settings
6. Suggest next steps as interactive options

Common n8n nodes to use:
- Webhook (trigger)
- Schedule Trigger (cron)
- HTTP Request (API calls)
- Set (data manipulation)
- IF (conditional logic)
- Function (custom code)
- Email Send
- Slack
- Google Sheets
- Database nodes (MySQL, PostgreSQL, MongoDB)
- Wait (delays)
- Split In Batches (pagination)

Return format:
{
  "workflow": {
    "name": "string",
    "nodes": [...],
    "connections": {...},
    "settings": {...}
  },
  "explanation": "string",
  "nextSteps": [
    {
      "label": "string",
      "value": "string",
      "description": "string"
    }
  ]
}`;

export async function POST(request: NextRequest) {
  try {
    const { idea, context = null } = await request.json();

    if (!idea) {
      return NextResponse.json(
        { error: 'Idea is required' },
        { status: 400 }
      );
    }

    const userPrompt = context 
      ? `Previous context: ${JSON.stringify(context)}\n\nNew request: ${idea}`
      : `Create a workflow for: ${idea}`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the response
    let workflowData;
    try {
      workflowData = JSON.parse(response);
    } catch (parseError) {
      // If parsing fails, create a basic workflow
      workflowData = {
        workflow: {
          name: "AI Generated Workflow",
          nodes: [
            {
              id: "1",
              name: "Start",
              type: "n8n-nodes-base.start",
              position: [250, 300],
              parameters: {}
            },
            {
              id: "2",
              name: "Process",
              type: "n8n-nodes-base.set",
              position: [450, 300],
              parameters: {
                values: {
                  string: [
                    {
                      name: "data",
                      value: "={{$json}}"
                    }
                  ]
                }
              }
            }
          ],
          connections: {
            "Start": {
              "main": [
                [
                  {
                    "node": "Process",
                    "type": "main",
                    "index": 0
                  }
                ]
              ]
            }
          },
          settings: {
            executionOrder: "v1"
          }
        },
        explanation: `I'll help you create a workflow for: ${idea}`,
        nextSteps: [
          {
            label: "⚡ Choose Trigger Type",
            value: "add_trigger",
            description: "How should this workflow start? Options include: scheduled (run at specific times), webhook (triggered by external apps), manual (run on-demand), or when data changes in Google Sheets, databases, etc."
          },
          {
            label: "🔧 Add Data Processing",
            value: "add_processing",
            description: "Transform and manipulate your data - filter results, format text, calculate values, merge data from multiple sources, or use AI to analyze and enhance content."
          },
          {
            label: "📤 Set Up Output",
            value: "add_output",
            description: "Where should the results go? Send emails, post to Slack, update databases, create files in Google Drive, or send data to any API endpoint."
          },
          {
            label: "🧪 Test with Sample Data",
            value: "test",
            description: "Let's run your workflow with example data to see it in action. I'll show you exactly what happens at each step and help fix any issues."
          }
        ]
      };
    }

    return NextResponse.json(workflowData);
  } catch (error: any) {
    console.error('Workflow generation error:', error);
    
    // Return a fallback workflow even on error
    return NextResponse.json({
      workflow: {
        name: "Basic Workflow Template",
        nodes: [
          {
            id: "webhook",
            name: "Webhook",
            type: "n8n-nodes-base.webhook",
            position: [250, 300],
            parameters: {
              path: "webhook-path",
              responseMode: "onReceived",
              responseData: "allEntries"
            }
          },
          {
            id: "respond",
            name: "Respond to Webhook",
            type: "n8n-nodes-base.respondToWebhook",
            position: [450, 300],
            parameters: {
              respondWith: "json",
              responseBody: '{"success": true}'
            }
          }
        ],
        connections: {
          "Webhook": {
            "main": [
              [
                {
                  "node": "Respond to Webhook",
                  "type": "main",
                  "index": 0
                }
              ]
            ]
          }
        }
      },
      explanation: "I've created a basic workflow template. Let's customize it for your specific needs.",
      nextSteps: [
        {
          label: "📝 Describe Your Use Case",
          value: "describe_more",
          description: "Tell me more about what you want to automate. For example: 'I want to monitor my emails and save attachments to Google Drive' or 'I need to sync data between my CRM and spreadsheet daily'."
        },
        {
          label: "➕ Add Workflow Steps",
          value: "add_nodes",
          description: "Let's add specific functionality to your workflow. I can help you connect to services like Gmail, Slack, databases, AI models, or any API you need."
        },
        {
          label: "🎯 Set Up Your Trigger",
          value: "configure_trigger",
          description: "Choose how your workflow should start - on a schedule, when receiving data, manually, or when something specific happens in another app."
        }
      ],
      error: error.message
    });
  }
}