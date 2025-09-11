import { N8nWorkflowBuilder, N8N_NODE_TYPES } from './n8n-workflow-builder';

export interface WorkflowIntent {
  type: 'data_processing' | 'ai_automation' | 'scheduled_task' | 'webhook_api' | 'video_production' | 'email_automation' | 'database_sync';
  triggers: string[];
  actions: string[];
  conditions: string[];
  outputs: string[];
}

export class WorkflowGenerator {
  /**
   * Analyze user input to determine workflow intent
   */
  static analyzeIntent(input: string): WorkflowIntent {
    const lowercaseInput = input.toLowerCase();
    
    // Detect workflow type
    let type: WorkflowIntent['type'] = 'data_processing';
    if (lowercaseInput.includes('video') || lowercaseInput.includes('youtube')) {
      type = 'video_production';
    } else if (lowercaseInput.includes('ai') || lowercaseInput.includes('gpt') || lowercaseInput.includes('openai')) {
      type = 'ai_automation';
    } else if (lowercaseInput.includes('schedule') || lowercaseInput.includes('cron') || lowercaseInput.includes('daily') || lowercaseInput.includes('hourly')) {
      type = 'scheduled_task';
    } else if (lowercaseInput.includes('webhook') || lowercaseInput.includes('api')) {
      type = 'webhook_api';
    } else if (lowercaseInput.includes('email')) {
      type = 'email_automation';
    } else if (lowercaseInput.includes('database') || lowercaseInput.includes('sync')) {
      type = 'database_sync';
    }

    // Detect triggers
    const triggers: string[] = [];
    if (lowercaseInput.includes('webhook')) triggers.push('webhook');
    if (lowercaseInput.includes('schedule') || lowercaseInput.includes('daily') || lowercaseInput.includes('hourly')) triggers.push('schedule');
    if (lowercaseInput.includes('google sheets')) triggers.push('googlesheets');
    if (lowercaseInput.includes('email')) triggers.push('email');
    if (triggers.length === 0) triggers.push('manual');

    // Detect actions
    const actions: string[] = [];
    if (lowercaseInput.includes('send email')) actions.push('email');
    if (lowercaseInput.includes('slack')) actions.push('slack');
    if (lowercaseInput.includes('database')) actions.push('database');
    if (lowercaseInput.includes('api') || lowercaseInput.includes('http')) actions.push('http');
    if (lowercaseInput.includes('transform') || lowercaseInput.includes('process')) actions.push('transform');
    if (lowercaseInput.includes('ai') || lowercaseInput.includes('gpt')) actions.push('ai');

    // Detect conditions
    const conditions: string[] = [];
    if (lowercaseInput.includes('if') || lowercaseInput.includes('when') || lowercaseInput.includes('condition')) {
      conditions.push('if');
    }

    // Detect outputs
    const outputs: string[] = [];
    if (lowercaseInput.includes('email')) outputs.push('email');
    if (lowercaseInput.includes('slack')) outputs.push('slack');
    if (lowercaseInput.includes('database')) outputs.push('database');
    if (lowercaseInput.includes('file')) outputs.push('file');
    if (lowercaseInput.includes('webhook')) outputs.push('webhook');

    return { type, triggers, actions, conditions, outputs };
  }

