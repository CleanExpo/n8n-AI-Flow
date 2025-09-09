'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Workflow,
  Plus,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Settings,
  LogOut,
  User,
  Loader2,
  ArrowRight,
  Zap,
  Calendar,
  TrendingUp,
  Bot,
  Sparkles,
  Rocket
} from 'lucide-react';
import { DemoMode } from '@/components/demo/DemoMode';

interface WorkflowSummary {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastRun?: string;
  executionCount: number;
}

interface Stats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successRate: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<WorkflowSummary[]>([]);
  const [showDemo, setShowDemo] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalWorkflows: 0,
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      // Fetch workflows
      const workflowsRes = await fetch('/api/workflows');
      if (workflowsRes.ok) {
        const workflowsResponse = await workflowsRes.json();
        const workflowsData = workflowsResponse.data || [];
        setWorkflows(workflowsData.slice(0, 5)); // Show latest 5
        
        // Calculate stats
        setStats({
          totalWorkflows: workflowsData.length,
          activeWorkflows: workflowsData.filter((w: any) => w.status === 'active').length,
          totalExecutions: workflowsData.reduce((acc: number, w: any) => acc + (w.executionCount || 0), 0),
          successRate: workflowsData.length > 0 ? 95 : 0 // Mock for now
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Workflow className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">n8n AI Flow</span>
              </Link>
              <nav className="ml-10 flex space-x-4">
                <Link href="/dashboard" className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/workflows" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Workflows
                </Link>
                <Link href="/executions" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Executions
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700">{session?.user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0]}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's an overview of your automation workflows
          </p>
        </div>

        {/* AI Workflow Generator Banner */}
        <div className="mb-8 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg overflow-hidden">
          <div className="px-8 py-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  AI Workflow Generator
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                </h2>
                <p className="text-white/90 mt-1">
                  Create workflows instantly using natural language, images, or documents
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDemo(true)}
                className="bg-white/20 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center gap-2 border border-white/30"
              >
                <Rocket className="h-5 w-5" />
                Start Demo
              </button>
              <Link
                href="/ai-workflow"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors flex items-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Try AI Generator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWorkflows}</p>
              </div>
              <Workflow className="h-10 w-10 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWorkflows}</p>
              </div>
              <Zap className="h-10 w-10 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Executions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExecutions}</p>
              </div>
              <Play className="h-10 w-10 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-yellow-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Recent Workflows and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Workflows */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Workflows</h2>
                  <Link 
                    href="/workflows" 
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                  >
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {workflows.length > 0 ? (
                  workflows.map((workflow) => (
                    <div key={workflow.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(workflow.status)}
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{workflow.name}</h3>
                            <p className="text-sm text-gray-500">
                              {workflow.lastRun ? `Last run: ${new Date(workflow.lastRun).toLocaleDateString()}` : 'Never executed'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(workflow.status)}`}>
                            {workflow.status}
                          </span>
                          <Link
                            href={`/workflows/${workflow.id}`}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Settings className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center">
                    <Workflow className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No workflows yet</p>
                    <Link
                      href="/workflows/new"
                      className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Create your first workflow
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Create New Workflow */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/workflows/new"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Workflow
                </Link>
                <Link
                  href="/workflows/templates"
                  className="w-full border border-gray-300 hover:border-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
                >
                  <Workflow className="h-5 w-5 mr-2" />
                  Browse Templates
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Workflow executed successfully</p>
                    <p className="text-xs text-gray-500">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Workflow scheduled</p>
                    <p className="text-xs text-gray-500">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Plus className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New workflow created</p>
                    <p className="text-xs text-gray-500">3 hours ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Demo Mode Modal */}
      {showDemo && (
        <DemoMode 
          isOpen={showDemo}
          onClose={() => setShowDemo(false)}
          onSelectScenario={(scenario) => {
            console.log('Selected scenario:', scenario);
            setShowDemo(false);
            router.push('/ai-workflow');
          }}
        />
      )}
    </div>
  );
}