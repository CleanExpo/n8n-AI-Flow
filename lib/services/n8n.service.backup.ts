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
  typeVersion?: number;
  disabled?: boolean;
  notes?: string;
}

export interface N8nConnection {
  [sourceNode: string]: {
    main: Array<Array<{
      node: string;
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
      // Use API Key authentication
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
      throw new Error(`Failed to create workflow: ${response.statusText}`);
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
      throw new Error(`Failed to update workflow: ${response.statusText}`);
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
      throw new Error(`Failed to execute workflow: ${response.statusText}`);
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
   */
  convertToN8nWorkflow(
    name: string,
    nodes: Node[],
    edges: Edge[]
  ): N8nWorkflow {
    // Convert nodes
    const n8nNodes: N8nNode[] = nodes.map((node) => ({
      id: node.id,
      name: node.data.label || node.type || 'Node',
      type: this.mapNodeTypeToN8n(node.type || 'unknown'),
      position: [node.position.x, node.position.y],
      parameters: this.mapNodeConfigToN8n(node.type || 'unknown', node.data.config || {}),
      typeVersion: 1,
    }));

    // Convert connections
    const n8nConnections: N8nConnection = {};
    
    // Group edges by source node
    const edgesBySource = edges.reduce((acc, edge) => {
      if (!acc[edge.source]) {
        acc[edge.source] = [];
      }
      acc[edge.source].push(edge);
      return acc;
    }, {} as Record<string, Edge[]>);

    // Build n8n connection format
    for (const [sourceId, sourceEdges] of Object.entries(edgesBySource)) {
      n8nConnections[sourceId] = {
        main: [
          sourceEdges.map((edge) => ({
            node: edge.target,
            type: 'main',
            index: 0,
          })),
        ],
      };
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
      },
    };
  }

  /**
   * Map our node types to n8n node types
   */
  private mapNodeTypeToN8n(type: string): string {
    const typeMap: Record<string, string> = {
      webhook: 'n8n-nodes-base.webhook',
      http_request: 'n8n-nodes-base.httpRequest',
      transform: 'n8n-nodes-base.code',
      aggregate: 'n8n-nodes-base.aggregate',
      form: 'n8n-nodes-base.form',
      ai_agent: 'n8n-nodes-base.openAi',
      database: 'n8n-nodes-base.postgres',
      email: 'n8n-nodes-base.emailSend',
      conditional: 'n8n-nodes-base.if',
    };

    return typeMap[type] || 'n8n-nodes-base.noOp';
  }

  /**
   * Map node configuration to n8n parameters
   */
  private mapNodeConfigToN8n(type: string, config: Record<string, any>): Record<string, any> {
    switch (type) {
      case 'webhook':
        return {
          httpMethod: config.method || 'POST',
          path: config.path || 'webhook',
          authentication: config.auth || 'none',
          responseMode: 'onReceived',
        };

      case 'http_request':
        return {
          url: config.url || '',
          requestMethod: config.method || 'GET',
          headerParametersUi: {
            parameter: config.headers ? 
              Object.entries(config.headers).map(([name, value]) => ({ name, value })) : 
              [],
          },
          bodyParametersUi: {
            parameter: config.body ? 
              Object.entries(config.body).map(([name, value]) => ({ name, value })) : 
              [],
          },
        };

      case 'transform':
        return {
          mode: 'runOnceForEachItem',
          jsCode: config.expression || 'return item;',
        };

      case 'ai_agent':
        return {
          resource: 'chat',
          model: config.model || 'gpt-3.5-turbo',
          prompt: {
            prompt: config.prompt || '',
          },
          options: {
            temperature: config.temperature || 0.7,
            maxTokens: config.maxTokens || 2000,
          },
        };

      case 'database':
        return {
          operation: config.operation || 'select',
          table: config.table || '',
          query: config.query || '',
        };

      case 'email':
        return {
          toEmail: config.to || '',
          subject: config.subject || '',
          text: config.body || '',
          html: config.isHtml ? config.body : undefined,
        };

      case 'conditional':
        return {
          conditions: {
            boolean: [
              {
                value1: '={{$json}}',
                operation: 'expression',
                value2: config.condition || 'true',
              },
            ],
          },
        };

      case 'aggregate':
        return {
          operation: config.operation || 'summarize',
          fieldsToSummarize: {
            field: [
              {
                fieldName: config.field || '',
                aggregationFunction: config.operation || 'sum',
              },
            ],
          },
          groupBy: config.groupBy || '',
        };

      default:
        return config;
    }
  }

  /**
   * Test connection to n8n
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/workflows?limit=1`, {
        headers: this.headers,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}