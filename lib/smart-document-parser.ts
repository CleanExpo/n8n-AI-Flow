import { ExtractedContent } from './content-extraction';

export interface WorkflowStep {
  id: string;
  type: 'trigger' | 'action' | 'condition' | 'transform' | 'output';
  nodeType: string;
  label: string;
  description: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
  confidence: number;
  sourceText?: string;
}

export interface WorkflowConnection {
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  condition?: string;
}

export interface GeneratedWorkflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  connections: WorkflowConnection[];
  metadata: {
    sourceFiles: string[];
    generatedAt: Date;
    confidence: number;
    complexity: 'simple' | 'medium' | 'complex';
    category: string;
  };
}

export interface SmartParsingOptions {
  preferredNodes?: string[];
  includeExamples?: boolean;
  generateAlternatives?: boolean;
  optimizeForPerformance?: boolean;
  targetPlatform?: 'n8n' | 'zapier' | 'generic';
}

export class SmartDocumentParser {
  private options: SmartParsingOptions;
  private nodeLibrary: Map<string, any>;

  constructor(options: SmartParsingOptions = {}) {
    this.options = {
      preferredNodes: [],
      includeExamples: true,
      generateAlternatives: false,
      optimizeForPerformance: true,
      targetPlatform: 'n8n',
      ...options
    };
    
    this.initializeNodeLibrary();
  }

  async generateWorkflowFromContent(
    contents: ExtractedContent[], 
    userIntent?: string
  ): Promise<GeneratedWorkflow> {
    
    // Analyze all content to understand the automation intent
    const analysisResults = contents.map(content => this.analyzeContent(content));
    const combinedAnalysis = this.combineAnalysis(analysisResults);
    
    // Generate workflow steps based on analysis
    const steps = await this.generateWorkflowSteps(combinedAnalysis, userIntent);
    
    // Create logical connections between steps
    const connections = this.generateConnections(steps);
    
    // Optimize and validate the workflow
    const optimizedWorkflow = this.optimizeWorkflow(steps, connections);
    
    return {
      id: `workflow_${Date.now()}`,
      name: this.generateWorkflowName(combinedAnalysis, userIntent),
      description: this.generateWorkflowDescription(combinedAnalysis, userIntent),
      steps: optimizedWorkflow.steps,
      connections: optimizedWorkflow.connections,
      metadata: {
        sourceFiles: contents.map(c => c.metadata.type || 'unknown'),
        generatedAt: new Date(),
        confidence: this.calculateOverallConfidence(optimizedWorkflow.steps),
        complexity: this.assessComplexity(optimizedWorkflow.steps),
        category: this.categorizeWorkflow(combinedAnalysis)
      }
    };
  }

