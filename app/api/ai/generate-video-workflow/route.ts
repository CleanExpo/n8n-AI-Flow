import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { N8nWorkflowBuilder, N8N_NODE_TYPES } from '@/lib/n8n-workflow-builder';

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

const VIDEO_WORKFLOW_PROMPT = `You are an n8n workflow expert specializing in AI-powered video production workflows. Generate complete, working n8n workflows for automated video creation.

IMPORTANT VIDEO PRODUCTION NODES:
1. Triggers:
   - n8n-nodes-base.googleSheets (monitor new rows)
   - n8n-nodes-base.webhook (receive ideas via API)
   - n8n-nodes-base.scheduleTrigger (scheduled video creation)

2. AI & Content Generation:
   - n8n-nodes-base.openAi (script generation, content expansion)
   - @n8n/n8n-nodes-langchain.openai (advanced AI processing)
   - Custom HTTP Request nodes for:
     * Replicate API (text-to-video)
     * Runway ML (video generation)
     * Stability AI (image generation)
     * D-ID (avatar videos)

3. Audio Production:
   - HTTP Request to ElevenLabs API (voiceover)
   - HTTP Request to Mubert API (background music)
   - n8n-nodes-base.audioProcessing (if available)

4. Video Processing:
   - n8n-nodes-base.executeCommand (FFmpeg commands)
   - HTTP Request to Shotstack API (video editing)
   - HTTP Request to Creatomate API (video templates)

5. Publishing:
   - n8n-nodes-base.youtube (upload videos)
   - n8n-nodes-base.googleDrive (backup storage)
   - n8n-nodes-base.slack (notifications)

6. Data & Flow Control:
   - n8n-nodes-base.set (data transformation)
   - n8n-nodes-base.if (conditional logic)
   - n8n-nodes-base.splitInBatches (process multiple scenes)
   - n8n-nodes-base.merge (combine data streams)
   - n8n-nodes-base.function (custom JavaScript)
   - n8n-nodes-base.wait (timing control)

WORKFLOW STRUCTURE FOR VIDEO PRODUCTION:
1. Input Stage: Capture idea/prompt
2. Script Generation: Expand idea into detailed multi-scene script
3. Asset Creation (parallel):
   - Generate video clips for each scene
   - Create voiceover audio
   - Generate background music
   - Create sound effects
4. Assembly Stage:
   - Stitch video clips
   - Sync audio layers
   - Add transitions
5. Publishing Stage:
   - Generate metadata
   - Upload to YouTube
   - Send notifications

When user mentions video production, AI video, YouTube automation, or similar keywords, create a comprehensive workflow following this pattern.

For each node, include:
- Proper type (e.g., "n8n-nodes-base.googleSheets")
- typeVersion (usually 1 or 2)
- position: [x, y] where x increases by 200-250 per step
- parameters: relevant configuration
- credentials: placeholder names

Return format:
{
  "workflow": {
    "name": "AI Video Production Workflow",
    "nodes": [
      {
        "id": "unique-id",
        "name": "Node Name",
        "type": "n8n-nodes-base.nodeType",
        "typeVersion": 1,
        "position": [250, 300],
        "parameters": {}
      }
    ],
    "connections": {
      "Node Name": {
        "main": [
          [
            {
              "node": "Next Node Name",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    "settings": {
      "executionOrder": "v1"
    }
  },
  "message": "I've created a video production workflow with X stages...",
  "nextSteps": [
    {
      "label": "Configure AI Services",
      "value": "configure_ai",
      "description": "Set up API keys for AI services"
    }
  ]
}`;

