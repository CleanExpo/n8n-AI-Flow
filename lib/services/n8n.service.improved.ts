import { Node, Edge } from '@xyflow/react';

export interface N8nCredentials {
  baseUrl: string;
  username: string;
  password: string;
  apiKey?: string;
}

export interface N8nWorkflow {
  id?: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: N8nConnection;
  settings?: N8nWorkflowSettings;
  staticData?: any;
  tags?: string[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  typeVersion: number; // Made required as per n8n standards
  disabled?: boolean;
  notes?: string;
  continueOnFail?: boolean;
  retryOnFail?: boolean;
  maxTries?: number;
  waitBetweenTries?: number;
}

export interface N8nConnection {
  [sourceNodeName: string]: {
    main: Array<Array<{
      node: string; // Target node name
      type: string;
      index: number;
    }>>;
  };
}

export interface N8nWorkflowSettings {
  executionOrder?: 'v1';
  saveManualExecutions?: boolean;
  callerPolicy?: 'workflowsFromSameOwner' | 'none' | 'any';
  errorWorkflow?: string;
  timezone?: string;
  saveDataErrorExecution?: 'all' | 'none';
  saveDataSuccessExecution?: 'all' | 'none';
  executionTimeout?: number;
  maxExecutionTime?: number;
}

export interface N8nExecution {
  id: string;
  finished: boolean;
  mode: string;
  retryOf?: string;
  retrySuccessId?: string;
  startedAt: string;
  stoppedAt?: string;
  workflowId: string;
  workflowData?: N8nWorkflow;
  data?: any;
}

export interface N8nWebhook {
  workflowId: string;
  webhookId: string;
  method: string;
  node: string;
  path: string;
  webhookUrl: string;
  isFullPath: boolean;
}

export class N8nService {
  private baseUrl: string;
  private auth: string;
  private headers: HeadersInit;

  constructor(credentials: N8nCredentials) {
    this.baseUrl = credentials.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    
    if (credentials.apiKey) {
      // Use API Key authentication (recommended)
      this.auth = '';
      this.headers = {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': credentials.apiKey,
      };
    } else {
      // Use Basic Auth
      this.auth = btoa(`${credentials.username}:${credentials.password}`);
      this.headers = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${this.auth}`,
      };
    }
  }

  // ==================== WORKFLOWS ====================

  /**
   * Get all workflows
   */
  async getWorkflows(): Promise<{ data: N8nWorkflow[] }> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflows: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single workflow
   */
  async getWorkflow(id: string): Promise<{ data: N8nWorkflow }> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch workflow: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new workflow
   */
  async createWorkflow(workflow: N8nWorkflow): Promise<{ data: N8nWorkflow }> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create workflow: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<{ data: N8nWorkflow }> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify(workflow),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update workflow: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Delete a workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete workflow: ${response.statusText}`);
    }
  }

  /**
   * Activate a workflow
   */
  async activateWorkflow(id: string): Promise<{ data: N8nWorkflow }> {
    return this.updateWorkflow(id, { active: true });
  }

  /**
   * Deactivate a workflow
   */
  async deactivateWorkflow(id: string): Promise<{ data: N8nWorkflow }> {
    return this.updateWorkflow(id, { active: false });
  }

