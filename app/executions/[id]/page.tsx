'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Play,
  RefreshCw,
  Download,
  Code,
  FileText,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ExecutionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [execution, setExecution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock execution data
    const mockExecution = {
      id: params.id,
      workflowId: 'workflow-1',
      workflowName: 'Email to Slack Notifications',
      status: 'success',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      finishedAt: new Date(Date.now() - 3540000).toISOString(),
      executionTime: '1m 0s',
      mode: 'trigger',
      retryOf: null,
      nodes: [
        {
          id: 'node_1',
          name: 'Gmail Trigger',
          type: 'n8n-nodes-base.gmailTrigger',
          status: 'success',
          executionTime: '0.2s',
          items: 3,
          error: null
        },
        {
          id: 'node_2',
          name: 'Filter Urgent',
          type: 'n8n-nodes-base.if',
          status: 'success',
          executionTime: '0.1s',
          items: 1,
          error: null
        },
        {
          id: 'node_3',
          name: 'Send to Slack',
          type: 'n8n-nodes-base.slack',
          status: 'success',
          executionTime: '0.7s',
          items: 1,
          error: null
        }
      ],
      data: {
        input: {
          emails: [
            {
              from: 'client@example.com',
              subject: 'URGENT: Project Update Required',
              body: 'Please provide an update on the project status...',
              receivedAt: new Date(Date.now() - 3600000).toISOString()
            }
          ]
        },
        output: {
          slack: {
            channel: '#alerts',
            message: 'New urgent email from client@example.com',
            timestamp: new Date(Date.now() - 3540000).toISOString()
          }
        }
      }
    };

    setTimeout(() => {
      setExecution(mockExecution);
      setLoading(false);
    }, 500);
  }, [params.id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'waiting':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Execution not found</h2>
            <p className="text-gray-600 mb-4">The execution you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/executions')}>
              Back to Executions
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/executions')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm">
                <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                  Dashboard
                </Link>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <Link href="/executions" className="text-gray-500 hover:text-gray-700">
                  Executions
                </Link>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">#{execution.id}</span>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Execution Overview */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">Execution #{execution.id}</h1>
              <Link 
                href={`/workflows/${execution.workflowId}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {execution.workflowName}
              </Link>
            </div>
            <div className={`px-3 py-1 rounded-full ${getStatusColor(execution.status)}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(execution.status)}
                <span className="font-medium capitalize">{execution.status}</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500">Started</p>
              <p className="font-medium">{new Date(execution.startedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Finished</p>
              <p className="font-medium">{new Date(execution.finishedAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="font-medium">{execution.executionTime}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mode</p>
              <p className="font-medium capitalize">{execution.mode}</p>
            </div>
          </div>
        </div>

        {/* Node Execution Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Node Executions</h2>
          <div className="space-y-4">
            {execution.nodes.map((node: any, index: number) => (
              <div key={node.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium">{node.name}</h3>
                      <p className="text-sm text-gray-500">{node.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="text-gray-500">Items:</span>
                      <span className="font-medium ml-1">{node.items}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium ml-1">{node.executionTime}</span>
                    </div>
                    <div className={`px-2 py-1 rounded-full ${getStatusColor(node.status)}`}>
                      <div className="flex items-center space-x-1 text-xs">
                        {getStatusIcon(node.status)}
                        <span className="capitalize">{node.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {node.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                    {node.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Input/Output Data */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Input Data</h2>
              <Button variant="ghost" size="sm">
                <Code className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(execution.data.input, null, 2)}
            </pre>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Output Data</h2>
              <Button variant="ghost" size="sm">
                <Code className="h-4 w-4 mr-2" />
                JSON
              </Button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(execution.data.output, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}