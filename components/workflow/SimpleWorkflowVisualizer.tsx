'use client';

import React, { useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Webhook, 
  Bot, 
  Database, 
  Mail, 
  MessageSquare,
  Globe,
  FileText,
  Code,
  Zap,
  GitBranch,
  Calendar,
  Play,
  Settings,
  Video,
  Music,
  Mic,
  Youtube,
  HardDrive,
  Bell
} from 'lucide-react';

// Map n8n node types to icons
const getNodeIcon = (type: string): any => {
  const typeMap: Record<string, any> = {
    'webhook': Webhook,
    'manualTrigger': Play,
    'scheduleTrigger': Calendar,
    'googleSheets': FileText,
    'httpRequest': Globe,
    'openAi': Bot,
    'set': Settings,
    'if': GitBranch,
    'function': Code,
    'email': Mail,
    'slack': MessageSquare,
    'database': Database,
    'wait': Calendar,
    'splitInBatches': GitBranch,
    'merge': GitBranch,
    'executeCommand': Zap,
    'youtube': Youtube,
    'googleDrive': HardDrive,
    'respondToWebhook': Globe,
    'video': Video,
    'audio': Music,
    'voiceover': Mic,
  };

  // Extract base type from full n8n node type
  const baseType = type.split('.').pop()?.replace('n8n-nodes-base', '') || '';
  
  // Check for various patterns
  for (const [key, icon] of Object.entries(typeMap)) {
    if (baseType.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  
  return Zap; // Default icon
};

// Custom node component
const CustomNode = ({ data }: { data: any }) => {
  const Icon = data.icon || Zap;
  
  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg p-3 min-w-[180px]">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 bg-primary/10 rounded">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 truncate">
          <div className="font-semibold text-sm truncate">{data.label}</div>
        </div>
      </div>
      {data.description && (
        <div className="text-xs text-gray-600 truncate">{data.description}</div>
      )}
      <div className="flex gap-1 mt-2">
        <div className="h-1 flex-1 bg-green-500 rounded" />
        <div className="h-1 flex-1 bg-gray-200 rounded" />
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

interface SimpleWorkflowVisualizerProps {
  workflow: any;
}

function SimpleWorkflowVisualizerInner({ workflow }: SimpleWorkflowVisualizerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Convert n8n workflow to ReactFlow format
  const { flowNodes, flowEdges } = useMemo(() => {
    if (!workflow?.nodes) {
      return { flowNodes: [], flowEdges: [] };
    }

    // Convert nodes
    const flowNodes: Node[] = workflow.nodes.map((node: any) => {
      const icon = getNodeIcon(node.type);
      
      return {
        id: node.id || node.name,
        type: 'custom',
        position: {
          x: node.position?.[0] || Math.random() * 500,
          y: node.position?.[1] || Math.random() * 300,
        },
        data: {
          label: node.name,
          description: node.type.split('.').pop(),
          icon: icon,
          ...node.parameters,
        },
      };
    });

    // Convert connections to edges
    const flowEdges: Edge[] = [];
    if (workflow.connections) {
      Object.entries(workflow.connections).forEach(([sourceName, targets]: [string, any]) => {
        if (targets.main) {
          targets.main.forEach((targetArray: any[], outputIndex: number) => {
            targetArray.forEach((target: any) => {
              const sourceNode = workflow.nodes.find((n: any) => n.name === sourceName);
              const targetNode = workflow.nodes.find((n: any) => n.name === target.node);
              
              if (sourceNode && targetNode) {
                flowEdges.push({
                  id: `${sourceNode.id || sourceName}-${targetNode.id || target.node}`,
                  source: sourceNode.id || sourceName,
                  target: targetNode.id || target.node,
                  type: 'smoothstep',
                  animated: true,
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 20,
                    height: 20,
                  },
                  style: {
                    stroke: '#6366f1',
                    strokeWidth: 2,
                  },
                });
              }
            });
          });
        }
      });
    }

    return { flowNodes, flowEdges };
  }, [workflow]);

  // Update nodes and edges when workflow changes
  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // Auto-layout nodes if they don't have positions
  useEffect(() => {
    if (nodes.length > 0) {
      const needsLayout = nodes.some(node => 
        node.position.x === 0 || 
        node.position.y === 0 ||
        isNaN(node.position.x) ||
        isNaN(node.position.y)
      );
      
      if (needsLayout) {
        const layoutedNodes = nodes.map((node, index) => ({
          ...node,
          position: {
            x: 250 + (index * 200),
            y: 150 + (index % 2 === 0 ? 0 : 100),
          },
        }));
        setNodes(layoutedNodes);
      }
    }
  }, [nodes, setNodes]);

  if (!workflow || !workflow.nodes || workflow.nodes.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto">
            <Bot className="h-12 w-12 text-primary" />
          </div>
          <h4 className="text-lg font-medium">No Workflow Yet</h4>
          <p className="text-sm text-gray-600 max-w-sm">
            Start chatting with the AI assistant to build your workflow
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeStrokeColor="#6366f1"
          nodeColor="#e0e7ff"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}

export function SimpleWorkflowVisualizer({ workflow }: SimpleWorkflowVisualizerProps) {
  return (
    <ReactFlowProvider>
      <SimpleWorkflowVisualizerInner workflow={workflow} />
    </ReactFlowProvider>
  );
}