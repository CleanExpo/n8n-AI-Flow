'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Upload, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  FileText, 
  Link, 
  Sparkles,
  Bot,
  User,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  Play,
  Save,
  Folder,
  Files,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EnhancedFileBrowser, FileItem } from './EnhancedFileBrowser';
import { FilePreview } from './FilePreview';
import { ContentExtractor, ExtractedContent } from '@/lib/content-extraction';
import { SmartDocumentParser, GeneratedWorkflow } from '@/lib/smart-document-parser';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'url';
    name: string;
    url: string;
    content?: string;
  }>;
  workflowPreview?: any;
  timestamp: Date;
  status?: 'sending' | 'processing' | 'complete' | 'error';
  extractedContent?: ExtractedContent[];
  generatedWorkflow?: GeneratedWorkflow;
}

interface AIWorkflowChatProps {
  onWorkflowGenerated?: (workflow: any) => void;
  onPreviewWorkflow?: (workflow: any) => void;
  className?: string;
}

export function AIWorkflowChat({ 
  onWorkflowGenerated, 
  onPreviewWorkflow,
  className 
}: AIWorkflowChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your enhanced AI Workflow Assistant. I can help you create powerful n8n workflows from your ideas, documents, entire folders, or projects. Browse files, upload documents, or describe what you want to automate - I'll analyze everything and build the perfect workflow for you!",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'preview'>('chat');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const contentExtractor = new ContentExtractor();
  const documentParser = new SmartDocumentParser();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for demo scenario data on mount
  useEffect(() => {
    const storedScenario = sessionStorage.getItem('demoScenario');
    if (storedScenario) {
      try {
        const scenario = JSON.parse(storedScenario);
        
        // Set the input prompt
        setInput(scenario.prompt);
        
        // Add demo message
        setMessages(prev => [...prev, {
          id: 'demo-' + Date.now(),
          role: 'system' as const,
          content: `🎯 Demo Scenario Loaded: ${scenario.title}\n\n${scenario.description}`,
          timestamp: new Date()
        }]);
        
        // If there's a sample file, create it as an attachment
        if (scenario.sampleFile) {
          const file = new File(
            [scenario.sampleFile.content],
            scenario.sampleFile.name,
            { type: scenario.sampleFile.type }
          );
          setAttachments([file]);
        }
        
        // Clear the storage after using it
        sessionStorage.removeItem('demoScenario');
      } catch (error) {
        console.error('Failed to load demo scenario:', error);
      }
    }
  }, []);

  const handleSendMessage = async () => {
    console.log('handleSendMessage called with input:', input);
    if (!input.trim() && attachments.length === 0 && selectedFiles.length === 0) {
      console.log('No input or attachments, returning');
      return;
    }

    // Process all file sources
    let allExtractedContent = [...extractedContents];
    
    // Process regular attachments
    if (attachments.length > 0) {
      for (const file of attachments) {
        try {
          const extracted = await contentExtractor.extractFromFile(file);
          allExtractedContent.push(extracted);
        } catch (error) {
          console.error('Failed to extract content from', file.name, error);
        }
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: await processAttachments(attachments),
      extractedContent: allExtractedContent,
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setSelectedFiles([]);
    setExtractedContents([]);
    setIsProcessing(true);
    setProcessingStage('Analyzing your request...');

    try {
      console.log('Sending request to /api/ai/generate-workflow');
      
      // Process documents with error handling
      setProcessingStage('Processing documents and extracting workflow patterns...');
      let generatedWorkflow = null;
      try {
        if (allExtractedContent.length > 0) {
          generatedWorkflow = await documentParser.generateWorkflowFromContent(
            allExtractedContent,
            input
          );
        }
      } catch (parserError) {
        console.warn('Document parser error (non-fatal):', parserError);
        // Don't show parser errors to users - they're internal processing details
      }

      // Generate workflow with AI
      setProcessingStage('Generating workflow with AI...');
      const response = await fetch('/api/ai/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          message: input,
          attachments: userMessage.attachments,
          extractedContent: allExtractedContent,
          context: messages.slice(-5)
        })
      });

      console.log('API Response status:', response.status);
      
      if (!response.ok) {
        console.error('API Error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
        
        // Provide user-friendly error messages
        let userErrorMessage = 'Failed to generate workflow. ';
        if (response.status === 429) {
          userErrorMessage = 'Too many requests. Please try again in a moment.';
        } else if (response.status >= 500) {
          userErrorMessage = 'Server is temporarily unavailable. Please try again later.';
        } else if (response.status === 401) {
          userErrorMessage = 'Authentication required. Please sign in and try again.';
        } else {
          userErrorMessage = 'Unable to process your request. Please try rephrasing or simplifying your prompt.';
        }
        
        throw new Error(userErrorMessage);
      }
      
      setProcessingStage('Finalizing workflow...');
      const apiData = await response.json();
      console.log('API Data received:', apiData);

      // Create response content based on what was actually generated
      let responseContent = "I've successfully generated your workflow! ";
      
      if (allExtractedContent.length > 0) {
        responseContent += `I analyzed ${allExtractedContent.length} document(s) and extracted the key automation patterns. `;
      }
      
      if (generatedWorkflow?.description) {
        responseContent += `\n\n${generatedWorkflow.description}`;
        if (generatedWorkflow.metadata) {
          responseContent += `\n\n📊 **Workflow Analysis:**\n`;
          responseContent += `• Confidence: ${Math.round(generatedWorkflow.metadata.confidence * 100)}%\n`;
          responseContent += `• Complexity: ${generatedWorkflow.metadata.complexity}\n`;
          responseContent += `• Category: ${generatedWorkflow.metadata.category}`;
        }
      } else if (apiData.explanation) {
        responseContent += `\n\n${apiData.explanation}`;
      }
      
      responseContent += "\n\nYou can now preview, customize, or deploy this workflow to n8n!";

      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        workflowPreview: apiData.workflow || generatedWorkflow,
        generatedWorkflow: generatedWorkflow || undefined,
        extractedContent: allExtractedContent,
        timestamp: new Date(),
        status: 'complete'
      };

      setMessages(prev => [...prev, aiResponse]);
      
      if (onWorkflowGenerated) {
        onWorkflowGenerated(apiData.workflow || generatedWorkflow);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      
      // Provide helpful, user-friendly error message
      let errorContent = "I apologize, but I encountered an issue while generating your workflow. ";
      
      if (error instanceof Error) {
        errorContent += error.message;
      } else {
        errorContent += "This might be a temporary issue.";
      }
      
      errorContent += "\n\n💡 **Try these solutions:**\n";
      errorContent += "• Check your internet connection\n";
      errorContent += "• Simplify your request or break it into smaller parts\n";
      errorContent += "• Try again in a few moments\n";
      errorContent += "• If the issue persists, please contact support";
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const processAttachments = async (files: File[]): Promise<Message['attachments']> => {
    const processed = await Promise.all(
      files.map(async (file) => {
        const url = URL.createObjectURL(file);
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        
        // For text files, read content
        let content;
        if (file.type.startsWith('text/') || file.name.endsWith('.json')) {
          content = await file.text();
        }

        return {
          type: type as 'image' | 'file',
          name: file.name,
          url,
          content
        };
      })
    );
    return processed;
  };

  const handleVoiceInput = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          // Convert to text using speech-to-text API
          const formData = new FormData();
          formData.append('audio', blob);
          
          try {
            const response = await fetch('/api/ai/speech-to-text', {
              method: 'POST',
              body: formData
            });
            const { text } = await response.json();
            setInput(prev => prev + ' ' + text);
          } catch (error) {
            console.error('Speech to text failed:', error);
          }
          
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (error) {
        console.error('Microphone access denied:', error);
      }
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      } else if (item.type === 'text/plain') {
        const text = await new Promise<string>(resolve => {
          item.getAsString(resolve);
        });
        
        // Check if it's a URL
        try {
          new URL(text);
          setInput(prev => prev + ' ' + text);
        } catch {
          // Not a URL, treat as regular text
        }
      }
    }

    if (files.length > 0) {
      setAttachments(prev => [...prev, ...files]);
    }
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleFilesSelected = async (files: FileItem[]) => {
    setSelectedFiles(files);
    
    // Extract content from selected files
    const contents: ExtractedContent[] = [];
    for (const fileItem of files) {
      try {
        // Create a mock File object for extraction
        const mockFile = new File(['mock content'], fileItem.name, {
          type: getMimeType(fileItem.extension || '')
        });
        const extracted = await contentExtractor.extractFromFile(mockFile);
        contents.push(extracted);
      } catch (error) {
        console.error('Failed to extract content from', fileItem.name, error);
      }
    }
    
    setExtractedContents(contents);
    setActiveTab('chat'); // Switch back to chat to show the processed files
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

  const handlePreviewFile = (file: FileItem) => {
    setPreviewFile(file);
    setActiveTab('preview');
  };

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Enhanced AI Workflow Assistant</h3>
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </div>
        
        <div className="flex items-center space-x-2">
          {isProcessing && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{processingStage || 'Processing...'}</span>
            </div>
          )}
          
          {(selectedFiles.length > 0 || extractedContents.length > 0) && (
            <Badge variant="secondary">
              <Files className="h-3 w-3 mr-1" />
              {selectedFiles.length + extractedContents.length} files
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'files' | 'preview')} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b">
          <TabsTrigger value="chat">
            <Bot className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="files">
            <Folder className="h-4 w-4 mr-2" />
            File Browser
          </TabsTrigger>
          {previewFile && (
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0">
          <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[70%] rounded-lg p-3",
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                )}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs opacity-80">
                        {attachment.type === 'image' ? (
                          <ImageIcon className="h-3 w-3" />
                        ) : attachment.type === 'url' ? (
                          <Link className="h-3 w-3" />
                        ) : (
                          <FileText className="h-3 w-3" />
                        )}
                        <span>{attachment.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {message.extractedContent && message.extractedContent.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <span className="text-xs font-medium">Analyzed Documents:</span>
                    {message.extractedContent.map((content, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs bg-muted/50 p-1 rounded">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {content.metadata.type}
                        </Badge>
                        <span className="opacity-70">
                          {content.workflows?.length || 0} workflows detected
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {message.generatedWorkflow && (
                  <div className="mt-3 p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Smart Generated Workflow
                      </span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => onPreviewWorkflow?.(message.generatedWorkflow)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="opacity-70">Steps:</span> {message.generatedWorkflow.steps.length}
                      </div>
                      <div>
                        <span className="opacity-70">Confidence:</span> {Math.round(message.generatedWorkflow.metadata.confidence * 100)}%
                      </div>
                      <div>
                        <span className="opacity-70">Category:</span> {message.generatedWorkflow.metadata.category}
                      </div>
                      <div>
                        <span className="opacity-70">Complexity:</span> {message.generatedWorkflow.metadata.complexity}
                      </div>
                    </div>
                  </div>
                )}

                {message.workflowPreview && !message.generatedWorkflow && (
                  <div className="mt-3 p-2 bg-background/50 rounded border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Generated Workflow</span>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => onPreviewWorkflow?.(message.workflowPreview)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs opacity-70">
                      {message.workflowPreview.nodes?.length || 0} nodes • 
                      {message.workflowPreview.connections?.length || 0} connections
                    </div>
                  </div>
                )}

                {message.status === 'error' && (
                  <AlertCircle className="h-4 w-4 mt-2" />
                )}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </ScrollArea>

          {/* Enhanced file status display */}
          {(selectedFiles.length > 0 || extractedContents.length > 0) && (
            <div className="mb-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Selected Files & Analysis</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedFiles([]);
                    setExtractedContents([]);
                  }}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="space-y-2">
                {selectedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Files className="h-3 w-3" />
                      <span>{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.extension?.toUpperCase()}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => handlePreviewFile(file)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                
                {extractedContents.map((content, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground pl-5">
                    ✓ Extracted {content.metadata.type} content
                    {content.workflows && content.workflows.length > 0 && (
                      <span> • {content.workflows.length} workflow patterns detected</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="files" className="flex-1 m-0">
          <EnhancedFileBrowser
            onFilesSelected={handleFilesSelected}
            className="h-full"
          />
        </TabsContent>

        {previewFile && (
          <TabsContent value="preview" className="flex-1 m-0 relative">
            <FilePreview
              file={previewFile}
              onClose={() => {
                setPreviewFile(null);
                setActiveTab('chat');
              }}
              onExtractContent={(content) => {
                setExtractedContents(prev => [...prev, content]);
              }}
              className="absolute inset-0"
            />
          </TabsContent>
        )}
      </Tabs>

      <div className="p-4 border-t">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachments.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
              >
                {file.type.startsWith('image/') ? (
                  <ImageIcon className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                <span>{file.name}</span>
                <button
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 border rounded-lg"
            onDrop={handleDragDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => {
                console.log('Input changed to:', e.target.value);
                setInput(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  console.log('Enter pressed, calling handleSendMessage');
                  handleSendMessage();
                }
              }}
              onPaste={handlePaste}
              placeholder="Describe your workflow or drag files here..."
              className="flex-1 bg-transparent outline-none text-sm"
              disabled={isProcessing}
            />
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.txt,.json,.csv,.pdf"
            />
            
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className={cn("h-6 w-6 p-0", isRecording && "text-red-500")}
              onClick={handleVoiceInput}
            >
              {isRecording ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            onClick={() => {
              console.log('Send button clicked');
              handleSendMessage();
            }}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
          <span>• Drag & drop files</span>
          <span>• Paste images or URLs</span>
          <span>• Voice input available</span>
        </div>
      </div>
    </Card>
  );
}