  private initializeNodeLibrary() {
    this.nodeLibrary = new Map([
      // Trigger nodes
      ['email_trigger', {
        type: 'n8n-nodes-base.gmailTrigger',
        category: 'trigger',
        keywords: ['email', 'gmail', 'inbox', 'mail', 'message'],
        confidence: 0.9
      }],
      ['webhook_trigger', {
        type: 'n8n-nodes-base.webhook',
        category: 'trigger',
        keywords: ['webhook', 'api', 'http', 'endpoint', 'request'],
        confidence: 0.9
      }],
      ['schedule_trigger', {
        type: 'n8n-nodes-base.cron',
        category: 'trigger',
        keywords: ['schedule', 'cron', 'daily', 'weekly', 'monthly', 'recurring', 'periodic'],
        confidence: 0.8
      }],
      ['file_trigger', {
        type: 'n8n-nodes-base.fileSystemTrigger',
        category: 'trigger',
        keywords: ['file', 'folder', 'directory', 'watch', 'monitor'],
        confidence: 0.8
      }],
      
      // Action nodes
      ['slack_notify', {
        type: 'n8n-nodes-base.slack',
        category: 'action',
        keywords: ['slack', 'notify', 'message', 'channel', 'team'],
        confidence: 0.9
      }],
      ['email_send', {
        type: 'n8n-nodes-base.gmail',
        category: 'action',
        keywords: ['send', 'email', 'mail', 'notify', 'alert'],
        confidence: 0.9
      }],
      ['sheets_update', {
        type: 'n8n-nodes-base.googleSheets',
        category: 'action',
        keywords: ['sheet', 'spreadsheet', 'excel', 'data', 'row', 'column'],
        confidence: 0.9
      }],
      ['database_query', {
        type: 'n8n-nodes-base.postgres',
        category: 'action',
        keywords: ['database', 'sql', 'query', 'insert', 'update', 'select'],
        confidence: 0.8
      }],
      ['http_request', {
        type: 'n8n-nodes-base.httpRequest',
        category: 'action',
        keywords: ['api', 'request', 'get', 'post', 'put', 'delete', 'http'],
        confidence: 0.9
      }],
      
      // Transform nodes
      ['data_transform', {
        type: 'n8n-nodes-base.set',
        category: 'transform',
        keywords: ['transform', 'set', 'modify', 'change', 'convert'],
        confidence: 0.7
      }],
      ['code_execute', {
        type: 'n8n-nodes-base.code',
        category: 'transform',
        keywords: ['code', 'javascript', 'function', 'custom', 'logic'],
        confidence: 0.8
      }],
      ['json_parse', {
        type: 'n8n-nodes-base.json',
        category: 'transform',
        keywords: ['json', 'parse', 'extract', 'format'],
        confidence: 0.8
      }],
      
      // Condition nodes
      ['if_condition', {
        type: 'n8n-nodes-base.if',
        category: 'condition',
        keywords: ['if', 'condition', 'when', 'check', 'validate'],
        confidence: 0.9
      }],
      ['switch_condition', {
        type: 'n8n-nodes-base.switch',
        category: 'condition',
        keywords: ['switch', 'case', 'multiple', 'route', 'branch'],
        confidence: 0.8
      }]
    ]);
  }

  private analyzeContent(content: ExtractedContent) {
    const analysis = {
      triggers: this.identifyTriggers(content),
      actions: this.identifyActions(content),
      dataFlow: this.analyzeDataFlow(content),
      businessProcess: this.extractBusinessProcess(content),
      apis: content.apis || [],
      workflows: content.workflows || [],
      confidence: 0
    };

    analysis.confidence = this.calculateAnalysisConfidence(analysis);
    return analysis;
  }

  private identifyTriggers(content: ExtractedContent) {
    const triggers: any[] = [];
    const text = content.text.toLowerCase();

    // Email triggers
    if (text.includes('email') || text.includes('gmail') || text.includes('inbox')) {
      triggers.push({
        type: 'email_trigger',
        confidence: 0.8,
        evidence: ['email', 'gmail', 'inbox'].filter(keyword => text.includes(keyword))
      });
    }

    // Webhook triggers
    if (text.includes('webhook') || text.includes('api') || text.includes('endpoint')) {
      triggers.push({
        type: 'webhook_trigger',
        confidence: 0.9,
        evidence: ['webhook', 'api', 'endpoint'].filter(keyword => text.includes(keyword))
      });
    }

    // Schedule triggers
    const scheduleKeywords = ['daily', 'weekly', 'monthly', 'schedule', 'cron', 'recurring'];
    const scheduleMatches = scheduleKeywords.filter(keyword => text.includes(keyword));
    if (scheduleMatches.length > 0) {
      triggers.push({
        type: 'schedule_trigger',
        confidence: 0.7 + (scheduleMatches.length * 0.1),
        evidence: scheduleMatches
      });
    }

    // File system triggers
    if (text.includes('file') && (text.includes('watch') || text.includes('monitor'))) {
      triggers.push({
        type: 'file_trigger',
        confidence: 0.8,
        evidence: ['file', 'watch', 'monitor'].filter(keyword => text.includes(keyword))
      });
    }

    return triggers;
  }

