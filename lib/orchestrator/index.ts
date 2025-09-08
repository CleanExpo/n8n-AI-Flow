/**
 * AI Orchestrator Agent System
 * Manages and coordinates multiple AI agents for n8n workflow automation
 */

import { EventEmitter } from 'events';

export interface Agent {
  id: string;
  name: string;
  type: 'workflow' | 'data' | 'api' | 'ui' | 'test' | 'monitor';
  status: 'idle' | 'active' | 'error' | 'completed';
  capabilities: string[];
  priority: number;
}

export interface Task {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  assignedAgent?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export class OrchestratorAgent extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private taskQueue: Task[] = [];
  private activeAgents: Set<string> = new Set();

  constructor() {
    super();
    this.initializeAgents();
  }

  private initializeAgents() {
    // Initialize core agents
    this.registerAgent({
      id: 'workflow-builder',
      name: 'Workflow Builder Agent',
      type: 'workflow',
      status: 'idle',
      capabilities: ['create-workflow', 'edit-workflow', 'validate-workflow'],
      priority: 1
    });

    this.registerAgent({
      id: 'data-processor',
      name: 'Data Processing Agent',
      type: 'data',
      status: 'idle',
      capabilities: ['transform-data', 'validate-data', 'aggregate-data'],
      priority: 2
    });

    this.registerAgent({
      id: 'api-integrator',
      name: 'API Integration Agent',
      type: 'api',
      status: 'idle',
      capabilities: ['call-api', 'handle-webhook', 'manage-credentials'],
      priority: 2
    });

    this.registerAgent({
      id: 'ui-generator',
      name: 'UI Generation Agent',
      type: 'ui',
      status: 'idle',
      capabilities: ['generate-form', 'create-dashboard', 'build-component'],
      priority: 3
    });

    this.registerAgent({
      id: 'test-runner',
      name: 'Test Runner Agent',
      type: 'test',
      status: 'idle',
      capabilities: ['run-tests', 'validate-output', 'performance-check'],
      priority: 4
    });

    this.registerAgent({
      id: 'monitor',
      name: 'Monitoring Agent',
      type: 'monitor',
      status: 'idle',
      capabilities: ['track-performance', 'log-errors', 'generate-reports'],
      priority: 5
    });
  }

  registerAgent(agent: Agent) {
    this.agents.set(agent.id, agent);
    this.emit('agent:registered', agent);
  }

  async assignTask(task: Task): Promise<Task> {
    // Find the best agent for the task
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.status === 'idle' && 
        agent.capabilities.includes(task.type)
      )
      .sort((a, b) => a.priority - b.priority);

    if (availableAgents.length === 0) {
      // Queue the task if no agents available
      this.taskQueue.push(task);
      this.emit('task:queued', task);
      return task;
    }

    const selectedAgent = availableAgents[0];
    task.assignedAgent = selectedAgent.id;
    task.status = 'processing';
    
    // Update agent status
    selectedAgent.status = 'active';
    this.activeAgents.add(selectedAgent.id);
    
    this.emit('task:assigned', { task, agent: selectedAgent });
    
    // Process the task
    await this.processTask(task, selectedAgent);
    
    return task;
  }

  private async processTask(task: Task, agent: Agent) {
    try {
      // Simulate task processing
      this.emit('task:processing', { task, agent });
      
      // Here you would implement actual task processing logic
      // For now, we'll simulate with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = { success: true, message: `Task completed by ${agent.name}` };
      
      this.emit('task:completed', { task, agent });
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      this.emit('task:failed', { task, agent, error });
    } finally {
      // Free up the agent
      agent.status = 'idle';
      this.activeAgents.delete(agent.id);
      
      // Process next task in queue if any
      if (this.taskQueue.length > 0) {
        const nextTask = this.taskQueue.shift();
        if (nextTask) {
          await this.assignTask(nextTask);
        }
      }
    }
  }

  getAgentStatus(): { agents: Agent[], activeCount: number, queuedTasks: number } {
    return {
      agents: Array.from(this.agents.values()),
      activeCount: this.activeAgents.size,
      queuedTasks: this.taskQueue.length
    };
  }

  async orchestrateWorkflow(workflowDefinition: { nodes?: Array<{ id: string; type: string; name: string; position: { x: number; y: number }; config?: Record<string, unknown> }> }) {
    const tasks: Task[] = [];
    
    // Parse workflow and create tasks
    if (workflowDefinition.nodes) {
      for (const node of workflowDefinition.nodes) {
        const task: Task = {
          id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: this.mapNodeTypeToTaskType(node.type),
          payload: node,
          status: 'pending',
          createdAt: new Date()
        };
        tasks.push(task);
      }
    }
    
    // Execute tasks in parallel where possible
    const results = await Promise.all(
      tasks.map(task => this.assignTask(task))
    );
    
    return results;
  }

  private mapNodeTypeToTaskType(nodeType: string): string {
    const typeMap: { [key: string]: string } = {
      'webhook': 'handle-webhook',
      'http': 'call-api',
      'transform': 'transform-data',
      'aggregate': 'aggregate-data',
      'form': 'generate-form',
      'dashboard': 'create-dashboard'
    };
    
    return typeMap[nodeType] || 'create-workflow';
  }
}

// Singleton instance
export const orchestrator = new OrchestratorAgent();