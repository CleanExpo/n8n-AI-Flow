import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

    const completion = await openai.chat.completions.create({
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
            label: "Add trigger",
            value: "add_trigger",
            description: "Configure when this workflow should run"
          },
          {
            label: "Add processing",
            value: "add_processing",
            description: "Add data transformation steps"
          },
          {
            label: "Add output",
            value: "add_output",
            description: "Configure where to send results"
          },
          {
            label: "Test workflow",
            value: "test",
            description: "Run with sample data"
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
          label: "Describe your use case",
          value: "describe_more",
          description: "Tell me more about what you want to automate"
        },
        {
          label: "Add nodes",
          value: "add_nodes",
          description: "Add specific functionality"
        },
        {
          label: "Configure trigger",
          value: "configure_trigger",
          description: "Set up how to start the workflow"
        }
      ],
      error: error.message
    });
  }
}