export async function POST(req: NextRequest) {
  try {
    const { idea, context, action } = await req.json();
    
    // Check if this is a video production request
    const isVideoWorkflow = idea.toLowerCase().includes('video') || 
                           idea.toLowerCase().includes('youtube') ||
                           idea.toLowerCase().includes('ai-generated') ||
                           idea.toLowerCase().includes('automate') && idea.toLowerCase().includes('production');

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'dummy-key-for-build') {
      // Generate video workflow without OpenAI if it's a video request
      if (isVideoWorkflow) {
        return NextResponse.json(createVideoProductionTemplate(idea));
      }
      // Otherwise return a basic workflow
      return NextResponse.json(createBasicWorkflowTemplate(idea));
    }

    // Use video-specific prompt for video workflows
    const systemPrompt = isVideoWorkflow ? VIDEO_WORKFLOW_PROMPT : SYSTEM_PROMPT;
    
    const userPrompt = context 
      ? `Previous context: ${JSON.stringify(context)}\n\nNew request: ${idea}`
      : `Create a workflow for: ${idea}`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
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
      // If parsing fails, create a video production workflow template
      if (isVideoWorkflow) {
        workflowData = createVideoProductionTemplate(idea);
      } else {
        workflowData = createBasicWorkflowTemplate(idea);
      }
    }

    return NextResponse.json(workflowData);
  } catch (error) {
    console.error('Error generating workflow:', error);
    
    // Return a helpful error response with a template
    return NextResponse.json({
      workflow: createBasicWorkflowTemplate(''),
      message: 'I encountered an error but created a template workflow for you to customize.',
      nextSteps: [
        {
          label: 'Try again',
          value: 'retry',
          description: 'Regenerate the workflow'
        },
        {
          label: 'Manual setup',
          value: 'manual',
          description: 'Guide me through manual configuration'
        }
      ]
    });
  }
}

function createVideoProductionTemplate(idea: string) {
  const builder = new N8nWorkflowBuilder('AI Video Production Pipeline');
  
  // Add Google Sheets trigger to monitor for new video ideas
  const sheetsTrigger = builder.addNode('Video Ideas Sheet', {
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4,
    parameters: {
      operation: 'read',
      documentId: '{{ $credentials.documentId }}',
      sheetName: 'Ideas',
      options: {
        returnAll: true
      }
    }
  });
  builder.setNodePosition(sheetsTrigger, 250, 300);
  
  // Add OpenAI for script generation
  const scriptGen = builder.addNode('Generate Script', N8N_NODE_TYPES.OPENAI, {
    messages: {
      values: [{
        role: 'system',
        content: 'You are a professional video script writer. Create engaging scripts for YouTube videos.'
      }, {
        role: 'user',
        content: '={{ $json.idea }}'
      }]
    },
    model: 'gpt-4',
    options: {
      temperature: 0.7,
      maxTokens: 2000
    }
  });
  builder.setNodePosition(scriptGen, 500, 300);
  
  // Add scene splitter
  const sceneSplitter = builder.addNode('Split Into Scenes', N8N_NODE_TYPES.CODE, {
    jsCode: `// Split script into scenes for video generation
const script = items[0].json.choices[0].message.content;
const scenes = script.split('\\n\\n').filter(s => s.trim());
return scenes.map((scene, index) => ({
  json: {
    sceneNumber: index + 1,
    sceneText: scene,
    originalIdea: items[0].json.idea
  }
}));`
  });
  builder.setNodePosition(sceneSplitter, 750, 300);
  
  // Add video generation via Replicate API
  const videoGen = builder.addNode('Generate Video Clips', N8N_NODE_TYPES.HTTP_REQUEST, {
    method: 'POST',
    url: 'https://api.replicate.com/v1/predictions',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: {
      parameters: [{
        name: 'Authorization',
        value: '={{ "Token " + $credentials.replicateApiKey }}'
      }]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ { "version": "model-version-id", "input": { "prompt": $json.sceneText } } }}'
  });
  builder.setNodePosition(videoGen, 1000, 200);
  
  // Add voiceover generation via ElevenLabs
  const voiceGen = builder.addNode('Generate Voiceover', N8N_NODE_TYPES.HTTP_REQUEST, {
    method: 'POST',
    url: 'https://api.elevenlabs.io/v1/text-to-speech/voice-id',
    authentication: 'genericCredentialType',
    genericAuthType: 'httpHeaderAuth',
    sendHeaders: true,
    headerParameters: {
      parameters: [{
        name: 'xi-api-key',
        value: '={{ $credentials.elevenLabsApiKey }}'
      }]
    },
    sendBody: true,
    specifyBody: 'json',
    jsonBody: '={{ { "text": $json.sceneText, "voice_settings": { "stability": 0.5, "similarity_boost": 0.5 } } }}'
  });
  builder.setNodePosition(voiceGen, 1000, 400);
  
  // Add merge node to combine video and audio
  const merge = builder.addNode('Merge Media', N8N_NODE_TYPES.MERGE, {
    mode: 'combine',
    combinationMode: 'mergeByPosition'
  });
  builder.setNodePosition(merge, 1250, 300);
  
  // Add FFmpeg command to assemble video
  const assemble = builder.addNode('Assemble Video', N8N_NODE_TYPES.EXECUTE_COMMAND, {
    command: 'ffmpeg -i {{ $json.videoFile }} -i {{ $json.audioFile }} -c:v copy -c:a aac {{ $json.outputFile }}'
  });
  builder.setNodePosition(assemble, 1500, 300);
  
  // Add YouTube upload
  const youtube = builder.addNode('Upload to YouTube', {
    type: 'n8n-nodes-base.youtube',
    typeVersion: 2,
    parameters: {
      resource: 'video',
      operation: 'upload',
      title: '={{ $json.title }}',
      description: '={{ $json.description }}',
      tags: '={{ $json.tags }}',
      categoryId: '22',
      privacyStatus: 'private'
    }
  });
  builder.setNodePosition(youtube, 1750, 300);
  
  // Connect all nodes
  builder.connect(sheetsTrigger, scriptGen);
  builder.connect(scriptGen, sceneSplitter);
  builder.connect(sceneSplitter, videoGen);
  builder.connect(sceneSplitter, voiceGen);
  builder.connect(videoGen, merge, 0);
  builder.connect(voiceGen, merge, 0);
  builder.connect(merge, assemble);
  builder.connect(assemble, youtube);
  
  return {
    workflow: builder.build(),
    message: "🎬 I've created a complete AI video production workflow! This automated pipeline will:\n\n1. **Monitor Google Sheets** for new video ideas\n2. **Generate Scripts** using AI to expand your ideas into compelling narratives\n3. **Create Video Content** with AI-powered video generation (Replicate/Runway)\n4. **Generate Voiceovers** with natural-sounding AI voices (ElevenLabs)\n5. **Assemble Everything** using FFmpeg to create the final video\n6. **Publish to YouTube** automatically with optimized metadata\n\nThis workflow can produce professional videos without any manual editing!",
    nextSteps: [
      {
        label: "🔑 Configure API Keys",
        value: "configure_apis",
        description: "Essential first step! Connect your OpenAI (for scripts), ElevenLabs (for voice), Replicate (for videos), and YouTube accounts. Without these, the workflow can't generate content."
      },
      {
        label: "✏️ Customize Video Style",
        value: "customize_script",
        description: "Define your video's personality - tone of voice, visual style, target audience. This ensures consistent branding across all generated videos."
      },
      {
        label: "👁️ Add Human Review",
        value: "add_qa",
        description: "Add approval checkpoints before publishing. Great for maintaining quality - the workflow will pause for your review before going live."
      },
      {
        label: "🚀 Test with Real Example",
        value: "test",
        description: "Try it out! I'll walk you through generating your first video from idea to YouTube upload. We'll use a simple test topic to ensure everything works."
      }
    ]
  };
}

