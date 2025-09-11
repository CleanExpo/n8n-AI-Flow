'use client';

// Force dynamic rendering to handle useSession
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export default function WorkflowsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { loadWorkflow, reset, workflow } = useWorkflowStore();

  // Check authentication
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchWorkflows();
    }
  }, [status, router]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const { data } = await response.json();
        setWorkflows(data || []);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('Failed to load workflows');
    }
  };

  const handleSelectWorkflow = async (workflowId: string) => {
    setSelectedWorkflowId(workflowId);
    await loadWorkflow(workflowId);
  };

  const handleCreateWorkflow = async () => {
    const name = prompt('Enter workflow name:');
    if (!name) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: '',
        }),
      });

      if (response.ok) {
        const { data } = await response.json();
        await fetchWorkflows();
        handleSelectWorkflow(data.id);
        toast.success('Workflow created successfully');
      } else {
        throw new Error('Failed to create workflow');
      }
    } catch (error) {
      toast.error('Failed to create workflow');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchWorkflows();
        if (selectedWorkflowId === workflowId) {
          setSelectedWorkflowId(null);
          reset();
        }
        toast.success('Workflow deleted');
      }
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <p className="text-lg text-gray-600">Please log in to access workflows</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg overflow-y-auto">
        {/* Breadcrumb */}
        <div className="p-4 border-b">
          <nav className="flex items-center space-x-2 text-sm">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium">Workflows</span>
          </nav>
        </div>
        
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Workflows</h2>
          
          <button
          onClick={handleCreateWorkflow}
          disabled={isCreating}
          className="w-full mb-4 bg-blue-500 text-white rounded-lg py-2 hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'New Workflow'}
        </button>

        <div className="space-y-2">
          {workflows.length > 0 ? (
            workflows.map((wf) => (
              <div
                key={wf.id}
                className={`relative group p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedWorkflowId === wf.id
                    ? 'bg-blue-100 border-blue-500 border'
                    : 'hover:bg-gray-100'
                }`}
              >
                <div onClick={() => handleSelectWorkflow(wf.id)}>
                  <div className="font-medium">{wf.name}</div>
                  <div className="text-sm text-gray-500">
                    Status: {wf.status || 'draft'}
                  </div>
                  {wf.last_run_at && (
                    <div className="text-xs text-gray-400">
                      Last run: {new Date(wf.last_run_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteWorkflow(wf.id);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                >
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-sm text-center py-4">
              No workflows yet. Create your first workflow to get started.
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {selectedWorkflowId && workflow ? (
          <>
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">{workflow.name}</h1>
                  {workflow.description && (
                    <p className="text-gray-600 mt-1">{workflow.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    workflow.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {workflow.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1">
              <WorkflowCanvas />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg mb-2">No workflow selected</p>
              <p className="text-sm">Select a workflow from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}