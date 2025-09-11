'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { SimplifiedWorkflowChat } from '@/components/ai/SimplifiedWorkflowChat';
import { SimpleWorkflowVisualizer } from '@/components/workflow/SimpleWorkflowVisualizer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Workflow,
  Download,
  Share2,
  Play,
  Save,
  Settings,
  Eye,
  Code
} from 'lucide-react';
import Link from 'next/link';

function WorkflowBuilderContent() {
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') || '';
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  New Idea
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Workflow className="h-5 w-5 text-primary" />
                <h1 className="text-lg font-semibold">AI Workflow Builder</h1>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Play className="h-4 w-4 mr-2" />
                Test
              </Button>
              <Button variant="ghost" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
          {/* Chat Interface */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
          >
            <SimplifiedWorkflowChat
              initialIdea={idea}
              onWorkflowGenerated={setCurrentWorkflow}
            />
          </motion.div>

          {/* Visual Builder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-full"
          >
            <Card className="h-full flex flex-col">
              {/* View Toggle */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Workflow Canvas</h3>
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === 'visual' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('visual')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visual
                    </Button>
                    <Button
                      variant={viewMode === 'code' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('code')}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Code
                    </Button>
                  </div>
                </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 p-6 overflow-hidden">
                {viewMode === 'visual' ? (
                  <SimpleWorkflowVisualizer workflow={currentWorkflow} />
                ) : (
                  <div className="h-full">
                    <pre className="h-full overflow-auto p-4 bg-muted/30 rounded-lg text-sm">
                      <code>
                        {currentWorkflow 
                          ? JSON.stringify(currentWorkflow, null, 2)
                          : '// Your workflow code will appear here'}
                      </code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Status Bar */}
              <div className="p-3 border-t bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-xs">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                        Ready
                      </div>
                    </Badge>
                    <span className="text-muted-foreground">
                      Nodes: {currentWorkflow?.nodes?.length || 0}
                    </span>
                    <span className="text-muted-foreground">
                      Connections: {currentWorkflow?.connections?.length || 0}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Settings
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowBuilderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <WorkflowBuilderContent />
    </Suspense>
  );
}