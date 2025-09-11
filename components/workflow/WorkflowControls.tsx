'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Save,
  Download,
  Upload,
  Settings,
  Maximize2,
  Grid,
  ZoomIn,
  ZoomOut,
  Navigation,
  Layers,
  GitBranch,
  Activity,
  Code2,
  Eye,
  EyeOff,
  TestTube,
  Bug
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useReactFlow } from '@xyflow/react';

interface WorkflowControlsProps {
  onExecute?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  isExecuting?: boolean;
  isPaused?: boolean;
  showGrid?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  onToggleGrid?: (show: boolean) => void;
  onToggleMinimap?: (show: boolean) => void;
  onToggleControls?: (show: boolean) => void;
}

export function WorkflowControls({
  onExecute,
  onPause,
  onReset,
  onSave,
  onExport,
  onImport,
  isExecuting = false,
  isPaused = false,
  showGrid = true,
  showMinimap = true,
  showControls = true,
  onToggleGrid,
  onToggleMinimap,
  onToggleControls,
}: WorkflowControlsProps) {
  const [debugMode, setDebugMode] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const reactFlowInstance = useReactFlow();

  const handleZoomIn = () => {
    reactFlowInstance.zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    reactFlowInstance.zoomOut({ duration: 200 });
  };

  const handleFitView = () => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 200 });
  };

  const handleCenter = () => {
    const nodes = reactFlowInstance.getNodes();
    if (nodes.length > 0) {
      const centerNode = nodes[Math.floor(nodes.length / 2)];
      reactFlowInstance.setCenter(centerNode.position.x, centerNode.position.y, {
        zoom: 1,
        duration: 500,
      });
    }
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40"
      >
        <Card className="p-2">
          <div className="flex items-center gap-1">
            {/* Execution Controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isExecuting && !isPaused ? "default" : "ghost"}
                    onClick={isExecuting && !isPaused ? onPause : onExecute}
                    disabled={isExecuting && isPaused}
                  >
                    {isExecuting && !isPaused ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExecuting && !isPaused ? 'Pause Execution' : 'Run Workflow'}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onReset}
                    disabled={!isExecuting}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset Workflow</TooltipContent>
              </Tooltip>

              {testMode && (
                <Badge variant="secondary" className="ml-2">
                  Test Mode
                </Badge>
              )}
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomIn}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleZoomOut}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleFitView}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fit to View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCenter}
                  >
                    <Navigation className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Center View</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* File Operations */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onSave}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Save Workflow</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onExport}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export Workflow</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={onImport}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Import Workflow</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Debug/Test Controls */}
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={testMode ? "default" : "ghost"}
                    onClick={() => setTestMode(!testMode)}
                  >
                    <TestTube className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Test Mode</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={debugMode ? "default" : "ghost"}
                    onClick={() => setDebugMode(!debugMode)}
                  >
                    <Bug className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Debug Mode</TooltipContent>
              </Tooltip>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>View Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuCheckboxItem
                  checked={showGrid}
                  onCheckedChange={onToggleGrid}
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Show Grid
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={showMinimap}
                  onCheckedChange={onToggleMinimap}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  Show Minimap
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuCheckboxItem
                  checked={showControls}
                  onCheckedChange={onToggleControls}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Show Controls
                </DropdownMenuCheckboxItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel>Data Visualization</DropdownMenuLabel>
                
                <DropdownMenuItem>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Connection Paths
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Activity className="h-4 w-4 mr-2" />
                  Execution Flow
                </DropdownMenuItem>
                
                <DropdownMenuItem>
                  <Code2 className="h-4 w-4 mr-2" />
                  Node Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}