  /**
   * Generate a workflow based on user input
   */
  static generateWorkflow(input: string): any {
    const intent = this.analyzeIntent(input);
    const builder = new N8nWorkflowBuilder(`Automated Workflow: ${input.substring(0, 50)}...`);
    
    let lastNode: string | null = null;

    // Add trigger based on intent
    if (intent.triggers.includes('webhook')) {
      lastNode = builder.addNode('Webhook Trigger', N8N_NODE_TYPES.WEBHOOK, {
        path: 'custom-webhook',
        responseMode: 'lastNode',
        responseData: 'allEntries'
      });
    } else if (intent.triggers.includes('schedule')) {
      const interval = input.includes('hourly') ? 1 : input.includes('daily') ? 24 : 1;
      lastNode = builder.addNode('Scheduled Trigger', N8N_NODE_TYPES.SCHEDULE_TRIGGER, {
        rule: {
          interval: [{
            field: 'hours',
            hoursInterval: interval
          }]
        }
      });
    } else if (intent.triggers.includes('googlesheets')) {
      lastNode = builder.addNode('Google Sheets', N8N_NODE_TYPES.GOOGLE_SHEETS, {
        operation: 'read',
        documentId: '{{ Enter your Google Sheet ID }}',
        sheetName: 'Sheet1'
      });
    } else {
      lastNode = builder.addNode('Manual Start', N8N_NODE_TYPES.MANUAL_TRIGGER);
    }

    // Add actions based on intent
    if (intent.actions.includes('http') || intent.type === 'webhook_api') {
      const httpNode = builder.addNode('API Request', N8N_NODE_TYPES.HTTP_REQUEST, {
        method: 'GET',
        url: 'https://api.example.com/data',
        authentication: 'none'
      });
      if (lastNode) builder.connect(lastNode, httpNode);
      lastNode = httpNode;
    }

    if (intent.actions.includes('ai') || intent.type === 'ai_automation') {
      const aiNode = builder.addNode('AI Processing', N8N_NODE_TYPES.OPENAI, {
        resource: 'chat',
        operation: 'message',
        model: 'gpt-4',
        messages: {
          values: [{
            role: 'system',
            content: 'You are a helpful assistant that processes data efficiently.'
          }, {
            role: 'user',
            content: '={{ $json.input || "Process this data" }}'
          }]
        }
      });
      if (lastNode) builder.connect(lastNode, aiNode);
      lastNode = aiNode;
    }

    if (intent.actions.includes('transform') || intent.type === 'data_processing') {
      const transformNode = builder.addNode('Transform Data', N8N_NODE_TYPES.CODE, {
        jsCode: `// Transform the data
const processedItems = items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    processedAt: new Date().toISOString()
  }
}));
return processedItems;`
      });
      if (lastNode) builder.connect(lastNode, transformNode);
      lastNode = transformNode;
    }

    // Add conditions if needed
    if (intent.conditions.includes('if')) {
      const conditionNode = builder.addNode('Check Condition', N8N_NODE_TYPES.IF, {
        conditions: {
          conditions: [{
            id: '1',
            leftValue: '={{ $json.status }}',
            rightValue: 'success',
            operator: {
              type: 'string',
              operation: 'equals'
            }
          }]
        }
      });
      if (lastNode) builder.connect(lastNode, conditionNode);
      lastNode = conditionNode;
    }

    // Add outputs based on intent
    if (intent.outputs.includes('email') || intent.type === 'email_automation') {
      const emailNode = builder.addNode('Send Email', N8N_NODE_TYPES.EMAIL, {
        sendTo: 'recipient@example.com',
        subject: 'Workflow Notification',
        message: 'Your workflow has completed successfully.\n\nResults: {{ $json }}'
      });
      if (lastNode) builder.connect(lastNode, emailNode);
      lastNode = emailNode;
    }

    if (intent.outputs.includes('slack')) {
      const slackNode = builder.addNode('Send to Slack', N8N_NODE_TYPES.SLACK, {
        resource: 'message',
        operation: 'post',
        channel: '#notifications',
        text: 'Workflow completed: {{ $json.message || "Success" }}'
      });
      if (lastNode) builder.connect(lastNode, slackNode);
      lastNode = slackNode;
    }

    if (intent.outputs.includes('database') || intent.type === 'database_sync') {
      const dbNode = builder.addNode('Save to Database', N8N_NODE_TYPES.POSTGRES, {
        operation: 'insert',
        table: 'workflow_results',
        columns: 'data,timestamp',
        values: '={{ $json }},={{ new Date().toISOString() }}'
      });
      if (lastNode) builder.connect(lastNode, dbNode);
      lastNode = dbNode;
    }

    // If it's a webhook trigger, add response node
    if (intent.triggers.includes('webhook')) {
      const respondNode = builder.addNode('Webhook Response', {
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1,
        parameters: {
          respondWith: 'json',
          responseBody: '={{ { "status": "success", "data": $json } }}'
        }
      });
      if (lastNode) builder.connect(lastNode, respondNode);
    }

    return builder.build();
  }

  /**
   * Generate a smart workflow based on OpenAI suggestions
   */
  static async generateSmartWorkflow(input: string, openaiResponse?: string): Promise<any> {
    // Parse OpenAI response if available
    if (openaiResponse) {
      try {
        const parsed = JSON.parse(openaiResponse);
        if (parsed.workflow) {
          return parsed.workflow;
        }
      } catch (e) {
        // If parsing fails, continue with fallback
      }
    }

    // Fallback to intent-based generation
    return this.generateWorkflow(input);
  }
}