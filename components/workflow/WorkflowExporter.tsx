'use client';

import React, { useState } from 'react';
import {
  Download,
  Copy,
  QrCode,
  Mail,
  Webhook,
  Check,
  AlertCircle,
  FileJson,
  ArrowRight,
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkflowExportService, ExportOptions, ExportResult } from '@/lib/services/workflow-export.service';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import { N8nService } from '@/lib/services/n8n.service';
import toast from 'react-hot-toast';

interface ExportMethod {
  id: ExportOptions['method'];
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  recommended?: boolean;
}

export const WorkflowExporter: React.FC = () => {
  const [selectedMethod, setSelectedMethod] = useState<ExportOptions['method']>('clipboard');
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  
  const { nodes, edges, workflow } = useWorkflowStore();
  const exportService = WorkflowExportService.getInstance();

  const exportMethods: ExportMethod[] = [
    {
      id: 'clipboard',
      name: 'Copy to Clipboard',
      description: 'Fastest method - paste directly into n8n canvas',
      icon: <Copy className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
      recommended: true
    },
    {
      id: 'download',
      name: 'Download JSON',
      description: 'Save workflow file for backup or sharing',
      icon: <Download className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'qrcode',
      name: 'QR Code',
      description: 'Transfer to mobile or another device',
      icon: <QrCode className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'email',
      name: 'Send via Email',
      description: 'Email workflow to yourself or team',
      icon: <Mail className="h-5 w-5" />,
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'webhook',
      name: 'Webhook Import',
      description: 'Send directly to n8n webhook endpoint',
      icon: <Webhook className="h-5 w-5" />,
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const handleExport = async () => {
    if (!nodes || nodes.length === 0) {
      toast.error('No workflow to export');
      return;
    }

    setIsExporting(true);
    try {
      // Convert React Flow to n8n format
      const n8nWorkflow = exportService.convertFromReactFlow(
        nodes,
        edges,
        workflow?.name || 'Untitled Workflow'
      );

      // Export with selected method
      const result = await exportService.exportWorkflow(n8nWorkflow, {
        method: selectedMethod,
        format: 'json',
        includeCredentials: false,
        validateBeforeExport: true
      });

      setExportResult(result);
      setShowInstructions(true);

      if (result.success) {
        toast.success(`Workflow exported via ${selectedMethod}`);
      } else {
        toast.error(`Export failed: ${result.errors?.join(', ')}`);
      }
    } catch (error) {
      toast.error('Failed to export workflow');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderInstructions = () => {
    if (!exportResult?.instructions) return null;

    return (
      <Card className="mt-4 border-green-200 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Export Successful
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exportResult.instructions.map((instruction, index) => (
              <div key={index} className="flex items-start gap-2">
                {instruction.startsWith('✅') || instruction.startsWith('📱') || instruction.startsWith('📧') ? (
                  <span className="text-lg">{instruction}</span>
                ) : instruction.trim() === '' ? (
                  <div className="w-full h-2" />
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{instruction}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {selectedMethod === 'clipboard' && (
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold mb-1">Pro Tip:</p>
                  <p>You can also press <kbd className="px-2 py-1 bg-white rounded text-xs">Ctrl+V</kbd> (or <kbd className="px-2 py-1 bg-white rounded text-xs">Cmd+V</kbd> on Mac) directly on the n8n canvas without clicking anything!</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Export Methods */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Choose Export Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {exportMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all ${
                selectedMethod === method.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg bg-gradient-to-r ${method.color} text-white`}>
                    {method.icon}
                  </div>
                  {method.recommended && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Recommended
                    </span>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{method.name}</CardTitle>
                <CardDescription className="text-xs">{method.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleExport}
          disabled={isExporting || nodes.length === 0}
          className="min-w-[200px]"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <FileJson className="h-5 w-5 mr-2" />
              Export Workflow
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      {showInstructions && renderInstructions()}

      {/* Validation Errors */}
      {exportResult && !exportResult.success && exportResult.errors && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Export Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {exportResult.errors.map((error, index) => (
                <li key={index} className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="bg-gray-50 dark:bg-gray-900/50">
        <CardHeader>
          <CardTitle className="text-base">Import Methods in n8n</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Copy className="h-4 w-4" />
                Method 1: Quick Paste
              </h4>
              <ol className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>1. Copy workflow (Clipboard method)</li>
                <li>2. Open n8n editor</li>
                <li>3. Press Ctrl+V on canvas</li>
                <li>4. Workflow appears instantly</li>
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Download className="h-4 w-4" />
                Method 2: File Import
              </h4>
              <ol className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                <li>1. Download JSON file</li>
                <li>2. n8n Menu → Import workflow</li>
                <li>3. Select "Import from File"</li>
                <li>4. Choose downloaded file</li>
              </ol>
            </div>
          </div>

          <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">Important Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>Workflows are exported as <strong>inactive</strong> for safety</li>
                  <li>Credentials are not included - configure them in n8n</li>
                  <li>Some custom nodes may need to be installed in n8n first</li>
                  <li>Test the workflow before activating in production</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};