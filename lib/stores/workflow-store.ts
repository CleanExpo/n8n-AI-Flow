import { create } from 'zustand';
import { Node, Edge, Connection, applyNodeChanges, applyEdgeChanges, addEdge, NodeChange, EdgeChange } from '@xyflow/react';
import { WorkflowNode, NodeConnection, Workflow } from '@/lib/types/database';

interface WorkflowState {
  // Current workflow
  workflow: Workflow | null;
  
  // React Flow state
  nodes: Node[];
  edges: Edge[];
  
  // UI state
  selectedNode: Node | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  setWorkflow: (workflow: Workflow | null) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Node operations
  addNode: (node: Node) => void;
  updateNode: (nodeId: string, data: Partial<Node>) => void;
  deleteNode: (nodeId: string) => void;
  setSelectedNode: (node: Node | null) => void;
  
  // Edge operations
  deleteEdge: (edgeId: string) => void;
  
  // Workflow operations
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (workflowId: string) => Promise<void>;
  executeWorkflow: () => Promise<void>;
  activateWorkflow: () => Promise<void>;
  deactivateWorkflow: () => Promise<void>;
  
  // Utility
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,

  // Basic setters
  setWorkflow: (workflow) => set({ workflow }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSelectedNode: (selectedNode) => set({ selectedNode }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // React Flow handlers
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          id: `${connection.source}-${connection.target}`,
          type: 'smoothstep',
          animated: true,
        },
        get().edges
      ),
    });
  },

  // Node operations
  addNode: (node) => {
    set((state) => ({
      nodes: [...state.nodes, node],
    }));
  },

  updateNode: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...data } : node
      ),
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
    }));
  },

  // Edge operations
  deleteEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
    }));
  },

  // Workflow operations
  saveWorkflow: async () => {
    const state = get();
    if (!state.workflow) return;

    set({ isSaving: true, error: null });

    try {
      const response = await fetch(`/api/workflows/${state.workflow.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: state.nodes,
          edges: state.edges,
          operation: 'sync',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save workflow');
      }

      const result = await response.json();
      
      // Update workflow config with n8n ID
      set((state) => ({
        workflow: state.workflow ? {
          ...state.workflow,
          config: {
            ...state.workflow.config,
            n8n_workflow_id: result.data?.n8nWorkflowId,
            last_synced: new Date().toISOString(),
          }
        } : null,
        isSaving: false,
      }));
      
      return result.data;
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to save workflow',
      });
      throw error;
    }
  },

  // Activate/Deactivate workflow
  activateWorkflow: async () => {
    const state = get();
    if (!state.workflow) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/workflows/${state.workflow.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: state.nodes,
          edges: state.edges,
          operation: 'activate',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to activate workflow');
      }

      set((state) => ({
        workflow: state.workflow ? {
          ...state.workflow,
          status: 'active',
        } : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to activate workflow',
      });
      throw error;
    }
  },

  deactivateWorkflow: async () => {
    const state = get();
    if (!state.workflow) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/workflows/${state.workflow.id}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: state.nodes,
          edges: state.edges,
          operation: 'deactivate',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate workflow');
      }

      set((state) => ({
        workflow: state.workflow ? {
          ...state.workflow,
          status: 'inactive',
        } : null,
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to deactivate workflow',
      });
      throw error;
    }
  },

  loadWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (!response.ok) {
        throw new Error('Failed to load workflow');
      }

      const { data } = await response.json();
      
      // Convert database nodes and connections to React Flow format
      const nodes = data.nodes?.map((node: WorkflowNode) => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          label: node.name,
          ...node.config,
        },
      })) || [];

      const edges = data.connections?.map((conn: NodeConnection) => ({
        id: conn.id,
        source: conn.source_node_id,
        target: conn.target_node_id,
        sourceHandle: conn.source_handle,
        targetHandle: conn.target_handle,
        type: 'smoothstep',
        animated: true,
      })) || [];

      set({
        workflow: data,
        nodes,
        edges,
        isLoading: false,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load workflow',
      });
    }
  },

  executeWorkflow: async () => {
    const state = get();
    if (!state.workflow) return;

    set({ isLoading: true, error: null });

    try {
      const response = await fetch(`/api/workflows/${state.workflow.id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input_data: {},
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute workflow');
      }

      const { data } = await response.json();
      
      set({ isLoading: false });
      
      // Return execution ID for monitoring
      return data.id;
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow',
      });
    }
  },

  // Reset store
  reset: () => {
    set(initialState);
  },
}));