import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Content extraction for different file types
async function extractContent(file: File): Promise<{
  type: string;
  content: string;
  metadata: any;
  workflowHints: any[];
}> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;
  const extension = fileName.split('.').pop() || '';

  let content = '';
  let metadata = {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    extension: extension,
    lastModified: new Date(file.lastModified)
  };
  let workflowHints: any[] = [];

  try {
    // Read file content
    const text = await file.text();
    content = text;

    // Process based on file type
    if (extension === 'json') {
      try {
        const jsonData = JSON.parse(text);
        
        // Check for API endpoints
        if (jsonData.endpoints || jsonData.api || jsonData.routes) {
          workflowHints.push({
            type: 'api',
            data: jsonData.endpoints || jsonData.api || jsonData.routes,
            suggestion: 'Create HTTP request nodes for these endpoints'
          });
        }

        // Check for database configuration
        if (jsonData.database || jsonData.db || jsonData.connection) {
          workflowHints.push({
            type: 'database',
            data: jsonData.database || jsonData.db || jsonData.connection,
            suggestion: 'Add database nodes for data operations'
          });
        }

        // Check for webhook configuration
        if (jsonData.webhooks || jsonData.webhook) {
          workflowHints.push({
            type: 'webhook',
            data: jsonData.webhooks || jsonData.webhook,
            suggestion: 'Create webhook triggers for these events'
          });
        }

        metadata.structure = Object.keys(jsonData);
        metadata.isConfig = true;
      } catch (e) {
        // Not valid JSON
      }
    }

    if (extension === 'csv' || fileType === 'text/csv') {
      const lines = text.split('\n');
      const headers = lines[0]?.split(',').map(h => h.trim());
      
      workflowHints.push({
        type: 'spreadsheet',
        data: { headers, rowCount: lines.length - 1 },
        suggestion: 'Process CSV data with spreadsheet nodes'
      });

      metadata.headers = headers;
      metadata.rowCount = lines.length - 1;
    }

    if (['js', 'ts', 'jsx', 'tsx', 'py', 'java'].includes(extension)) {
      // Look for function definitions
      const functions = text.match(/function\s+(\w+)|const\s+(\w+)\s*=\s*\(|def\s+(\w+)/g) || [];
      
      // Look for API routes
      const apiRoutes = text.match(/(get|post|put|delete|patch)\s*\(\s*['"`](\/[^'"`]*)/gi) || [];
      
      // Look for database queries
      const dbQueries = text.match(/(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s+/gi) || [];
      
      if (functions.length > 0) {
        workflowHints.push({
          type: 'code',
          data: { functions: functions.map(f => f.replace(/function\s+|const\s+|def\s+|=\s*\(/g, '').trim()) },
          suggestion: 'Create function nodes for code execution'
        });
      }

      if (apiRoutes.length > 0) {
        workflowHints.push({
          type: 'api',
          data: { routes: apiRoutes },
          suggestion: 'Add HTTP request nodes for API calls'
        });
      }

      if (dbQueries.length > 0) {
        workflowHints.push({
          type: 'database',
          data: { queries: dbQueries },
          suggestion: 'Add database nodes for SQL operations'
        });
      }

      metadata.language = extension;
      metadata.functionCount = functions.length;
      metadata.apiRouteCount = apiRoutes.length;
    }

    if (['md', 'txt', 'doc', 'docx'].includes(extension)) {
      // Look for workflow patterns in text
      const patterns = {
        triggers: text.match(/when\s+|trigger\s+|on\s+|start\s+when/gi) || [],
        actions: text.match(/then\s+|do\s+|execute\s+|perform\s+|send\s+|create\s+|update\s+|delete/gi) || [],
        conditions: text.match(/if\s+|when\s+|unless\s+|while\s+|until/gi) || [],
        data: text.match(/data\s+|input\s+|output\s+|parameter\s+|variable/gi) || []
      };

      if (patterns.triggers.length > 0) {
        workflowHints.push({
          type: 'trigger',
          data: patterns.triggers,
          suggestion: 'Add trigger nodes based on document patterns'
        });
      }

      if (patterns.actions.length > 0) {
        workflowHints.push({
          type: 'action',
          data: patterns.actions,
          suggestion: 'Create action nodes for automated tasks'
        });
      }

      metadata.wordCount = text.split(/\s+/).length;
      metadata.patterns = patterns;
    }

    // Look for email patterns
    const emailPatterns = text.match(/[\w.-]+@[\w.-]+\.\w+/g) || [];
    if (emailPatterns.length > 0) {
      workflowHints.push({
        type: 'email',
        data: { emails: [...new Set(emailPatterns)] },
        suggestion: 'Add email nodes for communication'
      });
    }

    // Look for URLs
    const urlPatterns = text.match(/https?:\/\/[^\s]+/g) || [];
    if (urlPatterns.length > 0) {
      workflowHints.push({
        type: 'webhook',
        data: { urls: [...new Set(urlPatterns)] },
        suggestion: 'Create webhook or HTTP request nodes'
      });
    }

    // Look for scheduling patterns
    const schedulePatterns = text.match(/daily|weekly|monthly|hourly|every\s+\d+|cron|schedule/gi) || [];
    if (schedulePatterns.length > 0) {
      workflowHints.push({
        type: 'schedule',
        data: schedulePatterns,
        suggestion: 'Add schedule trigger for automated execution'
      });
    }

  } catch (error) {
    console.error('Content extraction error:', error);
    content = 'Unable to extract content from this file';
  }

  return {
    type: extension,
    content: content.substring(0, 10000), // Limit content size
    metadata,
    workflowHints
  };
}

// Generate workflow nodes based on extracted content
function generateWorkflowSuggestions(extractedData: any) {
  const suggestions = [];
  const nodes = [];

  for (const hint of extractedData.workflowHints) {
    switch (hint.type) {
      case 'api':
        nodes.push({
          type: 'n8n-nodes-base.httpRequest',
          name: 'HTTP Request',
          parameters: {
            method: 'GET',
            url: hint.data.routes?.[0] || hint.data.endpoints?.[0] || ''
          }
        });
        break;
      
      case 'database':
        nodes.push({
          type: 'n8n-nodes-base.postgres',
          name: 'Database',
          parameters: {
            operation: 'executeQuery'
          }
        });
        break;
      
      case 'webhook':
        nodes.push({
          type: 'n8n-nodes-base.webhook',
          name: 'Webhook Trigger',
          parameters: {
            path: 'webhook-path'
          }
        });
        break;
      
      case 'email':
        nodes.push({
          type: 'n8n-nodes-base.emailSend',
          name: 'Send Email',
          parameters: {
            toEmail: hint.data.emails?.[0] || ''
          }
        });
        break;
      
      case 'spreadsheet':
        nodes.push({
          type: 'n8n-nodes-base.spreadsheetFile',
          name: 'Spreadsheet',
          parameters: {
            operation: 'fromFile'
          }
        });
        break;
      
      case 'schedule':
        nodes.push({
          type: 'n8n-nodes-base.scheduleTrigger',
          name: 'Schedule Trigger',
          parameters: {
            rule: {
              interval: [{ field: 'hours', value: 1 }]
            }
          }
        });
        break;
      
      case 'code':
        nodes.push({
          type: 'n8n-nodes-base.function',
          name: 'Function',
          parameters: {
            functionCode: `// ${hint.data.functions?.[0] || 'Custom function'}`
          }
        });
        break;
    }
  }

  return {
    suggestions: extractedData.workflowHints.map((h: any) => h.suggestion),
    nodes,
    confidence: extractedData.workflowHints.length > 0 ? 0.8 : 0.3
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Extract content from file
    const extractedData = await extractContent(file);
    
    // Generate workflow suggestions
    const workflowSuggestions = generateWorkflowSuggestions(extractedData);

    // Combine all data
    const result = {
      fileName: file.name,
      fileType: extractedData.type,
      content: extractedData.content,
      metadata: extractedData.metadata,
      workflowHints: extractedData.workflowHints,
      suggestions: workflowSuggestions.suggestions,
      suggestedNodes: workflowSuggestions.nodes,
      confidence: workflowSuggestions.confidence,
      analysis: {
        hasApiEndpoints: extractedData.workflowHints.some((h: any) => h.type === 'api'),
        hasDatabase: extractedData.workflowHints.some((h: any) => h.type === 'database'),
        hasScheduling: extractedData.workflowHints.some((h: any) => h.type === 'schedule'),
        hasEmailWorkflow: extractedData.workflowHints.some((h: any) => h.type === 'email'),
        complexity: workflowSuggestions.nodes.length > 5 ? 'high' : workflowSuggestions.nodes.length > 2 ? 'medium' : 'low'
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Content extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract content from file' },
      { status: 500 }
    );
  }
}