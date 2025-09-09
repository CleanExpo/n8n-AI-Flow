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
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
      content: "Hello! I'm your AI Workflow Assistant. I can help you create n8n workflows from your ideas, images, documents, or URLs. Just describe what you want to automate, and I'll build it for you!",
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      attachments: await processAttachments(attachments),
      timestamp: new Date(),
      status: 'sending'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachments([]);
    setIsProcessing(true);

    // Call AI generation API
    try {
      const response = await fetch('/api/ai/generate-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          attachments: userMessage.attachments,
          context: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data = await response.json();

      const aiResponse: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.explanation || 'I\'ve generated a workflow based on your requirements.',
        workflowPreview: data.workflow,
        timestamp: new Date(),
        status: 'complete'
      };

      setMessages(prev => [...prev, aiResponse]);
      
      if (data.workflow && onWorkflowGenerated) {
        onWorkflowGenerated(data.workflow);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I encountered an error while generating your workflow. Please try again.',
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
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

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Workflow Assistant</h3>
          <Sparkles className="h-4 w-4 text-yellow-500" />
        </div>
        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating workflow...</span>
          </div>
        )}
      </div>

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

                {message.workflowPreview && (
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
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
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
            onClick={handleSendMessage}
            disabled={isProcessing || (!input.trim() && attachments.length === 0)}
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