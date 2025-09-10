'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  icon?: string;
  description?: string;
  config?: Record<string, any>;
  inputs?: number;
  outputs?: number;
  color?: string;
}

export const BaseNode: React.FC<NodeProps> = ({ data, selected }) => {
  const nodeData = data as BaseNodeData;
  const nodeColor = nodeData.color || '#6366f1';
  const inputCount = nodeData.inputs || 1;
  const outputCount = nodeData.outputs || 1;

  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg border-2 transition-all ${
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-200'
      }`}
      style={{ minWidth: '200px' }}
    >
      {/* Input Handles */}
      {Array.from({ length: inputCount }).map((_, index) => (
        <Handle
          key={`input-${index}`}
          type="target"
          position={Position.Left}
          id={`input-${index}`}
          style={{
            top: `${((index + 1) * 100) / (inputCount + 1)}%`,
            background: '#6366f1',
            width: '12px',
            height: '12px',
            border: '2px solid white',
          }}
        />
      ))}

      {/* Node Header */}
      <div
        className="px-4 py-2 rounded-t-lg text-white font-semibold flex items-center gap-2"
        style={{ backgroundColor: nodeColor }}
      >
        {nodeData.icon && <span className="text-lg">{nodeData.icon}</span>}
        <span className="text-sm">{nodeData.label}</span>
      </div>

      {/* Node Content */}
      <div className="px-4 py-3">
        {nodeData.description && (
          <p className="text-xs text-gray-600 mb-2">{nodeData.description}</p>
        )}
        {nodeData.config && Object.keys(nodeData.config).length > 0 && (
          <div className="text-xs bg-gray-50 rounded p-2 mt-2">
            <div className="font-semibold mb-1">Configuration:</div>
            {Object.entries(nodeData.config).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-600">{key}:</span>
                <span className="text-gray-800 font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Output Handles */}
      {Array.from({ length: outputCount }).map((_, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          style={{
            top: `${((index + 1) * 100) / (outputCount + 1)}%`,
            background: '#10b981',
            width: '12px',
            height: '12px',
            border: '2px solid white',
          }}
        />
      ))}

      {/* Status Indicator */}
      {selected && (
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
  );
};