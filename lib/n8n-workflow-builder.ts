/**
 * n8n Workflow Builder
 * Generates proper n8n workflow JSON that can be directly imported into n8n
 */

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters: Record<string, any>;
  credentials?: Record<string, any>;
  disabled?: boolean;
  notes?: string;
}

export interface N8nConnection {
  node: string;
  type: string;
  index: number;
}

export interface N8nWorkflow {
  name: string;
  nodes: N8nNode[];
  connections: Record<string, {
    main: N8nConnection[][];
  }>;
  settings?: {
    executionOrder?: string;
    saveManualExecutions?: boolean;
    callerPolicy?: string;
    errorWorkflow?: string;
  };
  staticData?: any;
  tags?: string[];
  pinData?: Record<string, any>;
  versionId?: string;
  meta?: {
    templateCredsSetupCompleted?: boolean;
    instanceId?: string;
  };
}

// Standard n8n node types with proper configurations
export const N8N_NODE_TYPES = {
  // Triggers
  MANUAL_TRIGGER: {
    type: 'n8n-nodes-base.manualTrigger',
    typeVersion: 1,
    parameters: {}
  },
  WEBHOOK: {
    type: 'n8n-nodes-base.webhook',
    typeVersion: 1.1,
    parameters: {
      path: 'webhook-path',
      responseMode: 'onReceived',
      responseData: 'allEntries',
      options: {}
    }
  },
  SCHEDULE_TRIGGER: {
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.1,
    parameters: {
      rule: {
        interval: [
          {
            field: 'hours',
            hoursInterval: 1
          }
        ]
      }
    }
  },
  // Data Sources
  HTTP_REQUEST: {
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.1,
    parameters: {
      method: 'GET',
      url: '',
      authentication: 'none',
      options: {}
    }
  },
  GOOGLE_SHEETS: {
    type: 'n8n-nodes-base.googleSheets',
    typeVersion: 4,
    parameters: {
      operation: 'read',
      documentId: '',
      sheetName: '',
      options: {}
    }
  },
  // AI Nodes
  OPENAI: {
    type: 'n8n-nodes-base.openAi',
    typeVersion: 1,
    parameters: {
      resource: 'chat',
      operation: 'message',
      model: 'gpt-4',
      messages: {
        values: [
          {
            role: 'user',
            content: ''
          }
        ]
      },
      options: {}
    }
  },
  // Data Processing
  SET: {
    type: 'n8n-nodes-base.set',
    typeVersion: 3.3,
    parameters: {
      assignments: {
        assignments: []
      },
      options: {}
    }
  },
  IF: {
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    parameters: {
      conditions: {
        options: {
          caseSensitive: true,
          leftValue: '',
          typeValidation: 'strict'
        },
        conditions: [],
        combinator: 'and'
      },
      options: {}
    }
  },
  CODE: {
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    parameters: {
      mode: 'runOnceForEachItem',
      jsCode: 'return item;'
    }
  },
  MERGE: {
    type: 'n8n-nodes-base.merge',
    typeVersion: 2.1,
    parameters: {
      mode: 'combine',
      combinationMode: 'mergeByPosition',
      options: {}
    }
  },
  SPLIT_IN_BATCHES: {
    type: 'n8n-nodes-base.splitInBatches',
    typeVersion: 3,
    parameters: {
      batchSize: 10,
      options: {}
    }
  },
  // Communication
  SLACK: {
    type: 'n8n-nodes-base.slack',
    typeVersion: 2.1,
    parameters: {
      resource: 'message',
      operation: 'post',
      channel: '',
      text: '',
      options: {}
    }
  },
  EMAIL: {
    type: 'n8n-nodes-base.emailSend',
    typeVersion: 2.1,
    parameters: {
      sendTo: '',
      subject: '',
      message: '',
      options: {}
    }
  },
  // Utilities
  WAIT: {
    type: 'n8n-nodes-base.wait',
    typeVersion: 1.1,
    parameters: {
      resume: 'timeInterval',
      amount: 1,
      unit: 'seconds'
    }
  },
  EXECUTE_COMMAND: {
    type: 'n8n-nodes-base.executeCommand',
    typeVersion: 1,
    parameters: {
      command: ''
    }
  },
  // Databases
  POSTGRES: {
    type: 'n8n-nodes-base.postgres',
    typeVersion: 2.3,
    parameters: {
      operation: 'executeQuery',
      query: '',
      options: {}
    }
  },
  MONGODB: {
    type: 'n8n-nodes-base.mongoDb',
    typeVersion: 1,
    parameters: {
      operation: 'find',
      collection: '',
      query: '{}',
      options: {}
    }
  }
};

export class N8nWorkflowBuilder {
  private workflow: N8nWorkflow;
  private nodeCounter: number = 0;
  private xPosition: number = 250;
  private yPosition: number = 300;

  constructor(name: string) {
    this.workflow = {
      name,
      nodes: [],
      connections: {},
      settings: {
        executionOrder: 'v1'
      },
      staticData: {},
      tags: [],
      pinData: {}
    };
  }

  /**
   * Add a node to the workflow
   */
  addNode(
    name: string, 
    nodeConfig: any,
    customParams?: Record<string, any>,
    credentials?: Record<string, any>
  ): string {
    const nodeId = `${++this.nodeCounter}`;
    
    const node: N8nNode = {
      id: nodeId,
      name,
      type: nodeConfig.type,
      typeVersion: nodeConfig.typeVersion,
      position: [this.xPosition, this.yPosition],
      parameters: {
        ...nodeConfig.parameters,
        ...customParams
      }
    };

    if (credentials) {
      node.credentials = credentials;
    }

    this.workflow.nodes.push(node);
    
    // Update position for next node
    this.xPosition += 250;
    if (this.xPosition > 1500) {
      this.xPosition = 250;
      this.yPosition += 200;
    }

    return name;
  }

