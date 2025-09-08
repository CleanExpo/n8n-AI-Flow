import { SupabaseClient } from '@supabase/supabase-js';
import {
  Workflow,
  WorkflowNode,
  NodeConnection,
  CreateWorkflowDTO,
  UpdateWorkflowDTO,
  CreateNodeDTO,
  UpdateNodeDTO,
  CreateConnectionDTO,
  WorkflowFilter,
  WorkflowWithNodes,
  DatabaseResponse,
  PaginatedResponse,
  FlowNode,
  FlowEdge
} from '@/lib/types/database';

export class WorkflowService {
  constructor(private supabase: SupabaseClient) {}

  // ==================== WORKFLOWS ====================

  /**
   * Create a new workflow
   */
  async createWorkflow(data: CreateWorkflowDTO): Promise<DatabaseResponse<Workflow>> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: workflow, error } = await this.supabase
        .from('workflows')
        .insert({
          ...data,
          user_id: user.id,
          config: data.config || {}
        })
        .select()
        .single();

      return { data: workflow, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all workflows for the current user
   */
  async getWorkflows(filter?: WorkflowFilter): Promise<DatabaseResponse<Workflow[]>> {
    try {
      let query = this.supabase
        .from('workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter?.status) {
        query = query.eq('status', filter.status);
      }

      if (filter?.tags && filter.tags.length > 0) {
        query = query.contains('tags', filter.tags);
      }

      if (filter?.search) {
        query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
      }

      const { data, error } = await query;
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a single workflow with all its nodes and connections
   */
  async getWorkflowWithNodes(workflowId: string): Promise<DatabaseResponse<WorkflowWithNodes>> {
    try {
      // Get workflow
      const { data: workflow, error: workflowError } = await this.supabase
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

      if (workflowError) throw workflowError;

      // Get nodes
      const { data: nodes, error: nodesError } = await this.supabase
        .from('nodes')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at');

      if (nodesError) throw nodesError;

      // Get connections
      const { data: connections, error: connectionsError } = await this.supabase
        .from('connections')
        .select('*')
        .eq('workflow_id', workflowId);

      if (connectionsError) throw connectionsError;

      return {
        data: {
          ...workflow,
          nodes,
          connections
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a workflow
   */
  async updateWorkflow(workflowId: string, data: UpdateWorkflowDTO): Promise<DatabaseResponse<Workflow>> {
    try {
      const { data: workflow, error } = await this.supabase
        .from('workflows')
        .update({
          ...data,
          version: this.supabase.sql`version + 1`
        })
        .eq('id', workflowId)
        .select()
        .single();

      return { data: workflow, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a workflow and all its related data
   */
  async deleteWorkflow(workflowId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('workflows')
        .delete()
        .eq('id', workflowId);

      return { data: !error, error };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }

  /**
   * Duplicate a workflow
   */
  async duplicateWorkflow(workflowId: string, newName?: string): Promise<DatabaseResponse<Workflow>> {
    try {
      const { data: original } = await this.getWorkflowWithNodes(workflowId);
      if (!original) throw new Error('Workflow not found');

      // Create new workflow
      const { data: newWorkflow, error: createError } = await this.createWorkflow({
        name: newName || `${original.name} (Copy)`,
        description: original.description,
        config: original.config,
        tags: original.tags
      });

      if (createError || !newWorkflow) throw createError;

      // Map old node IDs to new node IDs
      const nodeIdMap = new Map<string, string>();

      // Duplicate nodes
      if (original.nodes) {
        for (const node of original.nodes) {
          const { data: newNode } = await this.createNode({
            workflow_id: newWorkflow.id,
            node_id: node.node_id,
            type: node.type,
            name: node.name,
            position: node.position,
            config: node.config
          });
          if (newNode) {
            nodeIdMap.set(node.id, newNode.id);
          }
        }
      }

      // Duplicate connections with new node IDs
      if (original.connections) {
        for (const connection of original.connections) {
          const sourceId = nodeIdMap.get(connection.source_node_id);
          const targetId = nodeIdMap.get(connection.target_node_id);
          
          if (sourceId && targetId) {
            await this.createConnection({
              workflow_id: newWorkflow.id,
              source_node_id: sourceId,
              target_node_id: targetId,
              source_handle: connection.source_handle,
              target_handle: connection.target_handle,
              config: connection.config
            });
          }
        }
      }

      return { data: newWorkflow, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // ==================== NODES ====================

  /**
   * Create a new node
   */
  async createNode(data: CreateNodeDTO): Promise<DatabaseResponse<WorkflowNode>> {
    try {
      const { data: node, error } = await this.supabase
        .from('nodes')
        .insert(data)
        .select()
        .single();

      return { data: node, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a node
   */
  async updateNode(nodeId: string, data: UpdateNodeDTO): Promise<DatabaseResponse<WorkflowNode>> {
    try {
      const { data: node, error } = await this.supabase
        .from('nodes')
        .update(data)
        .eq('id', nodeId)
        .select()
        .single();

      return { data: node, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a node and its connections
   */
  async deleteNode(nodeId: string): Promise<DatabaseResponse<boolean>> {
    try {
      // Delete connections first
      await this.supabase
        .from('connections')
        .delete()
        .or(`source_node_id.eq.${nodeId},target_node_id.eq.${nodeId}`);

      // Delete the node
      const { error } = await this.supabase
        .from('nodes')
        .delete()
        .eq('id', nodeId);

      return { data: !error, error };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }

  /**
   * Batch update nodes (for position changes)
   */
  async updateNodesPosition(updates: Array<{ id: string; position: { x: number; y: number } }>): Promise<DatabaseResponse<boolean>> {
    try {
      const promises = updates.map(update =>
        this.supabase
          .from('nodes')
          .update({ position: update.position })
          .eq('id', update.id)
      );

      await Promise.all(promises);
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }

  // ==================== CONNECTIONS ====================

  /**
   * Create a new connection
   */
  async createConnection(data: CreateConnectionDTO): Promise<DatabaseResponse<NodeConnection>> {
    try {
      const { data: connection, error } = await this.supabase
        .from('connections')
        .insert(data)
        .select()
        .single();

      return { data: connection, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a connection
   */
  async deleteConnection(connectionId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      return { data: !error, error };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }

  /**
   * Delete connection by source and target
   */
  async deleteConnectionByNodes(sourceNodeId: string, targetNodeId: string): Promise<DatabaseResponse<boolean>> {
    try {
      const { error } = await this.supabase
        .from('connections')
        .delete()
        .match({
          source_node_id: sourceNodeId,
          target_node_id: targetNodeId
        });

      return { data: !error, error };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }

  // ==================== REACT FLOW CONVERSION ====================

  /**
   * Convert database nodes to React Flow nodes
   */
  convertToFlowNodes(nodes: WorkflowNode[]): FlowNode[] {
    return nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: {
        label: node.name,
        config: node.config,
        inputs: node.inputs,
        outputs: node.outputs
      }
    }));
  }

  /**
   * Convert database connections to React Flow edges
   */
  convertToFlowEdges(connections: NodeConnection[]): FlowEdge[] {
    return connections.map(conn => ({
      id: conn.id,
      source: conn.source_node_id,
      target: conn.target_node_id,
      sourceHandle: conn.source_handle,
      targetHandle: conn.target_handle,
      type: 'smoothstep',
      animated: true
    }));
  }

  /**
   * Save React Flow changes back to database
   */
  async syncFlowChanges(
    workflowId: string,
    nodes: FlowNode[],
    edges: FlowEdge[]
  ): Promise<DatabaseResponse<boolean>> {
    try {
      // Start a transaction-like operation
      
      // 1. Get existing nodes and connections
      const { data: existingNodes } = await this.supabase
        .from('nodes')
        .select('id')
        .eq('workflow_id', workflowId);

      const { data: existingConnections } = await this.supabase
        .from('connections')
        .select('id')
        .eq('workflow_id', workflowId);

      // 2. Determine what to add, update, or delete
      const existingNodeIds = new Set(existingNodes?.map(n => n.id) || []);
      const newNodeIds = new Set(nodes.map(n => n.id));
      const existingConnIds = new Set(existingConnections?.map(c => c.id) || []);
      const newConnIds = new Set(edges.map(e => e.id));

      // 3. Delete removed nodes
      const nodesToDelete = [...existingNodeIds].filter(id => !newNodeIds.has(id));
      for (const nodeId of nodesToDelete) {
        await this.deleteNode(nodeId);
      }

      // 4. Delete removed connections
      const connsToDelete = [...existingConnIds].filter(id => !newConnIds.has(id));
      for (const connId of connsToDelete) {
        await this.deleteConnection(connId);
      }

      // 5. Update or create nodes
      for (const node of nodes) {
        if (existingNodeIds.has(node.id)) {
          // Update existing node
          await this.updateNode(node.id, {
            position: node.position,
            config: node.data.config,
            inputs: node.data.inputs,
            outputs: node.data.outputs
          });
        } else {
          // Create new node
          await this.createNode({
            workflow_id: workflowId,
            node_id: node.id,
            type: node.type as any,
            name: node.data.label,
            position: node.position,
            config: node.data.config
          });
        }
      }

      // 6. Create new connections
      for (const edge of edges) {
        if (!existingConnIds.has(edge.id)) {
          await this.createConnection({
            workflow_id: workflowId,
            source_node_id: edge.source,
            target_node_id: edge.target,
            source_handle: edge.sourceHandle,
            target_handle: edge.targetHandle
          });
        }
      }

      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: error as Error };
    }
  }
}