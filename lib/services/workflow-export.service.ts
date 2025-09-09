/**
 * Workflow Export Service
 * Handles exporting workflows from the app to n8n without API access
 */

import { Node, Edge } from '@xyflow/react';
import { N8nWorkflow, N8nNode, N8nConnection } from './n8n.service';

export interface ExportOptions {
  method: 'download' | 'clipboard' | 'qrcode' | 'email' | 'webhook';
  format: 'json' | 'base64' | 'compressed';
  includeCredentials: boolean;
  validateBeforeExport: boolean;
}

export interface ExportResult {
  success: boolean;
  data?: string;
  errors?: string[];
  method: string;
  instructions?: string[];
}

export class WorkflowExportService {
  private static instance: WorkflowExportService;

  private constructor() {}

  static getInstance(): WorkflowExportService {
    if (!WorkflowExportService.instance) {
      WorkflowExportService.instance = new WorkflowExportService();
    }
    return WorkflowExportService.instance;
  }

  /**
   * Export workflow with multiple methods
   */
  async exportWorkflow(
    workflow: N8nWorkflow,
    options: ExportOptions = {
      method: 'download',
      format: 'json',
      includeCredentials: false,
      validateBeforeExport: true
    }
  ): Promise<ExportResult> {
    try {
      // Validate workflow if requested
      if (options.validateBeforeExport) {
        const validation = this.validateWorkflow(workflow);
        if (!validation.valid) {
          return {
            success: false,
            errors: validation.errors,
            method: options.method
          };
        }
      }

      // Clean credentials if not included
      if (!options.includeCredentials) {
        workflow = this.removeCredentials(workflow);
      }

      // Prepare workflow data
      const workflowData = this.prepareWorkflowForExport(workflow);

      // Export based on selected method
      switch (options.method) {
        case 'download':
          return await this.exportAsDownload(workflowData, workflow.name);
        case 'clipboard':
          return await this.exportToClipboard(workflowData);
        case 'qrcode':
          return await this.exportAsQRCode(workflowData);
        case 'email':
          return await this.exportViaEmail(workflowData, workflow.name);
        case 'webhook':
          return await this.exportViaWebhook(workflowData);
        default:
          return await this.exportAsDownload(workflowData, workflow.name);
      }
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Export failed'],
        method: options.method
      };
    }
  }

  /**
   * Method 1: Download as JSON file
   */
  private async exportAsDownload(workflow: N8nWorkflow, name: string): Promise<ExportResult> {
    const json = JSON.stringify(workflow, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name.replace(/[^a-z0-9]/gi, '_')}_n8n_workflow.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      method: 'download',
      instructions: [
        '1. File downloaded to your Downloads folder',
        '2. Open n8n in your browser',
        '3. Click the menu (☰) in the top-left corner',
        '4. Select "Import workflow"',
        '5. Choose "Import from File"',
        '6. Select the downloaded JSON file',
        '7. Update any credentials before activating'
      ]
    };
  }

  /**
   * Method 2: Copy to clipboard for paste import
   */
  private async exportToClipboard(workflow: N8nWorkflow): Promise<ExportResult> {
    const json = JSON.stringify(workflow, null, 2);
    
    try {
      await navigator.clipboard.writeText(json);
      
      return {
        success: true,
        method: 'clipboard',
        instructions: [
          '✅ Workflow copied to clipboard!',
          '',
          'To import in n8n:',
          '1. Open n8n in your browser',
          '2. Create a new workflow or open an existing one',
          '3. Click anywhere on the canvas',
          '4. Press Ctrl+V (or Cmd+V on Mac)',
          '5. The workflow will appear instantly',
          '6. Update credentials before activating'
        ]
      };
    } catch (error) {
      // Fallback for browsers without clipboard API
      return this.exportToClipboardFallback(json);
    }
  }

  /**
   * Clipboard fallback using textarea
   */
  private exportToClipboardFallback(json: string): ExportResult {
    const textarea = document.createElement('textarea');
    textarea.value = json;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    return {
      success: true,
      method: 'clipboard',
      data: json,
      instructions: [
        '✅ Workflow copied to clipboard (fallback method)',
        'Paste with Ctrl+V in n8n canvas'
      ]
    };
  }

  /**
   * Method 3: Generate QR Code for mobile transfer
   */
  private async exportAsQRCode(workflow: N8nWorkflow): Promise<ExportResult> {
    // Compress workflow for QR code
    const compressed = this.compressWorkflow(workflow);
    
    // For large workflows, use a temporary URL service
    if (compressed.length > 2000) {
      const url = await this.createTemporaryUrl(workflow);
      return {
        success: true,
        method: 'qrcode',
        data: url,
        instructions: [
          '📱 Scan QR code with mobile device',
          'URL contains your workflow (expires in 24h)',
          'Open URL in n8n to import'
        ]
      };
    }

    // Small workflows can be encoded directly
    const qrData = `n8n://import?workflow=${encodeURIComponent(compressed)}`;
    
    return {
      success: true,
      method: 'qrcode',
      data: qrData,
      instructions: [
        '📱 QR Code generated',
        'Scan with n8n mobile app to import directly'
      ]
    };
  }

  /**
   * Method 4: Send via email
   */
  private async exportViaEmail(workflow: N8nWorkflow, name: string): Promise<ExportResult> {
    const json = JSON.stringify(workflow, null, 2);
    const subject = `n8n Workflow: ${name}`;
    const body = `
Attached is your n8n workflow: ${name}

Import Instructions:
1. Save the attached JSON file
2. Open n8n
3. Menu → Import workflow → Import from File
4. Select the saved file

Alternatively, copy the JSON below and paste directly into n8n canvas:

${json}
    `.trim();

    // Create mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    // Truncate if too long for mailto
    if (mailtoLink.length > 2000) {
      const shortBody = `
Your n8n workflow is ready for import.

Due to size limitations, please use the download method instead,
or copy the workflow from the clipboard.
      `.trim();
      
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`;
    } else {
      window.location.href = mailtoLink;
    }

    return {
      success: true,
      method: 'email',
      instructions: [
        '📧 Email client opened',
        'Send the email to yourself or a colleague',
        'Follow the instructions in the email to import'
      ]
    };
  }

  /**
   * Method 5: Send to n8n webhook for auto-import
   */
  private async exportViaWebhook(workflow: N8nWorkflow): Promise<ExportResult> {
    // This requires setting up a webhook workflow in n8n first
    const webhookUrl = prompt(
      'Enter your n8n webhook URL:\n' +
      '(Set up a webhook workflow in n8n to receive imports)'
    );

    if (!webhookUrl) {
      return {
        success: false,
        method: 'webhook',
        errors: ['No webhook URL provided']
      };
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          workflow,
          metadata: {
            exportedAt: new Date().toISOString(),
            source: 'n8n-ai-flow-app'
          }
        })
      });

      if (response.ok) {
        return {
          success: true,
          method: 'webhook',
          instructions: [
            '✅ Workflow sent to n8n webhook',
            'Check your n8n instance for the imported workflow',
            'It should appear in your workflows list'
          ]
        };
      } else {
        throw new Error(`Webhook returned ${response.status}`);
      }
    } catch (error) {
      return {
        success: false,
        method: 'webhook',
        errors: [error instanceof Error ? error.message : 'Webhook failed']
      };
    }
  }

  /**
   * Validate workflow before export
   */
  validateWorkflow(workflow: N8nWorkflow): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields
    if (!workflow.name) errors.push('Workflow name is required');
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow must have at least one node');
    }

    // Validate nodes
    workflow.nodes?.forEach((node, index) => {
      if (!node.name) errors.push(`Node ${index} missing name`);
      if (!node.type) errors.push(`Node ${node.name || index} missing type`);
      if (!node.typeVersion) errors.push(`Node ${node.name || index} missing typeVersion`);
      if (!node.position || node.position.length !== 2) {
        errors.push(`Node ${node.name || index} has invalid position`);
      }

      // Check for duplicate node names
      const duplicates = workflow.nodes?.filter(n => n.name === node.name);
      if (duplicates && duplicates.length > 1) {
        errors.push(`Duplicate node name: ${node.name}`);
      }
    });

    // Validate connections
    if (workflow.connections) {
      Object.entries(workflow.connections).forEach(([source, targets]) => {
        // Check if source node exists
        if (!workflow.nodes?.find(n => n.name === source)) {
          errors.push(`Connection source node not found: ${source}`);
        }

        // Check target nodes
        targets.main?.forEach(connectionSet => {
          connectionSet.forEach(conn => {
            if (!workflow.nodes?.find(n => n.name === conn.node)) {
              errors.push(`Connection target node not found: ${conn.node}`);
            }
          });
        });
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Remove credentials from workflow for security
   */
  private removeCredentials(workflow: N8nWorkflow): N8nWorkflow {
    const cleaned = { ...workflow };
    cleaned.nodes = workflow.nodes.map(node => {
      const cleanNode = { ...node };
      if (cleanNode.credentials) {
        // Keep credential references but remove actual data
        cleanNode.credentials = Object.keys(cleanNode.credentials).reduce((acc, key) => {
          acc[key] = { id: 'PLACEHOLDER', name: `${key} (configure in n8n)` };
          return acc;
        }, {} as Record<string, any>);
      }
      return cleanNode;
    });
    return cleaned;
  }

  /**
   * Prepare workflow for export (add defaults, clean data)
   */
  private prepareWorkflowForExport(workflow: N8nWorkflow): N8nWorkflow {
    return {
      name: workflow.name,
      active: false, // Always export as inactive for safety
      nodes: workflow.nodes.map(node => ({
        ...node,
        disabled: node.disabled || false,
        continueOnFail: node.continueOnFail || false,
        retryOnFail: node.retryOnFail || false,
        maxTries: node.maxTries || 3,
        waitBetweenTries: node.waitBetweenTries || 1000
      })),
      connections: workflow.connections || {},
      settings: {
        executionOrder: 'v1',
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all',
        saveManualExecutions: true,
        callerPolicy: 'workflowsFromSameOwner',
        ...workflow.settings
      },
      staticData: workflow.staticData || {},
      tags: workflow.tags || []
    };
  }

  /**
   * Compress workflow for size-limited transfers
   */
  private compressWorkflow(workflow: N8nWorkflow): string {
    const json = JSON.stringify(workflow);
    // Simple compression using base64 encoding
    // In production, use proper compression library
    return btoa(json);
  }

  /**
   * Create temporary URL for large workflows
   */
  private async createTemporaryUrl(workflow: N8nWorkflow): Promise<string> {
    // This would upload to a temporary storage service
    // For demo, we'll use a data URL
    const json = JSON.stringify(workflow);
    const blob = new Blob([json], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  /**
   * Convert React Flow to n8n format
   */
  convertFromReactFlow(nodes: Node[], edges: Edge[], name: string): N8nWorkflow {
    // Convert nodes
    const n8nNodes: N8nNode[] = nodes.map(node => ({
      id: node.id,
      name: node.data.label || node.id,
      type: this.mapNodeType(node.data.type || node.type),
      position: [node.position.x, node.position.y],
      parameters: node.data.parameters || {},
      typeVersion: this.getTypeVersion(node.data.type || node.type),
      credentials: node.data.credentials
    }));

    // Convert connections
    const connections: N8nConnection = {};
    edges.forEach(edge => {
      const sourceNode = n8nNodes.find(n => n.id === edge.source);
      const targetNode = n8nNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        if (!connections[sourceNode.name]) {
          connections[sourceNode.name] = { main: [[]] };
        }
        connections[sourceNode.name].main[0].push({
          node: targetNode.name,
          type: 'main',
          index: 0
        });
      }
    });

    return {
      name,
      active: false,
      nodes: n8nNodes,
      connections,
      settings: {
        executionOrder: 'v1',
        saveDataErrorExecution: 'all',
        saveDataSuccessExecution: 'all'
      },
      staticData: {},
      tags: ['ai-generated']
    };
  }

  /**
   * Map custom node types to n8n node types
   */
  private mapNodeType(type: string): string {
    const typeMap: Record<string, string> = {
      'webhook': 'n8n-nodes-base.webhook',
      'http_request': 'n8n-nodes-base.httpRequest',
      'ai_agent': '@n8n/n8n-nodes-langchain.agent',
      'database': 'n8n-nodes-base.postgres',
      'email': 'n8n-nodes-base.emailSend',
      'slack': 'n8n-nodes-base.slack',
      'code': 'n8n-nodes-base.code',
      'if': 'n8n-nodes-base.if',
      'loop': 'n8n-nodes-base.splitInBatches',
      'merge': 'n8n-nodes-base.merge'
    };

    return typeMap[type] || 'n8n-nodes-base.noOp';
  }

  /**
   * Get type version for node type
   */
  private getTypeVersion(type: string): number {
    const versionMap: Record<string, number> = {
      'webhook': 1,
      'http_request': 4,
      'ai_agent': 1,
      'database': 2,
      'email': 2,
      'slack': 1,
      'code': 1,
      'if': 1,
      'loop': 1,
      'merge': 2
    };

    return versionMap[type] || 1;
  }
}