'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  Eye, 
  FileText, 
  Image as ImageIcon,
  Code,
  Database,
  FileSpreadsheet,
  Archive,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Copy,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FileItem } from './EnhancedFileBrowser';
import { ContentExtractor, ExtractedContent } from '@/lib/content-extraction';

interface FilePreviewProps {
  file: FileItem | null;
  onClose?: () => void;
  onExtractContent?: (content: ExtractedContent) => void;
  showExtractedContent?: boolean;
  className?: string;
}

export function FilePreview({
  file,
  onClose,
  onExtractContent,
  showExtractedContent = true,
  className
}: FilePreviewProps) {
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [extractedContent, setExtractedContent] = useState<ExtractedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showMetadata, setShowMetadata] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const contentExtractor = new ContentExtractor();

  useEffect(() => {
    if (file) {
      loadPreview();
    } else {
      setPreviewContent(null);
      setExtractedContent(null);
      setError(null);
    }
  }, [file]);

  const loadPreview = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create a File object from FileItem (simulation)
      const mockFile = new File(['mock content'], file.name, {
        type: getMimeType(file.extension || '')
      });

      // Extract content using the content extractor
      if (showExtractedContent) {
        const extracted = await contentExtractor.extractFromFile(mockFile);
        setExtractedContent(extracted);
        onExtractContent?.(extracted);
      }

      // Generate preview based on file type
      const preview = await generatePreview(file);
      setPreviewContent(preview);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsLoading(false);
    }
  }, [file, showExtractedContent, onExtractContent]);

  const generatePreview = async (file: FileItem) => {
    const extension = file.extension?.toLowerCase();
    
    switch (extension) {
      case 'txt':
      case 'md':
        return {
          type: 'text',
          content: `Sample text content from ${file.name}.\n\nThis would contain the actual file content in a real implementation.`,
          language: extension === 'md' ? 'markdown' : 'text'
        };
      
      case 'json':
        return {
          type: 'code',
          content: JSON.stringify({
            "name": "sample-data",
            "version": "1.0.0",
            "description": `Sample JSON from ${file.name}`,
            "data": {
              "items": [1, 2, 3],
              "metadata": {
                "created": new Date().toISOString()
              }
            }
          }, null, 2),
          language: 'json'
        };
      
      case 'js':
      case 'ts':
        return {
          type: 'code',
          content: `// Sample ${extension.toUpperCase()} code from ${file.name}
function processData(input) {
  // This would contain the actual file content
  return input.map(item => ({
    ...item,
    processed: true,
    timestamp: new Date().toISOString()
  }));
}

export default processData;`,
          language: extension
        };
      
      case 'csv':
        return {
          type: 'table',
          headers: ['Name', 'Email', 'Department', 'Status'],
          rows: [
            ['John Doe', 'john@example.com', 'Engineering', 'Active'],
            ['Jane Smith', 'jane@example.com', 'Marketing', 'Active'],
            ['Bob Johnson', 'bob@example.com', 'Sales', 'Inactive']
          ]
        };
      
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return {
          type: 'image',
          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjg3NDgwIiBmb250LXNpemU9IjE2Ij5JbWFnZSBQcmV2aWV3PC90ZXh0Pgo8L3N2Zz4K',
          alt: file.name
        };
      
      case 'pdf':
        return {
          type: 'pdf',
          pages: 5,
          currentPage: 1,
          content: `PDF Preview: ${file.name}\n\nPage 1 of 5\n\nThis would show the actual PDF content in a real implementation.`
        };
      
      default:
        return {
          type: 'unsupported',
          message: `Preview not available for ${extension} files`,
          suggestion: 'Try downloading the file to view its contents'
        };
    }
  };

  const getMimeType = (extension: string): string => {
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'json': 'application/json',
      'js': 'text/javascript',
      'ts': 'text/typescript',
      'csv': 'text/csv',
      'pdf': 'application/pdf',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml'
    };
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      return Math.max(0.5, Math.min(3, newZoom));
    });
  };

  const handleCopyContent = () => {
    if (previewContent?.content) {
      navigator.clipboard.writeText(previewContent.content);
    }
  };

  const renderPreviewContent = () => {
    if (!previewContent) return null;

    switch (previewContent.type) {
      case 'text':
        return (
          <div className="p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {previewContent.content}
            </pre>
          </div>
        );

      case 'code':
        return (
          <div className="overflow-hidden">
            <SyntaxHighlighter
              language={previewContent.language}
              style={vscDarkPlus}
              customStyle={{
                margin: 0,
                fontSize: '14px',
                transform: `scale(${zoom})`
              }}
            >
              {previewContent.content}
            </SyntaxHighlighter>
          </div>
        );

      case 'table':
        return (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted">
                    {previewContent.headers.map((header: string, index: number) => (
                      <th key={index} className="border border-border p-2 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewContent.rows.map((row: string[], rowIndex: number) => (
                    <tr key={rowIndex}>
                      {row.map((cell: string, cellIndex: number) => (
                        <td key={cellIndex} className="border border-border p-2">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center p-4">
            <img
              src={previewContent.url}
              alt={previewContent.alt}
              className="max-w-full max-h-96 object-contain"
              style={{ transform: `scale(${zoom})` }}
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {previewContent.pages}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(previewContent.pages, prev + 1))}
                  disabled={currentPage === previewContent.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="border border-border p-4 bg-white text-black min-h-96">
              <pre className="whitespace-pre-wrap text-sm">
                {previewContent.content}
              </pre>
            </div>
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{previewContent.message}</h3>
            <p className="text-sm text-muted-foreground">{previewContent.suggestion}</p>
          </div>
        );

      default:
        return null;
    }
  };

  const renderExtractedContent = () => {
    if (!extractedContent) return null;

    return (
      <Card className="mt-4">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Extracted Content</h3>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="secondary">{extractedContent.metadata.type}</Badge>
            {extractedContent.metadata.size && (
              <Badge variant="outline">
                {Math.round(extractedContent.metadata.size / 1024)}KB
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-64">
          <div className="p-4">
            {extractedContent.text && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Text Content</h4>
                <p className="text-sm text-muted-foreground line-clamp-6">
                  {extractedContent.text}
                </p>
              </div>
            )}
            
            {extractedContent.workflows && extractedContent.workflows.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Detected Workflows</h4>
                {extractedContent.workflows.map((workflow, index) => (
                  <div key={index} className="text-sm bg-muted p-2 rounded mb-2">
                    <div className="font-medium">{workflow.type}</div>
                    <div className="text-muted-foreground">{workflow.description}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {Math.round(workflow.confidence * 100)}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            
            {extractedContent.structure && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Structure</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(extractedContent.structure, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>
    );
  };

  if (!file) return null;

  return (
    <div className={cn("fixed inset-0 z-50 bg-background/80 backdrop-blur-sm", className)}>
      <div className="fixed inset-y-4 right-4 w-3/4 max-w-4xl">
        <Card className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getFileIcon(file)}
              </div>
              <div>
                <h2 className="font-semibold truncate">{file.name}</h2>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  {file.size && <span>{Math.round(file.size / 1024)}KB</span>}
                  {file.modifiedAt && (
                    <span>{file.modifiedAt.toLocaleDateString()}</span>
                  )}
                  {file.extension && (
                    <Badge variant="secondary" className="text-xs">
                      {file.extension.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <Info className="h-4 w-4" />
              </Button>
              
              {previewContent?.type === 'code' || previewContent?.type === 'image' ? (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleZoom('out')}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleZoom('in')}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </>
              ) : null}
              
              {previewContent?.content && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyContent}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              
              <Button size="sm" variant="ghost">
                <Download className="h-4 w-4" />
              </Button>
              
              <Button size="sm" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading preview...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h3 className="text-lg font-medium mb-2">Preview Error</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <ScrollArea className="h-full">
                  {renderPreviewContent()}
                  
                  {showExtractedContent && renderExtractedContent()}
                  
                  {showMetadata && file && (
                    <Card className="m-4">
                      <div className="p-4">
                        <h3 className="font-semibold mb-3">File Metadata</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Path:</span>
                            <span className="font-mono">{file.path}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span>{file.type}</span>
                          </div>
                          {file.size && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Size:</span>
                              <span>{file.size.toLocaleString()} bytes</span>
                            </div>
                          )}
                          {file.lastModified && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Modified:</span>
                              <span>{file.lastModified.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  )}
                </ScrollArea>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function getFileIcon(file: FileItem) {
  if (file.type === 'directory') return <Folder className="h-5 w-5" />;
  
  const ext = file.extension?.toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'doc':
    case 'docx':
    case 'txt':
      return <FileText className="h-5 w-5" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return <ImageIcon className="h-5 w-5" />;
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet className="h-5 w-5" />;
    case 'js':
    case 'ts':
    case 'json':
    case 'html':
    case 'css':
    case 'py':
      return <Code className="h-5 w-5" />;
    case 'sql':
      return <Database className="h-5 w-5" />;
    case 'zip':
    case 'rar':
    case '7z':
      return <Archive className="h-5 w-5" />;
    default:
      return <FileText className="h-5 w-5" />;
  }
}