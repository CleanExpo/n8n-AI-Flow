'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Folder,
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  Image,
  Archive,
  Upload,
  X,
  ChevronRight,
  Clock,
  Grid,
  List,
  Filter,
  FolderOpen,
  Database,
  Globe,
  Mail,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  extension?: string;
  size?: number;
  path: string;
  modifiedAt: Date;
  content?: string;
  children?: FileItem[];
  selected?: boolean;
  processing?: boolean;
  processed?: boolean;
  extractedContent?: any;
}

interface EnhancedFileBrowserProps {
  onFilesSelected: (files: FileItem[]) => void;
  onContentExtracted?: (content: any) => void;
  className?: string;
}

export function EnhancedFileBrowser({
  onFilesSelected,
  onContentExtracted,
  className
}: EnhancedFileBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>(['root']);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterType, setFilterType] = useState<'all' | 'documents' | 'images' | 'code' | 'data'>('all');
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Mock file system - in production, this would connect to actual file API
  const [fileSystem, setFileSystem] = useState<FileItem[]>([
    {
      id: '1',
      name: 'Documents',
      type: 'folder',
      path: '/Documents',
      modifiedAt: new Date(),
      children: [
        {
          id: '2',
          name: 'workflow-requirements.pdf',
          type: 'file',
          extension: 'pdf',
          size: 245000,
          path: '/Documents/workflow-requirements.pdf',
          modifiedAt: new Date()
        },
        {
          id: '3',
          name: 'api-documentation.md',
          type: 'file',
          extension: 'md',
          size: 12000,
          path: '/Documents/api-documentation.md',
          modifiedAt: new Date()
        }
      ]
    },
    {
      id: '4',
      name: 'Projects',
      type: 'folder',
      path: '/Projects',
      modifiedAt: new Date(),
      children: [
        {
          id: '5',
          name: 'automation-scripts',
          type: 'folder',
          path: '/Projects/automation-scripts',
          modifiedAt: new Date(),
          children: [
            {
              id: '6',
              name: 'email-processor.js',
              type: 'file',
              extension: 'js',
              size: 8500,
              path: '/Projects/automation-scripts/email-processor.js',
              modifiedAt: new Date()
            },
            {
              id: '7',
              name: 'data-pipeline.json',
              type: 'file',
              extension: 'json',
              size: 3200,
              path: '/Projects/automation-scripts/data-pipeline.json',
              modifiedAt: new Date()
            }
          ]
        }
      ]
    }
  ]);

  const getFileIcon = (file: FileItem) => {
    if (file.type === 'folder') {
      return file.children?.length ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />;
    }

    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
      case 'txt':
      case 'md':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'py':
      case 'java':
      case 'cpp':
      case 'html':
      case 'css':
        return <FileCode className="h-5 w-5 text-green-500" />;
      case 'csv':
      case 'xlsx':
      case 'xls':
        return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image className="h-5 w-5 text-purple-500" />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
        return <Archive className="h-5 w-5 text-orange-500" />;
      case 'json':
      case 'xml':
        return <Database className="h-5 w-5 text-indigo-500" />;
      case 'eml':
      case 'msg':
        return <Mail className="h-5 w-5 text-red-500" />;
      case 'html':
      case 'htm':
        return <Globe className="h-5 w-5 text-cyan-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleFileSelect = (file: FileItem, multiSelect = false) => {
    if (file.type === 'folder') {
      setCurrentPath([...currentPath, file.name]);
      return;
    }

    setSelectedFiles(prev => {
      if (multiSelect) {
        const exists = prev.find(f => f.id === file.id);
        if (exists) {
          return prev.filter(f => f.id !== file.id);
        }
        return [...prev, file];
      }
      return [file];
    });

    // Add to recent files
    setRecentFiles(prev => {
      const filtered = prev.filter(f => f.id !== file.id);
      return [file, ...filtered].slice(0, 10);
    });
  };

  const handleProcessFiles = async () => {
    if (selectedFiles.length === 0) return;

    setIsLoading(true);
    
    // Mark files as processing
    setSelectedFiles(prev => 
      prev.map(f => ({ ...f, processing: true }))
    );

    try {
      // Process each file
      for (const file of selectedFiles) {
        const formData = new FormData();
        
        // In production, would get actual file content
        const mockContent = `Content of ${file.name}`;
        const blob = new Blob([mockContent], { type: 'text/plain' });
        formData.append('file', blob, file.name);
        
        const response = await fetch('/api/ai/extract-content', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const extractedContent = await response.json();
          
          setSelectedFiles(prev =>
            prev.map(f =>
              f.id === file.id
                ? { ...f, processing: false, processed: true, extractedContent }
                : f
            )
          );

          if (onContentExtracted) {
            onContentExtracted(extractedContent);
          }
        }
      }

      onFilesSelected(selectedFiles);
    } catch (error) {
      console.error('File processing error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    const newFiles: FileItem[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      name: file.name,
      type: 'file' as const,
      extension: file.name.split('.').pop(),
      size: file.size,
      path: `/${file.name}`,
      modifiedAt: new Date(file.lastModified)
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Group files by folder structure
    const folderStructure: { [key: string]: FileItem[] } = {};
    
    files.forEach(file => {
      const pathParts = file.webkitRelativePath.split('/');
      const folderPath = pathParts.slice(0, -1).join('/');
      
      if (!folderStructure[folderPath]) {
        folderStructure[folderPath] = [];
      }
      
      folderStructure[folderPath].push({
        id: `upload-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'file',
        extension: file.name.split('.').pop(),
        size: file.size,
        path: file.webkitRelativePath,
        modifiedAt: new Date(file.lastModified)
      });
    });

    // Flatten and add all files
    const allFiles = Object.values(folderStructure).flat();
    setSelectedFiles(prev => [...prev, ...allFiles]);
  };

  const filteredFiles = fileSystem.filter(file => {
    if (searchQuery) {
      return file.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    if (filterType === 'all') return true;
    
    const ext = file.extension?.toLowerCase();
    switch (filterType) {
      case 'documents':
        return ['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext || '');
      case 'images':
        return ['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(ext || '');
      case 'code':
        return ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'html', 'css'].includes(ext || '');
      case 'data':
        return ['json', 'csv', 'xlsx', 'xls', 'xml'].includes(ext || '');
      default:
        return true;
    }
  });

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <Tabs defaultValue="browse" className="h-full flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="browse">
            <Folder className="h-4 w-4 mr-2" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="recent">
            <Clock className="h-4 w-4 mr-2" />
            Recent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="flex-1 flex flex-col p-0">
          {/* Search and Filter Bar */}
          <div className="p-4 border-b space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search files and folders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              {(['all', 'documents', 'images', 'code', 'data'] as const).map(type => (
                <Button
                  key={type}
                  size="sm"
                  variant={filterType === type ? 'default' : 'outline'}
                  onClick={() => setFilterType(type)}
                  className="text-xs"
                >
                  <Filter className="h-3 w-3 mr-1" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-muted-foreground">
              {currentPath.map((path, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                  <button
                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                    className="hover:text-foreground"
                  >
                    {path}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* File List */}
          <ScrollArea className="flex-1">
            <div className={cn(
              "p-4",
              viewMode === 'grid' ? 'grid grid-cols-4 gap-4' : 'space-y-1'
            )}>
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  onClick={(e) => handleFileSelect(file, e.ctrlKey || e.metaKey)}
                  className={cn(
                    "cursor-pointer rounded-lg transition-colors",
                    viewMode === 'grid' 
                      ? "p-4 border hover:bg-accent text-center"
                      : "flex items-center gap-3 p-2 hover:bg-accent",
                    selectedFiles.find(f => f.id === file.id) && "bg-accent"
                  )}
                >
                  <div className={cn(
                    "flex items-center",
                    viewMode === 'grid' && "flex-col gap-2"
                  )}>
                    {getFileIcon(file)}
                    <div className={cn(
                      viewMode === 'list' && "flex-1 flex items-center justify-between"
                    )}>
                      <span className="text-sm truncate">{file.name}</span>
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>{file.modifiedAt.toLocaleDateString()}</span>
                          {file.processed && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {file.processing && <AlertCircle className="h-3 w-3 text-yellow-500 animate-pulse" />}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="upload" className="flex-1 flex flex-col p-4">
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Upload Files or Folders</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag and drop or click to browse
            </p>
            
            <div className="flex gap-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
              >
                <File className="h-4 w-4 mr-2" />
                Select Files
              </Button>
              
              <input
                ref={folderInputRef}
                type="file"
                multiple
                // @ts-ignore - webkitdirectory is not in TypeScript types
                webkitdirectory=""
                className="hidden"
                onChange={handleFolderUpload}
              />
              <Button
                variant="outline"
                onClick={() => folderInputRef.current?.click()}
              >
                <Folder className="h-4 w-4 mr-2" />
                Select Folder
              </Button>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Selected Files ({selectedFiles.length})</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedFiles([])}
                  >
                    Clear All
                  </Button>
                </div>
                <ScrollArea className="h-48 border rounded-lg p-2">
                  {selectedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file)}
                        <span className="text-sm truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => setSelectedFiles(prev => prev.filter(f => f.id !== file.id))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="flex-1 p-4">
          {recentFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Clock className="h-12 w-12 mb-4" />
              <p>No recent files</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {recentFiles.map(file => (
                  <div
                    key={file.id}
                    onClick={() => handleFileSelect(file)}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer"
                  >
                    {getFileIcon(file)}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.path}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {file.modifiedAt.toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Bar */}
      {selectedFiles.length > 0 && (
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <Button
              onClick={handleProcessFiles}
              disabled={isLoading}
            >
              {isLoading ? (
                <>Processing...</>
              ) : (
                <>Process Files</>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}