function createBasicWorkflowTemplate(idea: string) {
  return {
    workflow: {
      name: "Basic Workflow",
      nodes: [
        {
          id: "1",
          name: "Manual Trigger",
          type: "n8n-nodes-base.manualTrigger",
          typeVersion: 1,
          position: [250, 300],
          parameters: {}
        },
        {
          id: "2",
          name: "Process Data",
          type: "n8n-nodes-base.set",
          typeVersion: 1,
          position: [450, 300],
          parameters: {
            values: {
              string: [
                {
                  name: "data",
                  value: idea
                }
              ]
            }
          }
        }
      ],
      connections: {
        "Manual Trigger": {
          "main": [[{ "node": "Process Data", "type": "main", "index": 0 }]]
        }
      },
      settings: {}
    },
    message: "I've created a basic workflow template. Let's customize it for your needs.",
    nextSteps: [
      {
        label: "Add trigger",
        value: "add_trigger",
        description: "Choose how to start the workflow"
      },
      {
        label: "Add action",
        value: "add_action", 
        description: "Add nodes to process data"
      }
    ]
  };
}

// Also keep the original system prompt for non-video workflows
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
  "message": "string",
  "nextSteps": [
    {
      "label": "string",
      "value": "string",
      "description": "string"
    }
  ]
}`;