'use client';

import React, { useCallback, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  NodeToolbar,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { nodeTypes } from './nodes/custom-nodes';
import { NodeConfigPanel } from './NodeConfigPanel';
import { WorkflowToolbar } from './WorkflowToolbar';
import toast from 'react-hot-toast';

const WorkflowCanvasInner: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const {
    nodes,
    edges,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    saveWorkflow,
    executeWorkflow,
    isSaving,
    isLoading,
  } = useWorkflowStore();

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: any) => {
    setSelectedNode(node);
    setShowConfigPanel(true);
  }, [setSelectedNode]);

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setShowConfigPanel(false);
  }, [setSelectedNode]);

  // Handle drag over
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !reactFlowWrapper.current) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}_${Date.now()}`,
        type,
        position,
        data: {
          label: type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          description: `Configure your ${type} node`,
        },
      };

      addNode(newNode);
      toast.success(`Added ${newNode.data.label} node`);
    },
    [screenToFlowPosition, addNode]
  );

  // Handle save
  const handleSave = async () => {
    try {
      await saveWorkflow();
      toast.success('Workflow saved successfully');
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  // Handle execute
  const handleExecute = async () => {
    try {
      const executionId = await executeWorkflow();
      if (executionId) {
        toast.success('Workflow execution started');
        // TODO: Open execution monitor
      }
    } catch (error) {
      toast.error('Failed to execute workflow');
    }
  };

  return (
    <div className="h-full w-full relative" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Meta', 'Control']}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor={(node) => {
            if (node.type === 'webhook') return '#8b5cf6';
            if (node.type === 'ai_agent') return '#f59e0b';
            if (node.type === 'database') return '#06b6d4';
            return '#6366f1';
          }}
          nodeColor={(node) => {
            if (node.type === 'webhook') return '#e9d5ff';
            if (node.type === 'ai_agent') return '#fed7aa';
            if (node.type === 'database') return '#cffafe';
            return '#ddd6fe';
          }}
          pannable
          zoomable
        />

        {/* Top Panel with Toolbar */}
        <Panel position="top-left">
          <WorkflowToolbar />
        </Panel>

        {/* Bottom Panel with Actions */}
        <Panel position="bottom-center">
          <div className="flex gap-2 bg-white rounded-lg shadow-lg p-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Workflow'}
            </button>
            <button
              onClick={handleExecute}
              disabled={isLoading || nodes.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Executing...' : 'Execute Workflow'}
            </button>
          </div>
        </Panel>

        {/* Node Toolbar (appears on selection) */}
        {selectedNode && (
          <NodeToolbar
            nodeId={selectedNode.id}
            isVisible={!!selectedNode}
            position={Position.Top}
          >
            <div className="flex gap-1 bg-white rounded shadow-md p-1">
              <button
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowConfigPanel(true)}
              >
                Configure
              </button>
              <button
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => {
                  useWorkflowStore.getState().deleteNode(selectedNode.id);
                  setSelectedNode(null);
                  toast.success('Node deleted');
                }}
              >
                Delete
              </button>
            </div>
          </NodeToolbar>
        )}
      </ReactFlow>

      {/* Node Configuration Panel */}
      {showConfigPanel && selectedNode && (
        <NodeConfigPanel
          node={selectedNode}
          onClose={() => setShowConfigPanel(false)}
        />
      )}
    </div>
  );
};

export const WorkflowCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
};