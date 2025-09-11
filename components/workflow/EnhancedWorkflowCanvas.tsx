'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ConnectionMode,
  MarkerType,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Panel,
  NodeTypes,
  EdgeTypes,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomNode as CustomNodeComponent } from './nodes/custom-nodes';
import { AnimatedEdge } from './edges/AnimatedEdge';
import { DataFlowEdge } from './edges/DataFlowEdge';
import { LearningModePanel } from './LearningModePanel';
import { WorkflowControls } from './WorkflowControls';
import { DataFlowVisualization } from './DataFlowVisualization';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  Eye,
  EyeOff,
  Layers,
  Network,
  PlayCircle,
  Settings,
  Sparkles,
  Zap,
  Info,
  Code,
  Database,
  GitBranch
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const nodeTypes: NodeTypes = {
  custom: CustomNodeComponent,
};

const edgeTypes: EdgeTypes = {
  animated: AnimatedEdge,
  dataFlow: DataFlowEdge,
};

interface EnhancedWorkflowCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
  onExecute?: () => void;
  isExecuting?: boolean;
  executionData?: any;
}

function WorkflowCanvasContent({
  initialNodes = [],
  initialEdges = [],
  onNodesChange,
  onEdgesChange,
  onExecute,
  isExecuting = false,
  executionData
}: EnhancedWorkflowCanvasProps) {
  const [nodes, setNodes, handleNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, handleEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [learningMode, setLearningMode] = useState(false);
  const [showDataFlow, setShowDataFlow] = useState(false);
  const [showExecutionPath, setShowExecutionPath] = useState(false);
  const [viewMode, setViewMode] = useState<'design' | 'execute' | 'debug'>('design');
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();

  // Handle connection creation
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        type: learningMode ? 'dataFlow' : 'animated',
        animated: true,
        style: {
          stroke: learningMode ? '#10b981' : '#64748b',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: learningMode ? '#10b981' : '#64748b',
        },
        data: {
          learningMode,
          label: learningMode ? 'Data Flow' : undefined,
        }
      };
      
      setEdges((eds) => addEdge(newEdge, eds));
      
      if (learningMode) {
        toast({
          title: "Connection Created",
          description: "Data will flow from source to target node during execution",
        });
      }
    },
    [setEdges, learningMode, toast]
  );

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    
    if (learningMode) {
      // Highlight connected edges
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          style: {
            ...edge.style,
            stroke: edge.source === node.id || edge.target === node.id
              ? '#3b82f6'
              : '#64748b',
            strokeWidth: edge.source === node.id || edge.target === node.id ? 3 : 2,
          },
        }))
      );
    }
  }, [learningMode, setEdges]);

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    
    if (learningMode) {
      // Show data flow animation
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          animated: e.id === edge.id,
          style: {
            ...e.style,
            stroke: e.id === edge.id ? '#3b82f6' : '#64748b',
            strokeWidth: e.id === edge.id ? 3 : 2,
          },
        }))
      );
    }
  }, [learningMode, setEdges]);

  // Simulate execution flow
  const simulateExecution = useCallback(() => {
    if (!nodes.length) return;

    let currentNodeIndex = 0;
    const executionInterval = setInterval(() => {
      if (currentNodeIndex >= nodes.length) {
        clearInterval(executionInterval);
        return;
      }

      const currentNode = nodes[currentNodeIndex];
      
      // Highlight current executing node
      setNodes((nds) =>
        nds.map((node) => ({
          ...node,
          data: {
            ...node.data,
            isExecuting: node.id === currentNode.id,
            executionStatus: node.id === currentNode.id ? 'running' : 
                           currentNodeIndex > nds.findIndex(n => n.id === node.id) ? 'completed' : 'pending'
          },
        }))
      );

      // Animate edges from current node
      setEdges((eds) =>
        eds.map((edge) => ({
          ...edge,
          animated: edge.source === currentNode.id,
          style: {
            ...edge.style,
            stroke: edge.source === currentNode.id ? '#10b981' : 
                   currentNodeIndex > nodes.findIndex(n => n.id === edge.source) ? '#22c55e' : '#64748b',
          },
        }))
      );

      currentNodeIndex++;
    }, 1000);

    return () => clearInterval(executionInterval);
  }, [nodes, setNodes, setEdges]);

  // Update parent components
  useEffect(() => {
    onNodesChange?.(nodes);
  }, [nodes, onNodesChange]);

  useEffect(() => {
    onEdgesChange?.(edges);
  }, [edges, onEdgesChange]);

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        className="bg-gradient-to-br from-background via-background to-muted/20"
      >
        {/* Canvas Controls */}
        <Panel position="top-left" className="space-y-2">
          <Card className="p-2">
            <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="design" className="text-xs">
                  <Layers className="h-3 w-3 mr-1" />
                  Design
                </TabsTrigger>
                <TabsTrigger value="execute" className="text-xs">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Execute
                </TabsTrigger>
                <TabsTrigger value="debug" className="text-xs">
                  <Code className="h-3 w-3 mr-1" />
                  Debug
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </Card>

          <Card className="p-2">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={showDataFlow ? "default" : "outline"}
                onClick={() => setShowDataFlow(!showDataFlow)}
                className="text-xs"
              >
                <GitBranch className="h-3 w-3 mr-1" />
                Data Flow
              </Button>
              <Button
                size="sm"
                variant={showExecutionPath ? "default" : "outline"}
                onClick={() => setShowExecutionPath(!showExecutionPath)}
                className="text-xs"
              >
                <Activity className="h-3 w-3 mr-1" />
                Execution Path
              </Button>
            </div>
          </Card>

          {viewMode === 'execute' && (
            <Card className="p-3">
              <div className="space-y-2">
                <Button
                  onClick={() => {
                    onExecute?.();
                    simulateExecution();
                  }}
                  disabled={isExecuting}
                  className="w-full"
                  size="sm"
                >
                  {isExecuting ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-pulse" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Run Workflow
                    </>
                  )}
                </Button>
                
                {isExecuting && (
                  <div className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      Processing node 3 of {nodes.length}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </Panel>

        {/* Execution Status Panel */}
        {viewMode === 'execute' && (
          <Panel position="top-right">
            <Card className="p-3 min-w-[200px]">
              <h3 className="text-sm font-medium mb-2">Execution Status</h3>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Nodes Executed:</span>
                  <Badge variant="secondary">3/{nodes.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Data Processed:</span>
                  <Badge variant="secondary">1.2MB</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span>Execution Time:</span>
                  <Badge variant="secondary">2.3s</Badge>
                </div>
              </div>
            </Card>
          </Panel>
        )}

        {/* Node Information Panel */}
        {selectedNode && viewMode === 'design' && (
          <Panel position="bottom-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-3 max-w-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">Node: {selectedNode.data?.label as string || 'Unnamed'}</h3>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>Type: {selectedNode.data?.type as string || 'Unknown'}</p>
                  <p>ID: {selectedNode.id}</p>
                  <p>Position: ({Math.round(selectedNode.position.x)}, {Math.round(selectedNode.position.y)})</p>
                </div>
              </Card>
            </motion.div>
          </Panel>
        )}

        <Controls className="bg-background border rounded-lg shadow-lg" />
        <MiniMap 
          className="bg-background border rounded-lg shadow-lg"
          nodeColor={(node) => {
            if (node.data?.isExecuting) return '#10b981';
            if (node.data?.executionStatus === 'completed') return '#22c55e';
            return '#64748b';
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={12} 
          size={1}
          className="opacity-50"
        />
      </ReactFlow>

      {/* Data Flow Visualization Overlay */}
      {showDataFlow && (
        <DataFlowVisualization
          nodes={nodes}
          edges={edges}
          executionData={executionData}
        />
      )}

      {/* Learning Mode Panel */}
      <LearningModePanel
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        executionData={executionData}
        isExecuting={isExecuting}
        onToggleLearningMode={setLearningMode}
      />
    </div>
  );
}

export function EnhancedWorkflowCanvas(props: EnhancedWorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasContent {...props} />
    </ReactFlowProvider>
  );
}