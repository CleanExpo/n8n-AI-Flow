'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Terminal,
  FileJson,
  Activity
} from 'lucide-react';
// Removed date-fns dependency - using native date formatting
import { cn } from '@/lib/utils';

interface ExecutionLog {
  id: string;
  execution_id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  metadata?: any;
  node_id?: string;
}

interface Execution {
  id: string;
  workflow_id: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  started_at?: string;
  finished_at?: string;
  trigger_type: string;
  trigger_data?: any;
  input_data?: any;
  output_data?: any;
  error?: string;
  metadata?: any;
  n8n_execution_id?: string;
}

interface ExecutionMonitorProps {
  workflowId: string;
  onExecute?: () => void;
}

export function ExecutionMonitor({ workflowId, onExecute }: ExecutionMonitorProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch executions
  useEffect(() => {
    fetchExecutions();
    const interval = setInterval(fetchExecutions, 2000); // Poll every 2 seconds
    return () => clearInterval(interval);
  }, [workflowId]);

  // Fetch logs for selected execution
  useEffect(() => {
    if (selectedExecution) {
      fetchExecutionLogs(selectedExecution.id);
      
      // Poll more frequently if execution is running
      if (selectedExecution.status === 'running') {
        const interval = setInterval(() => {
          fetchExecutionLogs(selectedExecution.id);
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [selectedExecution?.id, selectedExecution?.status]);

  const fetchExecutions = async () => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}/executions`);
      if (response.ok) {
        const { data } = await response.json();
        setExecutions(data || []);
        
        // Update selected execution if it exists in the new data
        if (selectedExecution) {
          const updated = data.find((e: Execution) => e.id === selectedExecution.id);
          if (updated) {
            setSelectedExecution(updated);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch executions:', error);
    }
  };

  const fetchExecutionLogs = async (executionId: string) => {
    try {
      const response = await fetch(`/api/executions/${executionId}/logs`);
      if (response.ok) {
        const { data } = await response.json();
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_data: {} }),
      });

      if (response.ok) {
        const { data } = await response.json();
        setSelectedExecution(data);
        await fetchExecutions();
      } else {
        const error = await response.json();
        console.error('Execution failed:', error);
      }
    } catch (error) {
      console.error('Failed to execute workflow:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleStopExecution = async (executionId: string) => {
    try {
      await fetch(`/api/executions/${executionId}/stop`, {
        method: 'POST',
      });
      await fetchExecutions();
    } catch (error) {
      console.error('Failed to stop execution:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <StopCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-500';
      case 'success':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
  };

  const toggleNodeExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Execution Monitor</h2>
        <Button
          onClick={onExecute || handleExecute}
          disabled={isExecuting}
          size="sm"
        >
          {isExecuting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Execute
            </>
          )}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Executions List */}
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {executions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No executions yet
                </p>
              ) : (
                executions.map((execution) => (
                  <Card
                    key={execution.id}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedExecution?.id === execution.id && "border-primary"
                    )}
                    onClick={() => setSelectedExecution(execution)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(execution.status)}
                          <span className="text-sm font-medium">
                            #{execution.id.slice(0, 8)}
                          </span>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-white",
                            getStatusColor(execution.status)
                          )}
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {execution.trigger_type} • {' '}
                        {execution.started_at
                          ? new Date(execution.started_at).toLocaleString()
                          : 'Not started'}
                      </div>
                      {execution.status === 'running' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStopExecution(execution.id);
                          }}
                        >
                          <StopCircle className="mr-2 h-3 w-3" />
                          Stop
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Execution Details */}
        <div className="flex-1">
          {selectedExecution ? (
            <Tabs defaultValue="logs" className="h-full">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="logs">
                  <Terminal className="mr-2 h-4 w-4" />
                  Logs
                </TabsTrigger>
                <TabsTrigger value="input">
                  <FileJson className="mr-2 h-4 w-4" />
                  Input
                </TabsTrigger>
                <TabsTrigger value="output">
                  <FileJson className="mr-2 h-4 w-4" />
                  Output
                </TabsTrigger>
                <TabsTrigger value="metadata">
                  <Activity className="mr-2 h-4 w-4" />
                  Metadata
                </TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="flex-1 p-0">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="p-4 space-y-2">
                    {logs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No logs available
                      </p>
                    ) : (
                      logs.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start space-x-2 text-sm"
                        >
                          {getLogIcon(log.level)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                              {log.node_id && (
                                <Badge variant="outline" className="text-xs">
                                  {log.node_id.slice(0, 8)}
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1">{log.message}</p>
                            {log.metadata && (
                              <div className="mt-2">
                                <button
                                  onClick={() => toggleNodeExpanded(log.id)}
                                  className="flex items-center text-xs text-muted-foreground hover:text-foreground"
                                >
                                  {expandedNodes.has(log.id) ? (
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 mr-1" />
                                  )}
                                  Metadata
                                </button>
                                {expandedNodes.has(log.id) && (
                                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="input" className="flex-1 p-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
                    {JSON.stringify(selectedExecution.input_data || {}, null, 2)}
                  </pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="output" className="flex-1 p-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  {selectedExecution.status === 'running' ? (
                    <div className="text-center py-8">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Execution in progress...
                      </p>
                    </div>
                  ) : selectedExecution.error ? (
                    <div className="text-red-500 p-4 bg-red-50 rounded">
                      <p className="font-semibold mb-2">Error:</p>
                      <pre className="text-sm overflow-x-auto">
                        {selectedExecution.error}
                      </pre>
                    </div>
                  ) : (
                    <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
                      {JSON.stringify(selectedExecution.output_data || {}, null, 2)}
                    </pre>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="metadata" className="flex-1 p-4">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Execution Details</h3>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">ID:</dt>
                          <dd className="font-mono">{selectedExecution.id}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Status:</dt>
                          <dd>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-white",
                                getStatusColor(selectedExecution.status)
                              )}
                            >
                              {selectedExecution.status}
                            </Badge>
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Trigger:</dt>
                          <dd>{selectedExecution.trigger_type}</dd>
                        </div>
                        {selectedExecution.started_at && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Started:</dt>
                            <dd>
                              {new Date(selectedExecution.started_at).toLocaleString()}
                            </dd>
                          </div>
                        )}
                        {selectedExecution.finished_at && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">Finished:</dt>
                            <dd>
                              {new Date(selectedExecution.finished_at).toLocaleString()}
                            </dd>
                          </div>
                        )}
                        {selectedExecution.n8n_execution_id && (
                          <div className="flex justify-between">
                            <dt className="text-muted-foreground">n8n ID:</dt>
                            <dd className="font-mono">
                              {selectedExecution.n8n_execution_id}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>
                    
                    {selectedExecution.metadata && (
                      <div>
                        <h3 className="font-semibold mb-2">Additional Metadata</h3>
                        <pre className="text-sm bg-muted p-4 rounded overflow-x-auto">
                          {JSON.stringify(selectedExecution.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select an execution to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}