  /**
   * Connect two nodes
   */
  connect(fromNode: string, toNode: string, outputIndex: number = 0): void {
    if (!this.workflow.connections[fromNode]) {
      this.workflow.connections[fromNode] = {
        main: []
      };
    }

    // Ensure the output index array exists
    while (this.workflow.connections[fromNode].main.length <= outputIndex) {
      this.workflow.connections[fromNode].main.push([]);
    }

    this.workflow.connections[fromNode].main[outputIndex].push({
      node: toNode,
      type: 'main',
      index: 0
    });
  }

  /**
   * Set node position manually
   */
  setNodePosition(nodeName: string, x: number, y: number): void {
    const node = this.workflow.nodes.find(n => n.name === nodeName);
    if (node) {
      node.position = [x, y];
    }
  }

  /**
   * Get the complete workflow JSON
   */
  build(): N8nWorkflow {
    return this.workflow;
  }

  /**
   * Create a basic data processing workflow
   */
  static createDataProcessingWorkflow(description: string): N8nWorkflow {
    const builder = new N8nWorkflowBuilder(`Data Processing: ${description}`);
    
    // Add trigger
    const trigger = builder.addNode('Start', N8N_NODE_TYPES.MANUAL_TRIGGER);
    
    // Add HTTP request to fetch data
    const httpRequest = builder.addNode('Fetch Data', N8N_NODE_TYPES.HTTP_REQUEST, {
      url: 'https://api.example.com/data',
      method: 'GET'
    });
    
    // Add data transformation
    const transform = builder.addNode('Transform Data', N8N_NODE_TYPES.CODE, {
      jsCode: `// Process the data
const processedData = items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    timestamp: new Date().toISOString()
  }
}));
return processedData;`
    });
    
    // Add conditional logic
    const condition = builder.addNode('Check Status', N8N_NODE_TYPES.IF, {
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
    
    // Add output
    const output = builder.addNode('Send Notification', N8N_NODE_TYPES.EMAIL, {
      sendTo: 'user@example.com',
      subject: 'Data Processing Complete',
      message: 'Your data has been processed successfully.'
    });
    
    // Connect nodes
    builder.connect(trigger, httpRequest);
    builder.connect(httpRequest, transform);
    builder.connect(transform, condition);
    builder.connect(condition, output, 0); // True branch
    
    return builder.build();
  }

  /**
   * Create an AI-powered workflow
   */
  static createAIWorkflow(description: string): N8nWorkflow {
    const builder = new N8nWorkflowBuilder(`AI Workflow: ${description}`);
    
    // Add webhook trigger
    const webhook = builder.addNode('Webhook', N8N_NODE_TYPES.WEBHOOK, {
      path: 'ai-process'
    });
    
    // Add OpenAI processing
    const ai = builder.addNode('AI Processing', N8N_NODE_TYPES.OPENAI, {
      messages: {
        values: [{
          role: 'system',
          content: 'You are a helpful assistant that processes data.'
        }, {
          role: 'user',
          content: '={{ $json.input }}'
        }]
      }
    });
    
    // Add data storage
    const store = builder.addNode('Store Results', N8N_NODE_TYPES.SET, {
      assignments: {
        assignments: [{
          id: '1',
          name: 'result',
          value: '={{ $json.choices[0].message.content }}',
          type: 'string'
        }, {
          id: '2',
          name: 'timestamp',
          value: '={{ new Date().toISOString() }}',
          type: 'string'
        }]
      }
    });
    
    // Add response
    const respond = builder.addNode('Respond to Webhook', {
      type: 'n8n-nodes-base.respondToWebhook',
      typeVersion: 1,
      parameters: {
        respondWith: 'json',
        responseBody: '={{ { "result": $json.result, "timestamp": $json.timestamp } }}'
      }
    });
    
    // Connect nodes
    builder.connect(webhook, ai);
    builder.connect(ai, store);
    builder.connect(store, respond);
    
    return builder.build();
  }

  /**
   * Create a scheduled automation workflow
   */
  static createScheduledWorkflow(description: string): N8nWorkflow {
    const builder = new N8nWorkflowBuilder(`Scheduled: ${description}`);
    
    // Add schedule trigger
    const schedule = builder.addNode('Every Hour', N8N_NODE_TYPES.SCHEDULE_TRIGGER, {
      rule: {
        interval: [{
          field: 'hours',
          hoursInterval: 1
        }]
      }
    });
    
    // Add data fetching
    const fetch = builder.addNode('Fetch Latest Data', N8N_NODE_TYPES.HTTP_REQUEST, {
      url: 'https://api.example.com/latest',
      method: 'GET'
    });
    
    // Add processing
    const process = builder.addNode('Process Data', N8N_NODE_TYPES.CODE, {
      jsCode: `// Analyze the data
const summary = {
  total: items.length,
  timestamp: new Date().toISOString(),
  data: items.map(item => item.json)
};
return [{ json: summary }];`
    });
    
    // Add notification
    const notify = builder.addNode('Send Report', N8N_NODE_TYPES.SLACK, {
      channel: '#reports',
      text: 'Hourly report: {{ $json.total }} items processed'
    });
    
    // Connect nodes
    builder.connect(schedule, fetch);
    builder.connect(fetch, process);
    builder.connect(process, notify);
    
    return builder.build();
  }
}

export default N8nWorkflowBuilder;