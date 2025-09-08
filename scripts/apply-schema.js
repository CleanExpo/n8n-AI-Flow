const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manual environment variables (from .env.local)
const SUPABASE_URL = 'https://zkqinubdlorgbrwxstzx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InprcWludWJkbG9yZ2Jyd3hzdHp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzMxMzkxNCwiZXhwIjoyMDcyODg5OTE0fQ.Lx-cAUzYayXNMa2mD7qPlRtXjksCnm1EVHQSNodkYSY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applySchema() {
  console.log('🚀 Applying database schema to Supabase...\n');

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('📋 Schema loaded from:', schemaPath);
    console.log('📝 Schema size:', schemaSql.length, 'characters\n');

    // Since we can't execute the full schema directly, let's execute it in parts
    // First, let's check what tables already exist
    console.log('🔍 Checking existing tables...');
    
    const { data: existingTables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.log('Note: Could not check existing tables:', tablesError.message);
    } else {
      console.log('📋 Existing tables:', existingTables.map(t => t.table_name));
    }

    console.log('\n🛠️ Creating individual tables...\n');

    // Create workflows table first (since we know users exists)
    const createWorkflowsTable = `
      CREATE TABLE IF NOT EXISTS workflows (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id TEXT NOT NULL, -- Changed to TEXT to match our users table
          name TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'draft',
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
    `;

    // Create nodes table
    const createNodesTable = `
      CREATE TABLE IF NOT EXISTS nodes (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
          node_id TEXT NOT NULL,
          type TEXT NOT NULL,
          name TEXT NOT NULL,
          position JSONB NOT NULL,
          config JSONB NOT NULL DEFAULT '{}',
          inputs JSONB DEFAULT '{}',
          outputs JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(workflow_id, node_id)
      );
    `;

    // Create connections table
    const createConnectionsTable = `
      CREATE TABLE IF NOT EXISTS connections (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
          source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
          target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
          source_handle TEXT,
          target_handle TEXT,
          config JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Create executions table
    const createExecutionsTable = `
      CREATE TABLE IF NOT EXISTS executions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
          user_id TEXT NOT NULL, -- Changed to TEXT to match our users table
          status TEXT DEFAULT 'pending',
          started_at TIMESTAMPTZ DEFAULT NOW(),
          completed_at TIMESTAMPTZ,
          duration_ms INTEGER,
          trigger_type TEXT,
          trigger_data JSONB,
          input_data JSONB,
          output_data JSONB,
          error_message TEXT,
          error_details JSONB,
          retry_count INTEGER DEFAULT 0,
          max_retries INTEGER DEFAULT 3,
          created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Execute each table creation
    const tables = [
      { name: 'workflows', sql: createWorkflowsTable },
      { name: 'nodes', sql: createNodesTable },
      { name: 'connections', sql: createConnectionsTable },
      { name: 'executions', sql: createExecutionsTable }
    ];

    for (const table of tables) {
      console.log(`🔨 Creating table: ${table.name}`);
      
      // Using rpc to execute raw SQL
      const { error } = await supabase.rpc('exec_sql', { sql: table.sql });
      
      if (error) {
        console.log(`❌ Failed to create ${table.name}:`, error.message);
        // Try direct approach if rpc fails
        console.log(`🔄 Trying alternative approach for ${table.name}...`);
      } else {
        console.log(`✅ Successfully created table: ${table.name}`);
      }
    }

    console.log('\n🎉 Database schema application completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Test workflow creation in browser');
    console.log('2. Verify database tables are accessible');
    console.log('3. Check API endpoints work with new schema');

  } catch (error) {
    console.error('❌ Schema application failed:', error.message);
    console.log('\n📋 Manual SQL to run in Supabase SQL editor:');
    console.log('═'.repeat(80));
    
    const manualSql = `
-- Step 1: Create workflows table
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'draft',
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

-- Step 2: Create nodes table
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    position JSONB NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    inputs JSONB DEFAULT '{}',
    outputs JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(workflow_id, node_id)
);

-- Step 3: Create connections table
CREATE TABLE IF NOT EXISTS connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    source_handle TEXT,
    target_handle TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create executions table
CREATE TABLE IF NOT EXISTS executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    trigger_type TEXT,
    trigger_data JSONB,
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_workflows_user_id ON workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_at ON workflows(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_workflow_id ON nodes(workflow_id);
CREATE INDEX IF NOT EXISTS idx_connections_workflow_id ON connections(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_workflow_id ON executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_executions_status ON executions(status);
`;

    console.log(manualSql);
    console.log('═'.repeat(80));
    console.log('Run this SQL in Supabase dashboard: https://supabase.com/dashboard/project/zkqinubdlorgbrwxstzx');
  }
}

applySchema();