  private identifyActions(content: ExtractedContent) {
    const actions: any[] = [];
    const text = content.text.toLowerCase();

    // Slack notifications
    if (text.includes('slack') || text.includes('notify') || text.includes('alert')) {
      actions.push({
        type: 'slack_notify',
        confidence: 0.8,
        evidence: ['slack', 'notify', 'alert'].filter(keyword => text.includes(keyword))
      });
    }

    // Email sending
    if ((text.includes('send') && text.includes('email')) || text.includes('mail')) {
      actions.push({
        type: 'email_send',
        confidence: 0.9,
        evidence: ['send email', 'mail']
      });
    }

    // Spreadsheet operations
    if (text.includes('sheet') || text.includes('spreadsheet') || text.includes('excel')) {
      actions.push({
        type: 'sheets_update',
        confidence: 0.8,
        evidence: ['sheet', 'spreadsheet', 'excel'].filter(keyword => text.includes(keyword))
      });
    }

    // Database operations
    if (text.includes('database') || text.includes('sql') || text.includes('query')) {
      actions.push({
        type: 'database_query',
        confidence: 0.8,
        evidence: ['database', 'sql', 'query'].filter(keyword => text.includes(keyword))
      });
    }

    // HTTP requests
    if (text.includes('api') && (text.includes('request') || text.includes('call'))) {
      actions.push({
        type: 'http_request',
        confidence: 0.9,
        evidence: ['api request', 'api call']
      });
    }

    return actions;
  }

  private analyzeDataFlow(content: ExtractedContent) {
    const dataFlow = {
      inputs: [] as string[],
      outputs: [] as string[],
      transformations: [] as string[]
    };

    // Analyze tables and structured data
    if (content.tables && content.tables.length > 0) {
      content.tables.forEach(table => {
        if (Array.isArray(table) && table.length > 0) {
          const headers = typeof table[0] === 'object' ? Object.keys(table[0]) : [];
          dataFlow.inputs.push(...headers);
        }
      });
    }

    // Look for data transformation patterns in text
    const text = content.text.toLowerCase();
    const transformPatterns = [
      'transform', 'convert', 'format', 'parse', 'extract', 'filter', 'map', 'reduce'
    ];
    
    transformPatterns.forEach(pattern => {
      if (text.includes(pattern)) {
        dataFlow.transformations.push(pattern);
      }
    });

    return dataFlow;
  }

  private extractBusinessProcess(content: ExtractedContent) {
    const process = {
      steps: [] as string[],
      conditions: [] as string[],
      actors: [] as string[]
    };

    if (content.structure?.procedures) {
      content.structure.procedures.forEach((procedure: string[]) => {
        process.steps.push(...procedure);
      });
    }

    // Extract conditions from text
    const text = content.text.toLowerCase();
    const conditionPatterns = /(?:if|when|unless|in case)\s+([^.!?]+)/g;
    const conditionMatches = [...text.matchAll(conditionPatterns)];
    process.conditions = conditionMatches.map(match => match[1].trim());

    return process;
  }

  private combineAnalysis(analyses: any[]) {
    const combined = {
      triggers: [] as any[],
      actions: [] as any[],
      dataFlow: {
        inputs: [] as string[],
        outputs: [] as string[],
        transformations: [] as string[]
      },
      businessProcess: {
        steps: [] as string[],
        conditions: [] as string[],
        actors: [] as string[]
      },
      apis: [] as any[],
      workflows: [] as any[],
      overallConfidence: 0
    };

    analyses.forEach(analysis => {
      combined.triggers.push(...analysis.triggers);
      combined.actions.push(...analysis.actions);
      combined.dataFlow.inputs.push(...analysis.dataFlow.inputs);
      combined.dataFlow.outputs.push(...analysis.dataFlow.outputs);
      combined.dataFlow.transformations.push(...analysis.dataFlow.transformations);
      combined.businessProcess.steps.push(...analysis.businessProcess.steps);
      combined.businessProcess.conditions.push(...analysis.businessProcess.conditions);
      combined.apis.push(...analysis.apis);
      combined.workflows.push(...analysis.workflows);
    });

    // Remove duplicates and calculate overall confidence
    combined.triggers = this.removeDuplicatesByType(combined.triggers);
    combined.actions = this.removeDuplicatesByType(combined.actions);
    combined.overallConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;

    return combined;
  }

