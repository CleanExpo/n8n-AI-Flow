-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'inactive', 'archived');
CREATE TYPE execution_status AS ENUM ('pending', 'running', 'success', 'failed', 'cancelled');
CREATE TYPE node_type AS ENUM ('webhook', 'http_request', 'transform', 'aggregate', 'form', 'ai_agent', 'database', 'email', 'conditional');
CREATE TYPE agent_type AS ENUM ('workflow', 'data', 'api', 'ui', 'test', 'monitor');

-- Users profile extension (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    organization TEXT,
    api_key UUID DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow templates for reusable workflows
CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon TEXT,
    config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Main workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workflow_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    status workflow_status DEFAULT 'draft',
    config JSONB NOT NULL DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_scheduled BOOLEAN DEFAULT false,
    cron_expression TEXT,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow nodes
CREATE TABLE nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL, -- Internal node identifier
    type node_type NOT NULL,
    name TEXT NOT NULL,
    position JSONB NOT NULL, -- {x: number, y: number}
    config JSONB NOT NULL DEFAULT '{}',
    inputs JSONB DEFAULT '{}',
    outputs JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workflow_id, node_id)
);

-- Node connections/edges
CREATE TABLE connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    source_handle TEXT,
    target_handle TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow executions
CREATE TABLE executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status execution_status DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    trigger_type TEXT, -- 'manual', 'webhook', 'schedule', 'api'
    trigger_data JSONB,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Execution logs for detailed tracking
CREATE TABLE execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES executions(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE SET NULL,
    level TEXT CHECK (level IN ('debug', 'info', 'warning', 'error')),
    message TEXT,
    data JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents table
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type agent_type NOT NULL,
    status TEXT DEFAULT 'idle',
    config JSONB NOT NULL DEFAULT '{}',
    model TEXT DEFAULT 'gpt-4',
    temperature FLOAT DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    system_prompt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent tasks queue
CREATE TABLE agent_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES executions(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0,
    type TEXT NOT NULL,
    input_data JSONB,
    output_data JSONB,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Workflow variables for dynamic values
CREATE TABLE workflow_variables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT,
    type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    is_secret BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workflow_id, key)
);

-- Webhook endpoints
CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
    endpoint_id TEXT UNIQUE DEFAULT uuid_generate_v4()::TEXT,
    path TEXT NOT NULL,
    method TEXT DEFAULT 'POST',
    is_active BOOLEAN DEFAULT true,
    auth_type TEXT, -- 'none', 'basic', 'bearer', 'api_key'
    auth_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API integrations/credentials
CREATE TABLE credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'openai', 'slack', 'github', etc.
    config JSONB NOT NULL, -- Encrypted credentials
    is_valid BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Create indexes for better query performance
CREATE INDEX idx_workflows_user_id ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX idx_nodes_workflow_id ON nodes(workflow_id);
CREATE INDEX idx_connections_workflow_id ON connections(workflow_id);
CREATE INDEX idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX idx_executions_status ON executions(status);
CREATE INDEX idx_executions_started_at ON executions(started_at DESC);
CREATE INDEX idx_execution_logs_execution_id ON execution_logs(execution_id);
CREATE INDEX idx_ai_agents_workflow_id ON ai_agents(workflow_id);
CREATE INDEX idx_agent_tasks_agent_id ON agent_tasks(agent_id);
CREATE INDEX idx_webhooks_endpoint_id ON webhooks(endpoint_id);
CREATE INDEX idx_credentials_user_id ON credentials(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Workflows policies
CREATE POLICY "Users can view own workflows" ON workflows
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create workflows" ON workflows
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflows" ON workflows
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workflows" ON workflows
    FOR DELETE USING (auth.uid() = user_id);

-- Nodes policies
CREATE POLICY "Users can view nodes of own workflows" ON nodes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = nodes.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );
CREATE POLICY "Users can manage nodes of own workflows" ON nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = nodes.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );

-- Similar policies for other tables
CREATE POLICY "Users can view own connections" ON connections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workflows 
            WHERE workflows.id = connections.workflow_id 
            AND workflows.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own executions" ON executions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credentials" ON credentials
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own credentials" ON credentials
    FOR ALL USING (auth.uid() = user_id);

-- Public templates policy
CREATE POLICY "Anyone can view public templates" ON workflow_templates
    FOR SELECT USING (is_public = true);
CREATE POLICY "Users can view own templates" ON workflow_templates
    FOR SELECT USING (auth.uid() = created_by);
CREATE POLICY "Users can create templates" ON workflow_templates
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Functions for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_variables_updated_at BEFORE UPDATE ON workflow_variables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credentials_updated_at BEFORE UPDATE ON credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workflow_templates_updated_at BEFORE UPDATE ON workflow_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate execution duration
CREATE OR REPLACE FUNCTION calculate_execution_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) * 1000;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_duration BEFORE UPDATE ON executions
    FOR EACH ROW EXECUTE FUNCTION calculate_execution_duration();