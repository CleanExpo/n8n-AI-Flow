'use client';

import React from 'react';
import { NodeType } from '@/lib/types/database';

interface NodeTemplate {
  type: NodeType;
  label: string;
  icon: string;
  description: string;
  category: string;
}

const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    type: 'webhook',
    label: 'Webhook',
    icon: '🌐',
    description: 'Trigger workflow via HTTP webhook',
    category: 'Triggers',
  },
  {
    type: 'form',
    label: 'Form',
    icon: '📝',
    description: 'Start workflow with form input',
    category: 'Triggers',
  },
  
  // Actions
  {
    type: 'http_request',
    label: 'HTTP Request',
    icon: '📡',
    description: 'Make HTTP API calls',
    category: 'Actions',
  },
  {
    type: 'database',
    label: 'Database',
    icon: '💾',
    description: 'Query or update database',
    category: 'Actions',
  },
  {
    type: 'email',
    label: 'Email',
    icon: '✉️',
    description: 'Send email notifications',
    category: 'Actions',
  },
  
  // Data Processing
  {
    type: 'transform',
    label: 'Transform',
    icon: '🔄',
    description: 'Transform and map data',
    category: 'Data',
  },
  {
    type: 'aggregate',
    label: 'Aggregate',
    icon: '📊',
    description: 'Aggregate and summarize data',
    category: 'Data',
  },
  
  // Logic
  {
    type: 'conditional',
    label: 'Conditional',
    icon: '🔀',
    description: 'Branch based on conditions',
    category: 'Logic',
  },
  {
    type: 'ai_agent',
    label: 'AI Agent',
    icon: '🤖',
    description: 'Process with AI',
    category: 'Logic',
  },
];

export const WorkflowToolbar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Group nodes by category
  const groupedNodes = nodeTemplates.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeTemplate[]>);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-4xl">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Drag nodes to canvas</h3>
      
      <div className="space-y-4">
        {Object.entries(groupedNodes).map(([category, nodes]) => (
          <div key={category}>
            <h4 className="text-xs font-medium text-gray-500 mb-2">{category}</h4>
            <div className="flex flex-wrap gap-2">
              {nodes.map((node) => (
                <div
                  key={node.type}
                  className="group relative"
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                >
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-move transition-all hover:shadow-md border border-gray-200 hover:border-gray-300">
                    <span className="text-lg">{node.icon}</span>
                    <span className="text-sm font-medium text-gray-700">
                      {node.label}
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      {node.description}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <span className="font-medium">Tip:</span> Drag nodes to the canvas, then connect them by dragging from output to input handles.
        </p>
      </div>
    </div>
  );
};