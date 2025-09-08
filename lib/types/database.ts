// Database type definitions for n8n AI Flow

export type WorkflowStatus = 'draft' | 'active' | 'inactive' | 'archived';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
export type NodeType = 'webhook' | 'http_request' | 'transform' | 'aggregate' | 'form' | 'ai_agent' | 'database' | 'email' | 'conditional';
export type AgentType = 'workflow' | 'data' | 'api' | 'ui' | 'test' | 'monitor';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error';
export type TriggerType = 'manual' | 'webhook' | 'schedule' | 'api';
export type AuthType = 'none' | 'basic' | 'bearer' | 'api_key';
export type VariableType = 'string' | 'number' | 'boolean' | 'json';

// User Profile
export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  organization?: string;
  api_key?: string;
  created_at: string;
  updated_at: string;
}

// Workflow Template
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  config: Record<string, any>;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Main Workflow
export interface Workflow {
  id: string;
  user_id: string;
  template_id?: string;
  name: string;
  description?: string;
  status: WorkflowStatus;
  config: Record<string, any>;
  settings?: Record<string, any>;
  tags?: string[];
  is_scheduled: boolean;
  cron_expression?: string;
  last_run_at?: string;
  next_run_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

// Node Position
export interface NodePosition {
  x: number;
  y: number;
}

// Workflow Node
export interface WorkflowNode {
  id: string;
  workflow_id: string;
  node_id: string; // Internal identifier
  type: NodeType;
  name: string;
  position: NodePosition;
  config: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// Node Connection/Edge
export interface NodeConnection {
  id: string;
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  config?: Record<string, any>;
  created_at: string;
}

// Workflow Execution
export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  user_id: string;
  status: ExecutionStatus;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  trigger_type?: TriggerType;
  trigger_data?: Record<string, any>;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_message?: string;
  error_details?: Record<string, any>;
  retry_count: number;
  max_retries: number;
  created_at: string;
}

// Execution Log Entry
export interface ExecutionLog {
  id: string;
  execution_id: string;
  node_id?: string;
  level: LogLevel;
  message?: string;
  data?: Record<string, any>;
  timestamp: string;
}

// AI Agent
export interface AIAgent {
  id: string;
  workflow_id?: string;
  name: string;
  type: AgentType;
  status: string;
  config: Record<string, any>;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  created_at: string;
  updated_at: string;
}

// Agent Task
export interface AgentTask {
  id: string;
  agent_id: string;
  execution_id?: string;
  priority: number;
  type: string;
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  status: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

// Workflow Variable
export interface WorkflowVariable {
  id: string;
  workflow_id: string;
  key: string;
  value?: string;
  type: VariableType;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

// Webhook Configuration
export interface Webhook {
  id: string;
  workflow_id: string;
  node_id?: string;
  endpoint_id: string;
  path: string;
  method: string;
  is_active: boolean;
  auth_type?: AuthType;
  auth_config?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// API Credential
export interface Credential {
  id: string;
  user_id: string;
  name: string;
  type: string; // 'openai', 'slack', 'github', etc.
  config: Record<string, any>; // Encrypted
  is_valid: boolean;
  last_used_at?: string;
  created_at: string;
  updated_at: string;
}

// Database response types
export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Query filter types
export interface WorkflowFilter {
  status?: WorkflowStatus;
  tags?: string[];
  search?: string;
  userId?: string;
}

export interface ExecutionFilter {
  workflowId?: string;
  status?: ExecutionStatus;
  startDate?: string;
  endDate?: string;
}

// Create/Update DTOs
export interface CreateWorkflowDTO {
  name: string;
  description?: string;
  template_id?: string;
  config?: Record<string, any>;
  tags?: string[];
}

export interface UpdateWorkflowDTO {
  name?: string;
  description?: string;
  status?: WorkflowStatus;
  config?: Record<string, any>;
  settings?: Record<string, any>;
  tags?: string[];
  is_scheduled?: boolean;
  cron_expression?: string;
}

export interface CreateNodeDTO {
  workflow_id: string;
  node_id: string;
  type: NodeType;
  name: string;
  position: NodePosition;
  config?: Record<string, any>;
}

export interface UpdateNodeDTO {
  name?: string;
  position?: NodePosition;
  config?: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CreateConnectionDTO {
  workflow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle?: string;
  target_handle?: string;
  config?: Record<string, any>;
}

export interface CreateExecutionDTO {
  workflow_id: string;
  trigger_type?: TriggerType;
  trigger_data?: Record<string, any>;
  input_data?: Record<string, any>;
}

// React Flow compatible types
export interface FlowNode {
  id: string;
  type: string;
  position: NodePosition;
  data: {
    label: string;
    config?: Record<string, any>;
    inputs?: Record<string, any>;
    outputs?: Record<string, any>;
  };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

// Utility types for type safety
export type WorkflowWithNodes = Workflow & {
  nodes?: WorkflowNode[];
  connections?: NodeConnection[];
};

export type ExecutionWithLogs = WorkflowExecution & {
  logs?: ExecutionLog[];
};

export type WorkflowWithExecutions = Workflow & {
  executions?: WorkflowExecution[];
  lastExecution?: WorkflowExecution;
};