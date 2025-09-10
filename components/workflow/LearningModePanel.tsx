'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Book,
  Code,
  Info,
  Activity,
  Eye,
  EyeOff,
  Zap,
  GitBranch,
  Database,
  Server,
  Settings,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Brain,
  Layers,
  Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface LearningModePanelProps {
  selectedNode?: any;
  selectedEdge?: any;
  executionData?: any;
  isExecuting?: boolean;
  onToggleLearningMode?: (enabled: boolean) => void;
}

export function LearningModePanel({
  selectedNode,
  selectedEdge,
  executionData,
  isExecuting = false,
  onToggleLearningMode
}: LearningModePanelProps) {
  const [learningMode, setLearningMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['basics']);
  const [dataFlowVisible, setDataFlowVisible] = useState(true);
  const [connectionDetails, setConnectionDetails] = useState(true);
  const [executionSteps, setExecutionSteps] = useState(true);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleLearningModeToggle = (enabled: boolean) => {
    setLearningMode(enabled);
    onToggleLearningMode?.(enabled);
  };

  return (
    <AnimatePresence>
      {learningMode && (
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-background border-l border-border shadow-xl z-40"
        >
          <Card className="h-full rounded-none border-0">
            <CardHeader className="sticky top-0 bg-background z-10 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <CardTitle>Learning Mode</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleLearningModeToggle(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="data-flow">Show Data Flow</Label>
                  <Switch
                    id="data-flow"
                    checked={dataFlowVisible}
                    onCheckedChange={setDataFlowVisible}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="connections">Connection Details</Label>
                  <Switch
                    id="connections"
                    checked={connectionDetails}
                    onCheckedChange={setConnectionDetails}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="execution">Execution Steps</Label>
                  <Switch
                    id="execution"
                    checked={executionSteps}
                    onCheckedChange={setExecutionSteps}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                <div className="p-4 space-y-4">
                  {/* Workflow Basics */}
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleSection('basics')}
                      className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Book className="h-4 w-4" />
                        <span className="font-medium">Workflow Basics</span>
                      </div>
                      {expandedSections.includes('basics') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedSections.includes('basics') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pl-6 space-y-2"
                      >
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium mb-1">What is a Workflow?</h4>
                          <p className="text-xs text-muted-foreground">
                            A workflow is a series of automated steps (nodes) connected together to process data. 
                            Each node performs a specific task and passes data to the next node.
                          </p>
                        </div>
                        
                        <div className="p-3 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium mb-1">Node Types</h4>
                          <div className="space-y-1 mt-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Trigger</Badge>
                              <span className="text-xs">Starts the workflow</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Action</Badge>
                              <span className="text-xs">Performs operations</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Logic</Badge>
                              <span className="text-xs">Controls flow</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <Separator />

                  {/* Selected Node Details */}
                  {selectedNode && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('node')}
                        className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          <span className="font-medium">Selected Node</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedNode.data?.label}
                          </Badge>
                        </div>
                        {expandedSections.includes('node') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {expandedSections.includes('node') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 space-y-2"
                        >
                          <div className="p-3 bg-muted rounded-lg">
                            <h4 className="text-sm font-medium mb-2">How it Works</h4>
                            <p className="text-xs text-muted-foreground mb-2">
                              {getNodeExplanation(selectedNode.data?.type)}
                            </p>
                            
                            <h4 className="text-sm font-medium mb-1 mt-3">Input Data</h4>
                            <div className="p-2 bg-background rounded text-xs font-mono">
                              {JSON.stringify(selectedNode.data?.parameters || {}, null, 2)}
                            </div>
                            
                            {executionData && (
                              <>
                                <h4 className="text-sm font-medium mb-1 mt-3">Output Data</h4>
                                <div className="p-2 bg-background rounded text-xs font-mono">
                                  {JSON.stringify(executionData.output || {}, null, 2)}
                                </div>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Connection Details */}
                  {selectedEdge && connectionDetails && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('connection')}
                        className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4" />
                          <span className="font-medium">Connection Flow</span>
                        </div>
                        {expandedSections.includes('connection') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {expandedSections.includes('connection') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 space-y-2"
                        >
                          <div className="p-3 bg-muted rounded-lg">
                            <h4 className="text-sm font-medium mb-2">Data Transfer</h4>
                            <p className="text-xs text-muted-foreground">
                              Data flows from the source node to the target node. 
                              The output of one node becomes the input of the next.
                            </p>
                            
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Source</Badge>
                                <span className="text-xs">{selectedEdge.source}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">Target</Badge>
                                <span className="text-xs">{selectedEdge.target}</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* Execution Flow */}
                  {executionSteps && (
                    <div className="space-y-2">
                      <button
                        onClick={() => toggleSection('execution')}
                        className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4" />
                          <span className="font-medium">Execution Flow</span>
                          {isExecuting && (
                            <Badge variant="default" className="text-xs animate-pulse">
                              Running
                            </Badge>
                          )}
                        </div>
                        {expandedSections.includes('execution') ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      
                      {expandedSections.includes('execution') && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 space-y-2"
                        >
                          <ExecutionSteps isExecuting={isExecuting} />
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Tips & Best Practices */}
                  <div className="space-y-2">
                    <button
                      onClick={() => toggleSection('tips')}
                      className="flex items-center justify-between w-full p-2 hover:bg-accent rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        <span className="font-medium">Tips & Best Practices</span>
                      </div>
                      {expandedSections.includes('tips') ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    
                    {expandedSections.includes('tips') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="pl-6 space-y-2"
                      >
                        <div className="p-3 bg-muted rounded-lg space-y-2">
                          <div className="flex gap-2">
                            <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
                            <div>
                              <p className="text-xs font-medium">Use Error Handling</p>
                              <p className="text-xs text-muted-foreground">
                                Add error handling nodes to manage failures gracefully
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
                            <div>
                              <p className="text-xs font-medium">Test with Sample Data</p>
                              <p className="text-xs text-muted-foreground">
                                Always test your workflow with sample data before production
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Zap className="h-3 w-3 mt-0.5 text-yellow-500" />
                            <div>
                              <p className="text-xs font-medium">Document Your Workflows</p>
                              <p className="text-xs text-muted-foreground">
                                Add descriptions to nodes for better maintainability
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Floating Toggle Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed right-4 bottom-4 z-50"
      >
        <Button
          onClick={() => handleLearningModeToggle(!learningMode)}
          size="lg"
          className="rounded-full shadow-lg"
          variant={learningMode ? "secondary" : "default"}
        >
          {learningMode ? (
            <>
              <EyeOff className="h-5 w-5 mr-2" />
              Hide Learning
            </>
          ) : (
            <>
              <Brain className="h-5 w-5 mr-2" />
              Learning Mode
            </>
          )}
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}

function ExecutionSteps({ isExecuting }: { isExecuting: boolean }) {
  const steps = [
    { id: 1, name: 'Initialize Workflow', status: 'completed', duration: '12ms' },
    { id: 2, name: 'Load Node Data', status: 'completed', duration: '8ms' },
    { id: 3, name: 'Execute Trigger', status: 'completed', duration: '45ms' },
    { id: 4, name: 'Process HTTP Request', status: isExecuting ? 'running' : 'pending', duration: '...' },
    { id: 5, name: 'Transform Data', status: 'pending', duration: '-' },
    { id: 6, name: 'Send Response', status: 'pending', duration: '-' },
  ];

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <motion.div
          key={step.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center justify-between p-2 bg-muted rounded-lg"
        >
          <div className="flex items-center gap-2">
            {step.status === 'completed' && (
              <div className="h-2 w-2 bg-green-500 rounded-full" />
            )}
            {step.status === 'running' && (
              <div className="h-2 w-2 bg-yellow-500 rounded-full animate-pulse" />
            )}
            {step.status === 'pending' && (
              <div className="h-2 w-2 bg-gray-300 rounded-full" />
            )}
            <span className="text-xs">{step.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">{step.duration}</span>
        </motion.div>
      ))}
    </div>
  );
}

function getNodeExplanation(nodeType: string): string {
  const explanations: Record<string, string> = {
    'n8n-nodes-base.httpRequest': 'Makes HTTP requests to external APIs or webhooks. Can send GET, POST, PUT, DELETE requests with custom headers and body.',
    'n8n-nodes-base.webhook': 'Creates an endpoint that listens for incoming HTTP requests. Used to trigger workflows from external services.',
    'n8n-nodes-base.set': 'Sets or transforms data values. Used to prepare data for the next node or format output.',
    'n8n-nodes-base.if': 'Conditional logic node that routes workflow based on conditions. Creates branches for different scenarios.',
    'n8n-nodes-base.function': 'Executes custom JavaScript code for complex data transformations or business logic.',
    'n8n-nodes-base.merge': 'Combines data from multiple branches into a single output. Useful for aggregating results.',
    default: 'This node processes data according to its configuration and passes the result to connected nodes.'
  };

  return explanations[nodeType] || explanations.default;
}