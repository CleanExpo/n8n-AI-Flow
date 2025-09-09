'use client';

import { YouTubeAnimationBuilder } from '@/components/youtube/YouTubeAnimationBuilder';
import { WorkflowCanvas } from '@/components/workflow/WorkflowCanvas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Youtube, Workflow, ChevronRight } from 'lucide-react';

export default function YouTubeAnimationPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm">
            <a href="/dashboard" className="text-gray-500 hover:text-gray-700">
              Dashboard
            </a>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <a href="/workflows" className="text-gray-500 hover:text-gray-700">
              Workflows
            </a>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-gray-900 font-medium">YouTube Animation</span>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="builder" className="h-full">
          <TabsList className="w-full justify-start rounded-none border-b">
            <TabsTrigger value="builder">
              <Youtube className="h-4 w-4 mr-2" />
              YouTube Builder
            </TabsTrigger>
            <TabsTrigger value="canvas">
              <Workflow className="h-4 w-4 mr-2" />
              Workflow Canvas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="h-full">
            <YouTubeAnimationBuilder />
          </TabsContent>

          <TabsContent value="canvas" className="h-full p-0">
            <WorkflowCanvas />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}