  private async generateWorkflowSteps(analysis: any, userIntent?: string): Promise<WorkflowStep[]> {
    const steps: WorkflowStep[] = [];
    let stepCounter = 0;

    // Generate trigger steps
    if (analysis.triggers.length > 0) {
      const primaryTrigger = analysis.triggers.sort((a: any, b: any) => b.confidence - a.confidence)[0];
      const nodeConfig = this.nodeLibrary.get(primaryTrigger.type);
      
      if (nodeConfig) {
        steps.push({
          id: `step_${stepCounter++}`,
          type: 'trigger',
          nodeType: nodeConfig.type,
          label: this.generateStepLabel(primaryTrigger.type),
          description: this.generateStepDescription(primaryTrigger, userIntent),
          parameters: this.generateParameters(primaryTrigger.type, analysis),
          confidence: primaryTrigger.confidence,
          sourceText: primaryTrigger.evidence?.join(', ')
        });
      }
    }

    // Add data transformation steps if needed
    if (analysis.dataFlow.transformations.length > 0) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'transform',
        nodeType: 'n8n-nodes-base.set',
        label: 'Transform Data',
        description: 'Transform and format the incoming data',
        parameters: this.generateTransformParameters(analysis.dataFlow),
        confidence: 0.7,
        sourceText: analysis.dataFlow.transformations.join(', ')
      });
    }

    // Add condition steps if business logic detected
    if (analysis.businessProcess.conditions.length > 0) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'condition',
        nodeType: 'n8n-nodes-base.if',
        label: 'Check Condition',
        description: `Evaluate: ${analysis.businessProcess.conditions[0]}`,
        parameters: this.generateConditionParameters(analysis.businessProcess.conditions[0]),
        confidence: 0.6,
        sourceText: analysis.businessProcess.conditions[0]
      });
    }

    // Generate action steps
    analysis.actions.forEach((action: any) => {
      const nodeConfig = this.nodeLibrary.get(action.type);
      if (nodeConfig) {
        steps.push({
          id: `step_${stepCounter++}`,
          type: 'action',
          nodeType: nodeConfig.type,
          label: this.generateStepLabel(action.type),
          description: this.generateStepDescription(action, userIntent),
          parameters: this.generateParameters(action.type, analysis),
          confidence: action.confidence,
          sourceText: action.evidence?.join(', ')
        });
      }
    });

    // Ensure we have at least a basic workflow
    if (steps.length === 0) {
      steps.push({
        id: `step_${stepCounter++}`,
        type: 'trigger',
        nodeType: 'n8n-nodes-base.webhook',
        label: 'Webhook Trigger',
        description: 'Start workflow from webhook',
        parameters: { path: 'start-workflow' },
        confidence: 0.5
      });
    }

    // Add positions for visual layout
    steps.forEach((step, index) => {
      step.position = {
        x: 300 + (index * 200),
        y: 300
      };
    });

    return steps;
  }

  private generateConnections(steps: WorkflowStep[]): WorkflowConnection[] {
    const connections: WorkflowConnection[] = [];

    // Create linear connections between steps
    for (let i = 0; i < steps.length - 1; i++) {
      const currentStep = steps[i];
      const nextStep = steps[i + 1];

      connections.push({
        source: currentStep.id,
        target: nextStep.id,
        sourceHandle: 'main',
        targetHandle: 'main'
      });
    }

    // Add conditional branches if there are condition nodes
    steps.forEach((step, index) => {
      if (step.type === 'condition') {
        // Find the next action step for the "true" branch
        const nextActionIndex = steps.findIndex((s, i) => i > index && s.type === 'action');
        if (nextActionIndex !== -1) {
          connections.push({
            source: step.id,
            target: steps[nextActionIndex].id,
            sourceHandle: 'true',
            targetHandle: 'main',
            label: 'Yes'
          });
        }
      }
    });

    return connections;
  }

  private optimizeWorkflow(steps: WorkflowStep[], connections: WorkflowConnection[]) {
    // Remove duplicate steps
    const uniqueSteps = this.removeDuplicateSteps(steps);
    
    // Optimize connections based on remaining steps
    const validConnections = connections.filter(conn => 
      uniqueSteps.some(step => step.id === conn.source) &&
      uniqueSteps.some(step => step.id === conn.target)
    );

    // Ensure performance optimization if requested
    if (this.options.optimizeForPerformance) {
      this.optimizeForPerformance(uniqueSteps);
    }

    return {
      steps: uniqueSteps,
      connections: validConnections
    };
  }

  private generateWorkflowName(analysis: any, userIntent?: string): string {
    if (userIntent) {
      return `AI Generated: ${userIntent.slice(0, 50)}`;
    }

    const triggers = analysis.triggers.map((t: any) => t.type);
    const actions = analysis.actions.map((a: any) => a.type);

    if (triggers.length > 0 && actions.length > 0) {
      const triggerName = this.humanizeNodeType(triggers[0]);
      const actionName = this.humanizeNodeType(actions[0]);
      return `${triggerName} to ${actionName}`;
    }

    return 'AI Generated Workflow';
  }

  private generateWorkflowDescription(analysis: any, userIntent?: string): string {
    let description = 'This workflow was automatically generated from your uploaded documents. ';
    
    if (analysis.triggers.length > 0) {
      description += `It starts with a ${this.humanizeNodeType(analysis.triggers[0].type)} trigger `;
    }
    
    if (analysis.actions.length > 0) {
      description += `and performs ${analysis.actions.length} action${analysis.actions.length !== 1 ? 's' : ''}: `;
      description += analysis.actions.map((a: any) => this.humanizeNodeType(a.type)).join(', ');
    }
    
    if (userIntent) {
      description += `\n\nUser Intent: ${userIntent}`;
    }
    
    return description;
  }

  private generateStepLabel(nodeType: string): string {
    const humanized = this.humanizeNodeType(nodeType);
    return humanized.charAt(0).toUpperCase() + humanized.slice(1);
  }

  private generateStepDescription(item: any, userIntent?: string): string {
    const baseDesc = `${this.humanizeNodeType(item.type)} with confidence ${Math.round(item.confidence * 100)}%`;
    
    if (item.evidence && item.evidence.length > 0) {
      return `${baseDesc}. Detected keywords: ${item.evidence.join(', ')}`;
    }
    
    return baseDesc;
  }

  private generateParameters(nodeType: string, analysis: any): Record<string, any> {
    const baseParams: Record<string, any> = {};

    switch (nodeType) {
      case 'email_trigger':
        baseParams.pollTimes = { item: [{ mode: 'everyMinute' }] };
        break;
      case 'webhook_trigger':
        baseParams.path = 'webhook-endpoint';
        baseParams.responseMode = 'onReceived';
        break;
      case 'schedule_trigger':
        baseParams.expression = '0 9 * * 1-5'; // Weekdays at 9 AM
        break;
      case 'slack_notify':
        baseParams.channel = '#general';
        baseParams.text = 'Automated notification from workflow';
        break;
      case 'email_send':
        baseParams.subject = 'Automated Email';
        baseParams.message = 'This is an automated message from your workflow';
        break;
      case 'sheets_update':
        baseParams.operation = 'append';
        if (analysis.dataFlow.inputs.length > 0) {
          baseParams.columns = analysis.dataFlow.inputs.slice(0, 5).join(',');
        }
        break;
      case 'http_request':
        baseParams.method = 'GET';
        baseParams.url = '';
        if (analysis.apis.length > 0) {
          baseParams.url = analysis.apis[0].path || '';
          baseParams.method = analysis.apis[0].method || 'GET';
        }
        break;
    }

    return baseParams;
  }

  private generateTransformParameters(dataFlow: any): Record<string, any> {
    const params: any = {
      values: {
        string: [],
        number: [],
        boolean: []
      }
    };

    dataFlow.inputs.slice(0, 5).forEach((input: string, index: number) => {
      params.values.string.push({
        name: input.toLowerCase().replace(/\s+/g, '_'),
        value: `={{$json["${input}"]}}`
      });
    });

    return params;
  }

  private generateConditionParameters(condition: string): Record<string, any> {
    return {
      conditions: {
        string: [
          {
            value1: '={{$json["status"]}}',
            operation: 'equal',
            value2: 'active'
          }
        ]
      }
    };
  }

  private humanizeNodeType(nodeType: string): string {
    const humanMap: Record<string, string> = {
      'email_trigger': 'Email Trigger',
      'webhook_trigger': 'Webhook',
      'schedule_trigger': 'Schedule',
      'slack_notify': 'Slack Notification',
      'email_send': 'Send Email',
      'sheets_update': 'Update Spreadsheet',
      'http_request': 'HTTP Request',
      'data_transform': 'Transform Data'
    };

    return humanMap[nodeType] || nodeType.replace(/_/g, ' ');
  }

  private removeDuplicatesByType(items: any[]): any[] {
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.type)) {
        return false;
      }
      seen.add(item.type);
      return true;
    });
  }

  private removeDuplicateSteps(steps: WorkflowStep[]): WorkflowStep[] {
    const seen = new Map();
    return steps.filter(step => {
      const key = `${step.type}-${step.nodeType}`;
      if (seen.has(key)) {
        const existing = seen.get(key);
        // Keep the one with higher confidence
        if (step.confidence > existing.confidence) {
          seen.set(key, step);
          return true;
        }
        return false;
      }
      seen.set(key, step);
      return true;
    });
  }

  private optimizeForPerformance(steps: WorkflowStep[]): void {
    // Add performance optimizations like batching, caching, etc.
    steps.forEach(step => {
      if (step.nodeType === 'n8n-nodes-base.httpRequest') {
        step.parameters.timeout = 30000;
        step.parameters.retry = { enabled: true, maxTries: 3 };
      }
    });
  }

  private calculateAnalysisConfidence(analysis: any): number {
    let confidence = 0;
    let factors = 0;

    if (analysis.triggers.length > 0) {
      confidence += Math.max(...analysis.triggers.map((t: any) => t.confidence));
      factors++;
    }

    if (analysis.actions.length > 0) {
      confidence += Math.max(...analysis.actions.map((a: any) => a.confidence));
      factors++;
    }

    if (analysis.workflows.length > 0) {
      confidence += 0.8;
      factors++;
    }

    return factors > 0 ? confidence / factors : 0.1;
  }

  private calculateOverallConfidence(steps: WorkflowStep[]): number {
    if (steps.length === 0) return 0;
    return steps.reduce((sum, step) => sum + (step.confidence || 0.5), 0) / steps.length;
  }

  private assessComplexity(steps: WorkflowStep[]): 'simple' | 'medium' | 'complex' {
    if (steps.length <= 3) return 'simple';
    if (steps.length <= 6) return 'medium';
    return 'complex';
  }

  private categorizeWorkflow(analysis: any): string {
    const triggers = analysis.triggers.map((t: any) => t.type);
    const actions = analysis.actions.map((a: any) => a.type);

    if (triggers.includes('email_trigger') || actions.includes('email_send')) {
      return 'Email Automation';
    }
    if (actions.includes('slack_notify')) {
      return 'Notifications';
    }
    if (actions.includes('sheets_update') || triggers.includes('sheets_trigger')) {
      return 'Data Processing';
    }
    if (triggers.includes('webhook_trigger') || actions.includes('http_request')) {
      return 'API Integration';
    }
    if (triggers.includes('schedule_trigger')) {
      return 'Scheduled Tasks';
    }

    return 'General Automation';
  }
}