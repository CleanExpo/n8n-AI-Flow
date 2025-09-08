'use client';

import React, { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import toast from 'react-hot-toast';

interface NodeConfigPanelProps {
  node: Node;
  onClose: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({ node, onClose }) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const [config, setConfig] = useState<Record<string, any>>(node.data?.config || {});
  const [nodeName, setNodeName] = useState(node.data?.label || '');

  // Node-specific configuration fields
  const getConfigFields = () => {
    switch (node.type) {
      case 'webhook':
        return [
          { key: 'path', label: 'Webhook Path', type: 'text', placeholder: '/webhook/my-endpoint' },
          { key: 'method', label: 'HTTP Method', type: 'select', options: ['POST', 'GET', 'PUT', 'DELETE'] },
          { key: 'auth', label: 'Authentication', type: 'select', options: ['None', 'Basic', 'Bearer Token'] },
        ];
      
      case 'http_request':
        return [
          { key: 'url', label: 'URL', type: 'text', placeholder: 'https://api.example.com/endpoint' },
          { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
          { key: 'headers', label: 'Headers (JSON)', type: 'textarea', placeholder: '{"Content-Type": "application/json"}' },
          { key: 'body', label: 'Body (JSON)', type: 'textarea', placeholder: '{"key": "value"}' },
        ];
      
      case 'transform':
        return [
          { key: 'expression', label: 'JavaScript Expression', type: 'textarea', placeholder: 'return data.map(item => ({ ...item, processed: true }))' },
          { key: 'outputFormat', label: 'Output Format', type: 'select', options: ['JSON', 'CSV', 'XML', 'Plain Text'] },
        ];
      
      case 'ai_agent':
        return [
          { key: 'model', label: 'AI Model', type: 'select', options: ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'llama-2'] },
          { key: 'prompt', label: 'System Prompt', type: 'textarea', placeholder: 'You are a helpful assistant...' },
          { key: 'temperature', label: 'Temperature', type: 'number', min: 0, max: 2, step: 0.1 },
          { key: 'maxTokens', label: 'Max Tokens', type: 'number', min: 1, max: 4000 },
        ];
      
      case 'database':
        return [
          { key: 'operation', label: 'Operation', type: 'select', options: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'] },
          { key: 'table', label: 'Table Name', type: 'text', placeholder: 'users' },
          { key: 'query', label: 'SQL Query', type: 'textarea', placeholder: 'SELECT * FROM users WHERE active = true' },
        ];
      
      case 'email':
        return [
          { key: 'to', label: 'To', type: 'text', placeholder: 'recipient@example.com' },
          { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Email Subject' },
          { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Email content...' },
          { key: 'isHtml', label: 'HTML Email', type: 'checkbox' },
        ];
      
      case 'conditional':
        return [
          { key: 'condition', label: 'Condition (JavaScript)', type: 'textarea', placeholder: 'return data.value > 100' },
          { key: 'trueLabel', label: 'True Branch Label', type: 'text', placeholder: 'Condition Met' },
          { key: 'falseLabel', label: 'False Branch Label', type: 'text', placeholder: 'Condition Not Met' },
        ];
      
      case 'aggregate':
        return [
          { key: 'operation', label: 'Operation', type: 'select', options: ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX', 'GROUP_BY'] },
          { key: 'field', label: 'Field', type: 'text', placeholder: 'amount' },
          { key: 'groupBy', label: 'Group By', type: 'text', placeholder: 'category' },
        ];
      
      case 'form':
        return [
          { key: 'fields', label: 'Form Fields (JSON)', type: 'textarea', placeholder: '[{"name": "email", "type": "email", "required": true}]' },
          { key: 'submitLabel', label: 'Submit Button Label', type: 'text', placeholder: 'Submit' },
        ];
      
      default:
        return [];
    }
  };

  const handleSave = () => {
    updateNode(node.id, {
      data: {
        ...node.data,
        label: nodeName,
        config,
      },
    });
    toast.success('Node configuration saved');
    onClose();
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const fields = getConfigFields();

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Configure Node</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Name
          </label>
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {fields.length > 0 ? (
          fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              
              {field.type === 'text' && (
                <input
                  type="text"
                  value={config[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              {field.type === 'number' && (
                <input
                  type="number"
                  value={config[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, parseFloat(e.target.value))}
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              {field.type === 'textarea' && (
                <textarea
                  value={config[field.key] || ''}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              
              {field.type === 'select' && (
                <select
                  value={config[field.key] || field.options?.[0]}
                  onChange={(e) => handleConfigChange(field.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {field.options?.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}
              
              {field.type === 'checkbox' && (
                <input
                  type="checkbox"
                  checked={config[field.key] || false}
                  onChange={(e) => handleConfigChange(field.key, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-sm">No configuration options available for this node type.</p>
        )}
      </div>

      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Save Configuration
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};