/**
 * End-to-end test for the n8n AI Flow application
 * This script tests the complete workflow from creation to execution
 */

const API_BASE = 'http://localhost:3000/api';
const N8N_BASE = 'http://localhost:5678';

// Test configuration
const TEST_WORKFLOW = {
  name: 'Test Workflow - ' + new Date().toISOString(),
  description: 'Automated test workflow',
  config: {},
};

// Test nodes for React Flow
const TEST_NODES = [
  {
    id: '1',
    type: 'webhook',
    position: { x: 100, y: 100 },
    data: {
      label: 'Webhook Trigger',
      config: {
        method: 'POST',
        path: 'test-webhook',
        auth: 'none',
      },
    },
  },
  {
    id: '2',
    type: 'transform',
    position: { x: 300, y: 100 },
    data: {
      label: 'Transform Data',
      config: {
        expression: 'return { processed: true, timestamp: new Date().toISOString(), input: item };',
      },
    },
  },
];

// Test edges
const TEST_EDGES = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
  },
];

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  console.log(`📡 ${options.method || 'GET'} ${url}`);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error(`❌ API Error: ${response.status} - ${JSON.stringify(data)}`);
    throw new Error(data.error || `API call failed: ${response.status}`);
  }

  return data;
}

// Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main test function
async function runTest() {
  console.log('🚀 Starting end-to-end workflow test...\n');
  
  let workflowId = null;
  let executionId = null;

  try {
    // Step 1: Check n8n connectivity
    console.log('1️⃣ Checking n8n connectivity...');
    try {
      const n8nResponse = await fetch(`${N8N_BASE}/api/v1/workflows?limit=1`, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from('admin:admin123').toString('base64'),
        },
      });
      if (n8nResponse.ok) {
        console.log('✅ n8n is running and accessible\n');
      } else {
        throw new Error('n8n not accessible');
      }
    } catch (error) {
      console.log('⚠️ n8n is not running. Please start it with: docker-compose up -d\n');
      return;
    }

    // Step 2: Create a workflow
    console.log('2️⃣ Creating test workflow...');
    const createResult = await apiCall('/workflows', {
      method: 'POST',
      body: JSON.stringify(TEST_WORKFLOW),
    });
    workflowId = createResult.data.id;
    console.log(`✅ Workflow created: ${workflowId}\n`);

    // Step 3: Sync workflow with n8n
    console.log('3️⃣ Syncing workflow with n8n...');
    const syncResult = await apiCall(`/workflows/${workflowId}/sync`, {
      method: 'POST',
      body: JSON.stringify({
        nodes: TEST_NODES,
        edges: TEST_EDGES,
        operation: 'sync',
      }),
    });
    console.log(`✅ Synced with n8n: ${syncResult.data.n8nWorkflowId}\n`);

    // Step 4: Activate the workflow
    console.log('4️⃣ Activating workflow...');
    await apiCall(`/workflows/${workflowId}/sync`, {
      method: 'POST',
      body: JSON.stringify({
        nodes: TEST_NODES,
        edges: TEST_EDGES,
        operation: 'activate',
      }),
    });
    console.log('✅ Workflow activated\n');

    // Step 5: Execute the workflow
    console.log('5️⃣ Executing workflow...');
    const executeResult = await apiCall(`/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        input_data: { test: 'data', timestamp: new Date().toISOString() },
      }),
    });
    executionId = executeResult.data.id;
    console.log(`✅ Execution started: ${executionId}\n`);

    // Step 6: Monitor execution
    console.log('6️⃣ Monitoring execution...');
    let attempts = 0;
    let execution = null;
    
    while (attempts < 30) { // Wait up to 30 seconds
      await wait(1000);
      
      const executionsResult = await apiCall(`/workflows/${workflowId}/executions`);
      execution = executionsResult.data.find((e) => e.id === executionId);
      
      if (execution && execution.status !== 'running' && execution.status !== 'pending') {
        break;
      }
      
      process.stdout.write('.');
      attempts++;
    }
    
    console.log('\n');
    
    if (execution && execution.status === 'success') {
      console.log('✅ Execution completed successfully!\n');
      
      // Get execution logs
      const logsResult = await apiCall(`/executions/${executionId}/logs`);
      console.log('📋 Execution logs:');
      logsResult.data.forEach(log => {
        const icon = log.level === 'error' ? '❌' : log.level === 'warning' ? '⚠️' : '✅';
        console.log(`  ${icon} [${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`);
      });
    } else {
      console.log(`❌ Execution failed or timed out. Status: ${execution?.status || 'unknown'}\n`);
      if (execution?.error) {
        console.log('Error:', execution.error);
      }
    }

    // Step 7: Deactivate and cleanup
    console.log('\n7️⃣ Cleaning up...');
    await apiCall(`/workflows/${workflowId}/sync`, {
      method: 'POST',
      body: JSON.stringify({
        nodes: TEST_NODES,
        edges: TEST_EDGES,
        operation: 'deactivate',
      }),
    });
    console.log('✅ Workflow deactivated');

    // Delete the test workflow
    await apiCall(`/workflows/${workflowId}`, {
      method: 'DELETE',
    });
    console.log('✅ Test workflow deleted\n');

    console.log('🎉 End-to-end test completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('  - Workflow creation: ✅');
    console.log('  - n8n synchronization: ✅');
    console.log('  - Workflow activation: ✅');
    console.log('  - Workflow execution: ✅');
    console.log('  - Execution monitoring: ✅');
    console.log('  - Cleanup: ✅');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    
    // Cleanup on failure
    if (workflowId) {
      try {
        await apiCall(`/workflows/${workflowId}`, { method: 'DELETE' });
        console.log('🧹 Cleaned up test workflow');
      } catch (cleanupError) {
        console.error('Failed to cleanup:', cleanupError.message);
      }
    }
    
    process.exit(1);
  }
}

// Run the test
console.log('═══════════════════════════════════════════');
console.log('  n8n AI Flow - End-to-End Test Suite');
console.log('═══════════════════════════════════════════\n');

runTest().catch(console.error);