  // ==================== EXECUTIONS ====================

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    data?: any,
    startNode?: string
  ): Promise<{ data: N8nExecution }> {
    const body: any = {};
    if (data) body.workflowData = data;
    if (startNode) body.startNode = startNode;

    const response = await fetch(`${this.baseUrl}/api/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to execute workflow: ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get all executions
   */
  async getExecutions(workflowId?: string): Promise<{ data: N8nExecution[] }> {
    let url = `${this.baseUrl}/api/v1/executions`;
    if (workflowId) {
      url += `?workflowId=${workflowId}`;
    }

    const response = await fetch(url, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch executions: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get a single execution
   */
  async getExecution(id: string): Promise<{ data: N8nExecution }> {
    const response = await fetch(`${this.baseUrl}/api/v1/executions/${id}`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch execution: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete an execution
   */
  async deleteExecution(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/v1/executions/${id}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete execution: ${response.statusText}`);
    }
  }

  // ==================== WEBHOOKS ====================

  /**
   * Get webhook URL for a workflow
   */
  getWebhookUrl(path: string, isTest: boolean = false): string {
    const webhookPath = isTest ? 'webhook-test' : 'webhook';
    return `${this.baseUrl}/${webhookPath}/${path}`;
  }

  /**
   * Get all webhooks
   */
  async getWebhooks(): Promise<{ data: N8nWebhook[] }> {
    const response = await fetch(`${this.baseUrl}/api/v1/webhooks`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch webhooks: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== CONVERSION UTILITIES ====================

  /**
   * Convert React Flow nodes/edges to n8n workflow format
   * FIXED: Now uses node names for connections, includes typeVersion, and proper parameter mapping
   */
  convertToN8nWorkflow(
    name: string,
    nodes: Node[],
    edges: Edge[]
  ): N8nWorkflow {
    // Create a map of node IDs to node names for connection mapping
    const nodeIdToName: Record<string, string> = {};
    
    // Convert nodes
    const n8nNodes: N8nNode[] = nodes.map((node) => {
      const nodeName = node.data.label || node.type || `Node_${node.id}`;
      nodeIdToName[node.id] = nodeName;
      
      return {
        id: node.id,
        name: nodeName,
        type: this.mapNodeTypeToN8n(node.type || 'unknown'),
        position: [node.position.x, node.position.y],
        parameters: this.mapNodeConfigToN8n(node.type || 'unknown', node.data.config || {}),
        typeVersion: this.getNodeTypeVersion(node.type || 'unknown'),
        disabled: node.data.disabled || false,
        notes: node.data.notes || '',
        continueOnFail: node.data.continueOnFail || false,
        retryOnFail: node.data.retryOnFail || false,
        maxTries: node.data.maxTries || 3,
        waitBetweenTries: node.data.waitBetweenTries || 1000,
      };
    });

    // Convert connections using node names instead of IDs
    const n8nConnections: N8nConnection = {};
    
    // Group edges by source node
    const edgesBySource = edges.reduce((acc, edge) => {
      if (!acc[edge.source]) {
        acc[edge.source] = [];
      }
      acc[edge.source].push(edge);
      return acc;
    }, {} as Record<string, Edge[]>);

    // Build n8n connection format using node names
    for (const [sourceId, sourceEdges] of Object.entries(edgesBySource)) {
      const sourceNodeName = nodeIdToName[sourceId];
      if (sourceNodeName) {
        n8nConnections[sourceNodeName] = {
          main: [
            sourceEdges.map((edge) => ({
              node: nodeIdToName[edge.target] || edge.target,
              type: 'main',
              index: 0,
            })),
          ],
        };
      }
    }

    return {
      name,
      active: false,
      nodes: n8nNodes,
      connections: n8nConnections,
      settings: {
        executionOrder: 'v1',
        saveManualExecutions: true,
        callerPolicy: 'workflowsFromSameOwner',
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        executionTimeout: -1,
        maxExecutionTime: -1,
      },
      staticData: {},
      tags: [],
    };
  }

  /**
   * Get the appropriate typeVersion for a node type
   */
  private getNodeTypeVersion(type: string): number {
    const versionMap: Record<string, number> = {
      webhook: 1,
      http_request: 4,
      transform: 1,
      code: 1,
      aggregate: 1,
      form: 1,
      conditional: 1,
      if: 1,
      email: 2,
      ai_openai: 1,
      ai_anthropic: 1,
      ai_google: 1,
      database: 2,
      postgres: 2,
      mysql: 2,
      mongodb: 1,
      schedule: 1,
      manual: 1,
    };

    return versionMap[type] || 1;
  }

  /**
   * Map our node types to n8n node types
   * FIXED: Corrected case sensitivity and added comprehensive node support
   */
  private mapNodeTypeToN8n(type: string): string {
    const typeMap: Record<string, string> = {
      // Core Nodes
      webhook: 'n8n-nodes-base.webhook',
      http_request: 'n8n-nodes-base.httpRequest', // Fixed case
      transform: 'n8n-nodes-base.code',
      code: 'n8n-nodes-base.code',
      aggregate: 'n8n-nodes-base.aggregate',
      form: 'n8n-nodes-base.form',
      conditional: 'n8n-nodes-base.if',
      if: 'n8n-nodes-base.if',
      switch: 'n8n-nodes-base.switch',
      merge: 'n8n-nodes-base.merge',
      split_in_batches: 'n8n-nodes-base.splitInBatches',
      loop: 'n8n-nodes-base.loop',
      
      // Communication Nodes
      email: 'n8n-nodes-base.emailSend',
      slack: 'n8n-nodes-base.slack',
      discord: 'n8n-nodes-base.discord',
      telegram: 'n8n-nodes-base.telegram',
      twilio: 'n8n-nodes-base.twilio',
      
      // AI/LLM Nodes
      ai_openai: 'n8n-nodes-base.openAi',
      ai_anthropic: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
      ai_google: '@n8n/n8n-nodes-langchain.lmChatGoogleGemini',
      ai_agent: 'n8n-nodes-base.openAi', // Generic AI mapping
      
      // Database Nodes
      database: 'n8n-nodes-base.postgres', // Default to postgres
      db_postgres: 'n8n-nodes-base.postgres',
      db_mysql: 'n8n-nodes-base.mySql',
      db_mongodb: 'n8n-nodes-base.mongoDb',
      db_redis: 'n8n-nodes-base.redis',
      db_supabase: 'n8n-nodes-base.supabase',
      
      // Trigger Nodes
      trigger_schedule: 'n8n-nodes-base.scheduleTrigger',
      trigger_manual: 'n8n-nodes-base.manualTrigger',
      trigger_webhook: 'n8n-nodes-base.webhook',
      trigger_error: 'n8n-nodes-base.errorTrigger',
      
      // Data Processing
      json: 'n8n-nodes-base.set',
      set: 'n8n-nodes-base.set',
      filter: 'n8n-nodes-base.filter',
      sort: 'n8n-nodes-base.sort',
      limit: 'n8n-nodes-base.limit',
      
      // File Operations
      file_read: 'n8n-nodes-base.readBinaryFiles',
      file_write: 'n8n-nodes-base.writeBinaryFile',
      ftp: 'n8n-nodes-base.ftp',
      ssh: 'n8n-nodes-base.ssh',
      
      // Cloud Services
      aws_s3: 'n8n-nodes-base.awsS3',
      google_drive: 'n8n-nodes-base.googleDrive',
      dropbox: 'n8n-nodes-base.dropbox',
      
      // APIs and Integrations
      github: 'n8n-nodes-base.github',
      gitlab: 'n8n-nodes-base.gitlab',
      jira: 'n8n-nodes-base.jira',
      notion: 'n8n-nodes-base.notion',
      airtable: 'n8n-nodes-base.airtable',
      google_sheets: 'n8n-nodes-base.googleSheets',
    };

    return typeMap[type] || 'n8n-nodes-base.noOp';
  }

  /**
   * Map node configuration to n8n parameters
   * ENHANCED: Added comprehensive parameter mapping based on n8n documentation
   */
  private mapNodeConfigToN8n(type: string, config: Record<string, any>): Record<string, any> {
    switch (type) {
      case 'webhook':
        return {
          httpMethod: config.method || 'POST',
          path: config.path || 'webhook',
          authentication: config.auth || 'none',
          responseMode: config.responseMode || 'onReceived',
          responseCode: config.responseCode || 200,
          responseData: config.responseData || 'allEntries',
          options: {
            allowedOrigins: config.allowedOrigins || '*',
            rawBody: config.rawBody || false,
            binaryPropertyName: config.binaryPropertyName || 'data',
            ignoreBots: config.ignoreBots || false,
            ipWhitelist: config.ipWhitelist || '',
          },
        };

      case 'http_request':
        return {
          url: config.url || '',
          requestMethod: config.method || 'GET',
          authentication: config.authentication || 'none',
          sendHeaders: !!config.headers,
          headerParametersUi: {
            parameter: config.headers ? 
              Object.entries(config.headers).map(([name, value]) => ({ name, value })) : 
              [],
          },
          sendBody: !!config.body,
          bodyContentType: config.bodyContentType || 'json',
          jsonBody: typeof config.body === 'object' ? JSON.stringify(config.body) : config.body || '{}',
          options: {
            timeout: config.timeout || 10000,
            redirect: {
              redirect: {
                followRedirects: config.followRedirects !== false,
                maxRedirects: config.maxRedirects || 21,
              },
            },
            response: {
              response: {
                fullResponse: config.fullResponse || false,
                neverError: config.neverError || false,
              },
            },
            proxy: config.proxy || '',
          },
        };

      case 'transform':
      case 'code':
        return {
          mode: config.mode || 'runOnceForEachItem',
          jsCode: config.expression || config.jsCode || '// Your code here\nreturn items;',
          pythonCode: config.pythonCode || '',
          language: config.language || 'javaScript',
        };

      case 'conditional':
      case 'if':
        return {
          conditions: {
            boolean: [
              {
                value1: config.value1 || '={{$json}}',
                operation: config.operation || 'equal',
                value2: config.value2 || config.condition || '',
              },
            ],
          },
          combineOperation: config.combineOperation || 'all',
        };

      case 'ai_openai':
        return {
          resource: config.resource || 'chat',
          operation: config.operation || 'message',
          modelId: config.model || 'gpt-3.5-turbo',
          messages: {
            values: [
              {
                role: 'user',
                content: config.prompt || '',
              },
            ],
          },
          options: {
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000,
            topP: config.topP || 1,
            frequencyPenalty: config.frequencyPenalty || 0,
            presencePenalty: config.presencePenalty || 0,
          },
        };

      case 'database':
      case 'db_postgres':
        return {
          operation: config.operation || 'executeQuery',
          query: config.query || '',
          table: config.table || '',
          columns: config.columns || '',
          additionalFields: config.additionalFields || {},
          options: {
            queryBatching: config.queryBatching || 'single',
            connectionTimeout: config.connectionTimeout || 30,
          },
        };

      case 'email':
        return {
          toEmail: config.to || '',
          ccEmail: config.cc || '',
          bccEmail: config.bcc || '',
          subject: config.subject || '',
          emailType: config.isHtml ? 'html' : 'text',
          message: config.body || '',
          attachments: config.attachments || '',
          options: {
            allowUnauthorizedCerts: config.allowUnauthorizedCerts || false,
            replyTo: config.replyTo || '',
          },
        };

      case 'trigger_schedule':
        return {
          rule: {
            cronExpression: config.cronExpression || '0 * * * *',
            timezone: config.timezone || 'UTC',
          },
        };

      case 'set':
      case 'json':
        return {
          mode: config.mode || 'manual',
          keepOnlySet: config.keepOnlySet !== false,
          options: {},
          assignments: {
            assignments: config.fields?.map((field: any) => ({
              id: field.id || Math.random().toString(36).substr(2, 9),
              name: field.name || '',
              value: field.value || '',
              type: field.type || 'string',
            })) || [],
          },
        };

      case 'aggregate':
        return {
          operation: config.operation || 'summarize',
          fieldsToSummarize: {
            field: config.fields?.map((field: any) => ({
              fieldName: field.name || '',
              aggregationFunction: field.function || 'sum',
              includeEmpty: field.includeEmpty || false,
            })) || [],
          },
          groupBy: config.groupBy || '',
          options: {
            outputFormat: config.outputFormat || 'singleItem',
            disableDotNotation: config.disableDotNotation || false,
          },
        };

      case 'merge':
        return {
          mode: config.mode || 'append',
          joinMode: config.joinMode || 'inner',
          propertyName1: config.propertyName1 || '',
          propertyName2: config.propertyName2 || '',
          options: {
            clashHandling: {
              values: {
                clashHandling: config.clashHandling || 'preferInput2',
                mergeMode: config.mergeMode || 'deepMerge',
              },
            },
          },
        };

      case 'filter':
        return {
          conditions: {
            boolean: config.conditions?.map((condition: any) => ({
              value1: condition.field || '={{$json}}',
              operation: condition.operation || 'equal',
              value2: condition.value || '',
            })) || [],
          },
          combineConditions: config.combineConditions || 'all',
          options: {
            caseSensitive: config.caseSensitive !== false,
            looseTypeValidation: config.looseTypeValidation || false,
          },
        };

      default:
        // Return config as-is for unknown types
        return config;
    }
  }

  /**
   * Validate workflow before sending to n8n
   */
  validateWorkflow(workflow: N8nWorkflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!workflow.name) {
      errors.push('Workflow name is required');
    }

    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Validate nodes
    workflow.nodes?.forEach((node, index) => {
      if (!node.name) {
        errors.push(`Node at index ${index} is missing a name`);
      }
      if (!node.type) {
        errors.push(`Node ${node.name || index} is missing a type`);
      }
      if (!node.typeVersion) {
        errors.push(`Node ${node.name || index} is missing typeVersion`);
      }
      if (!node.position || node.position.length !== 2) {
        errors.push(`Node ${node.name || index} has invalid position`);
      }
    });

    // Validate connections
    if (workflow.connections) {
      Object.entries(workflow.connections).forEach(([sourceName, connection]) => {
        // Check if source node exists
        if (!workflow.nodes?.find(n => n.name === sourceName)) {
          errors.push(`Connection references unknown source node: ${sourceName}`);
        }

        // Check target nodes
        connection.main?.forEach((branch, branchIndex) => {
          branch.forEach((target, targetIndex) => {
            if (!workflow.nodes?.find(n => n.name === target.node)) {
              errors.push(`Connection references unknown target node: ${target.node}`);
            }
          });
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Test connection to n8n with enhanced error handling
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows?limit=1`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        console.error(`n8n connection test failed: ${response.status} ${response.statusText}`);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('n8n connection test error:', error);
      return false;
    }
  }

  /**
   * Get n8n version information
   */
  async getVersion(): Promise<{ version: string; instanceId: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/version`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get n8n version: ${response.statusText}`);
      }
      
      return response.json();
    } catch (error) {
      throw new Error(`Failed to get n8n version: ${error}`);
    }
  }
}