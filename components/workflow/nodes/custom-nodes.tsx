'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import { BaseNode, BaseNodeData } from './BaseNode';

// Webhook Node
export const WebhookNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '🌐',
        color: '#8b5cf6',
        outputs: 1,
        inputs: 0,
      }}
    />
  );
};

// HTTP Request Node
export const HttpRequestNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '📡',
        color: '#3b82f6',
        outputs: 1,
        inputs: 1,
      }}
    />
  );
};

// Transform Data Node
export const TransformNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '🔄',
        color: '#10b981',
        outputs: 1,
        inputs: 1,
      }}
    />
  );
};

// AI Agent Node
export const AIAgentNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '🤖',
        color: '#f59e0b',
        outputs: 1,
        inputs: 1,
      }}
    />
  );
};

// Database Node
export const DatabaseNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '💾',
        color: '#06b6d4',
        outputs: 1,
        inputs: 1,
      }}
    />
  );
};

// Email Node
export const EmailNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '✉️',
        color: '#ec4899',
        outputs: 1,
        inputs: 1,
      }}
    />
  );
};

// Conditional Node
export const ConditionalNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '🔀',
        color: '#f97316',
        outputs: 2, // True and False branches
        inputs: 1,
      }}
    />
  );
};

// Aggregate Node
export const AggregateNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '📊',
        color: '#84cc16',
        outputs: 1,
        inputs: 1,
      }}
    />
  );
};

// Form Node
export const FormNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: '📝',
        color: '#a855f7',
        outputs: 1,
        inputs: 0,
      }}
    />
  );
};

// Export all node types
export const nodeTypes = {
  webhook: WebhookNode,
  http_request: HttpRequestNode,
  transform: TransformNode,
  ai_agent: AIAgentNode,
  database: DatabaseNode,
  email: EmailNode,
  conditional: ConditionalNode,
  aggregate: AggregateNode,
  form: FormNode,
};