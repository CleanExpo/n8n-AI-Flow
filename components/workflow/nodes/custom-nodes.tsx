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

// Generic Custom Node for dynamic types
export const CustomNode: React.FC<NodeProps<BaseNodeData>> = (props) => {
  // Determine icon based on node type
  const getIcon = () => {
    const type = props.data.type?.toLowerCase() || '';
    if (type.includes('gmail')) return '📧';
    if (type.includes('slack')) return '💬';
    if (type.includes('webhook')) return '🌐';
    if (type.includes('http')) return '📡';
    if (type.includes('database')) return '💾';
    if (type.includes('email')) return '✉️';
    if (type.includes('transform')) return '🔄';
    if (type.includes('ai')) return '🤖';
    return props.data.icon || '⚡';
  };

  const getColor = () => {
    const type = props.data.type?.toLowerCase() || '';
    if (type.includes('gmail')) return '#ea4335';
    if (type.includes('slack')) return '#4a154b';
    if (type.includes('webhook')) return '#8b5cf6';
    if (type.includes('http')) return '#3b82f6';
    if (type.includes('database')) return '#06b6d4';
    if (type.includes('email')) return '#ec4899';
    if (type.includes('transform')) return '#10b981';
    if (type.includes('ai')) return '#f59e0b';
    return '#6b7280';
  };

  // Determine inputs/outputs based on node type
  const getInputs = () => {
    const type = props.data.type?.toLowerCase() || '';
    // Triggers have no inputs
    if (type.includes('trigger') || type.includes('gmail') || type.includes('webhook')) {
      return 0;
    }
    return props.data.inputs !== undefined ? props.data.inputs : 1;
  };

  const getOutputs = () => {
    return props.data.outputs !== undefined ? props.data.outputs : 1;
  };

  return (
    <BaseNode
      {...props}
      data={{
        ...props.data,
        icon: getIcon(),
        color: getColor(),
        outputs: getOutputs(),
        inputs: getInputs(),
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
  custom: CustomNode, // Add the custom node type
};