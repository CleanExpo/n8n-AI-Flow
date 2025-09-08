'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { ExecutionMonitor } from '@/components/workflow/ExecutionMonitor';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { 
  Save, 
  Play, 
  Settings, 
  Cloud, 
  CloudOff,
  Activity,
  Workflow as WorkflowIcon,
  ToggleLeft,
  ToggleRight,
  RefreshCw
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function WorkflowEditorPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  
  const {
    workflow,
    nodes,
    edges,
    isLoading,
    isSaving,
    error,
    loadWorkflow,
    saveWorkflow,
    executeWorkflow,
    activateWorkflow,
    deactivateWorkflow,
    reset,
  } = useWorkflowStore();

  const [syncStatus, setSyncStatus] = useState<{
    synced: boolean;
    active: boolean;
    lastSynced?: string;
    n8nWorkflowId?: string;
  }>({ synced: false, active: false });
  
  const [isSyncing, setIsSyncing] = useState(false);

  // Load workflow on mount
  useEffect(() => {
    loadWorkflow(id);
    checkSyncStatus();
    
    return () => {
      reset();
    };
  }, [id]);

  // Check sync status with n8n
  const checkSyncStatus = async () => {
    try {
      const response = await fetch(`/api/workflows/${id}/sync`);
      if (response.ok) {
        const data = await response.json();
        setSyncStatus({
          synced: data.synced,
          active: data.active,
          lastSynced: data.lastSynced,
          n8nWorkflowId: data.n8nWorkflow?.id,
        });
      }
    } catch (error) {
      console.error('Failed to check sync status:', error);
    }
  };

  // Handle save and sync with n8n
  const handleSaveAndSync = async () => {
    setIsSyncing(true);
    try {
      await saveWorkflow();
      
      toast({
        title: 'Workflow saved',
        description: 'Successfully synced with n8n',
      });
      
      await checkSyncStatus();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Failed to save workflow',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle workflow activation
  const handleActivation = async () => {
    if (!syncStatus.synced) {
      toast({
        title: 'Not synced',
        description: 'Please save and sync the workflow first',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (workflow?.status === 'active') {
        await deactivateWorkflow();
        toast({
          title: 'Workflow deactivated',
          description: 'Workflow is now inactive',
        });
      } else {
        await activateWorkflow();
        toast({
          title: 'Workflow activated',
          description: 'Workflow is now active and ready to execute',
        });
      }
      await checkSyncStatus();
    } catch (error) {
      toast({
        title: 'Activation failed',
        description: error instanceof Error ? error.message : 'Failed to change workflow status',
        variant: 'destructive',
      });
    }
  };

  // Handle workflow execution
  const handleExecute = async () => {
    if (workflow?.status !== 'active') {
      toast({
        title: 'Workflow not active',
        description: 'Please activate the workflow before executing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const executionId = await executeWorkflow();
      toast({
        title: 'Execution started',
        description: 'Workflow execution has been initiated',
      });
      return executionId;
    } catch (error) {
      toast({
        title: 'Execution failed',
        description: error instanceof Error ? error.message : 'Failed to execute workflow',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-lg mb-4">Workflow not found</p>
        <Button onClick={() => router.push('/workflows')}>
          Back to Workflows
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-4">
          <WorkflowIcon className="h-6 w-6" />
          <h1 className="text-xl font-semibold">{workflow.name}</h1>
          <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
            {workflow.status}
          </Badge>
          {syncStatus.synced && (
            <Badge variant="outline" className="flex items-center space-x-1">
              <Cloud className="h-3 w-3" />
              <span>Synced</span>
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Sync Status */}
          {syncStatus.lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {new Date(syncStatus.lastSynced).toLocaleTimeString()}
            </span>
          )}
          
          {/* Save Button */}
          <Button
            onClick={handleSaveAndSync}
            disabled={isSaving || isSyncing}
            variant="outline"
          >
            {isSaving || isSyncing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save & Sync
              </>
            )}
          </Button>
          
          {/* Activate/Deactivate Button */}
          <Button
            onClick={handleActivation}
            variant={workflow.status === 'active' ? 'destructive' : 'default'}
            disabled={!syncStatus.synced}
          >
            {workflow.status === 'active' ? (
              <>
                <ToggleRight className="mr-2 h-4 w-4" />
                Deactivate
              </>
            ) : (
              <>
                <ToggleLeft className="mr-2 h-4 w-4" />
                Activate
              </>
            )}
          </Button>
          
          {/* Execute Button */}
          <Button
            onClick={handleExecute}
            disabled={workflow.status !== 'active'}
          >
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="editor" className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b">
            <TabsTrigger value="editor">
              <WorkflowIcon className="mr-2 h-4 w-4" />
              Editor
            </TabsTrigger>
            <TabsTrigger value="executions">
              <Activity className="mr-2 h-4 w-4" />
              Executions
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="h-full p-0">
            <WorkflowCanvas />
          </TabsContent>

          <TabsContent value="executions" className="h-full p-0">
            <ExecutionMonitor 
              workflowId={id} 
              onExecute={handleExecute}
            />
          </TabsContent>

          <TabsContent value="settings" className="p-6">
            <Card className="max-w-2xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Workflow Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Workflow ID</label>
                    <p className="text-sm text-muted-foreground font-mono">{workflow.id}</p>
                  </div>
                  
                  {syncStatus.n8nWorkflowId && (
                    <div>
                      <label className="text-sm font-medium">n8n Workflow ID</label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {syncStatus.n8nWorkflowId}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-sm text-muted-foreground">{workflow.status}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Created</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workflow.created_at).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Last Updated</label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(workflow.updated_at).toLocaleString()}
                    </p>
                  </div>
                  
                  {workflow.description && (
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-muted-foreground">{workflow.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}