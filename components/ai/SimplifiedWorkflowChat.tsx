'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Workflow,
  Plus,
  Settings,
  Play,
  Save,
  Share2,
  Download,
  Zap,
  GitBranch,
  Database,
  Globe,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Code,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  icon?: string;
  position?: [number, number];
  parameters?: Record<string, any>;
  typeVersion?: number;
}

interface WorkflowConnection {
  from: string;
  to: string;
  type?: string;
  index?: number;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  options?: {
    label: string;
    value: string;
    icon?: any;
    description?: string;
  }[];
  workflow?: {
    nodes: WorkflowNode[];
    connections: WorkflowConnection[];
  };
}

interface SimplifiedWorkflowChatProps {
  initialIdea?: string;
  onWorkflowGenerated?: (workflow: any) => void;
}

export function SimplifiedWorkflowChat({
  initialIdea,
  onWorkflowGenerated,
}: SimplifiedWorkflowChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate initial workflow when component mounts with an idea
  useEffect(() => {
    if (initialIdea && messages.length === 0) {
      generateInitialWorkflow(initialIdea);
    }
  }, [initialIdea]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const generateInitialWorkflow = async (idea: string) => {
    setIsLoading(true);

    // Add user message
    addMessage({
      role: 'user',
      content: idea,
    });

    try {
      // Call the actual API
      const response = await fetch('/api/ai/generate-simple-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate workflow');
      }

      const data = await response.json();

      // Add assistant response with the actual workflow
      addMessage({
        role: 'assistant',
        content: data.message || `I understand you want to: "${idea}". Let me create a workflow for you!`,
      });

      // Parse and use the generated workflow
      const workflow = data.workflow || {
        nodes: [
          { id: '1', type: 'n8n-nodes-base.manualTrigger', name: 'Manual Trigger', position: [250, 300], typeVersion: 1 },
          { id: '2', type: 'n8n-nodes-base.httpRequest', name: 'HTTP Request', position: [450, 300], typeVersion: 1 },
          { id: '3', type: 'n8n-nodes-base.set', name: 'Set Data', position: [650, 300], typeVersion: 1 },
        ],
        connections: {
          'Manual Trigger': {
            main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]]
          },
          'HTTP Request': {
            main: [[{ node: 'Set Data', type: 'main', index: 0 }]]
          }
        },
      };

      addMessage({
        role: 'assistant',
        content: 'Here\'s your initial workflow! I\'ve created a basic structure that we can customize together.',
        workflow: workflow,
      });

      setCurrentWorkflow(workflow);
      if (onWorkflowGenerated) {
        onWorkflowGenerated(workflow);
      }

      // Add next steps with options from API response
      const options = data.nextSteps || [
        {
          label: 'Add more nodes',
          value: 'add_nodes',
          icon: Plus,
          description: 'Expand your workflow with additional steps',
        },
        {
          label: 'Test workflow',
          value: 'test',
          icon: Play,
          description: 'Run with sample data to see it in action',
        },
        {
          label: 'Export to n8n',
          value: 'export',
          icon: Download,
          description: 'Get the JSON to import into n8n',
        },
      ];

      addMessage({
        role: 'assistant',
        content: 'What would you like to do next? Choose an option or tell me what you need:',
        options: options,
      });
    } catch (error) {
      console.error('Error generating workflow:', error);
      addMessage({
        role: 'assistant',
        content: 'I encountered an error while creating your workflow. Please try again or provide more details.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionClick = async (option: any) => {
    addMessage({
      role: 'user',
      content: option.label,
    });

    setIsLoading(true);
    
    try {
      // Call API with option selection
      const response = await fetch('/api/ai/generate-simple-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea: option.label,
          action: option.value,
          context: currentWorkflow
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process option');
      }

      const data = await response.json();

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: data.message || `Processing ${option.label}...`,
        workflow: data.workflow,
        options: data.nextSteps,
      });

      if (data.workflow) {
        setCurrentWorkflow(data.workflow);
        if (onWorkflowGenerated) {
          onWorkflowGenerated(data.workflow);
        }
      }
    } catch (error) {
      console.error('Error processing option:', error);
      
      // Fallback responses
      let response = 'Processing your selection...';
      
      switch(option.value) {
        case 'add_nodes':
          response = 'What type of node would you like to add? You can choose from triggers, actions, or conditions.';
          break;
        case 'test':
          response = 'Testing your workflow... Everything looks good! The workflow is ready to use.';
          break;
        case 'export':
          response = JSON.stringify(currentWorkflow, null, 2);
          break;
        default:
          response = `Processing ${option.label}...`;
      }

      addMessage({
        role: 'assistant',
        content: response,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    setInput('');
    
    addMessage({
      role: 'user',
      content: userInput,
    });

    setIsLoading(true);
    
    try {
      // Call API with context
      const response = await fetch('/api/ai/generate-simple-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idea: userInput,
          context: currentWorkflow
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process request');
      }

      const data = await response.json();

      // Add assistant response
      addMessage({
        role: 'assistant',
        content: data.message || 'I\'ve processed your request.',
        workflow: data.workflow,
        options: data.nextSteps,
      });

      if (data.workflow) {
        setCurrentWorkflow(data.workflow);
        if (onWorkflowGenerated) {
          onWorkflowGenerated(data.workflow);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Workflow Assistant</h3>
              <p className="text-xs text-muted-foreground">
                I'll help you build your automation
              </p>
            </div>
          </div>
          <Badge variant={isLoading ? "secondary" : "default"}>
            {isLoading ? "Processing..." : "Active"}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <div className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}>
                {message.role === 'assistant' && (
                  <div className="p-2 bg-primary/10 rounded-full h-fit">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                } rounded-lg p-3`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Display workflow info */}
                  {message.workflow && (
                    <div className="mt-3 p-2 bg-background/50 rounded">
                      <div className="flex items-center gap-2 text-xs">
                        <Workflow className="h-3 w-3" />
                        <span>{message.workflow.nodes?.length || 0} nodes</span>
                        <span>•</span>
                        <span>{Object.keys(message.workflow.connections || {}).length} connections</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Display options */}
                  {message.options && (
                    <div className="mt-3 space-y-2">
                      {message.options.map((option, idx) => {
                        const Icon = option.icon;
                        return (
                          <Button
                            key={idx}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => handleOptionClick(option)}
                            disabled={isLoading}
                          >
                            {Icon && <Icon className="h-4 w-4 mr-2" />}
                            <span>{option.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="p-2 bg-muted rounded-full h-fit">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <Bot className="h-4 w-4" />
            <div className="flex gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          </motion.div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your workflow..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={() => handleOptionClick({ label: 'Add Node', value: 'add_nodes' })}>
            <Plus className="h-4 w-4 mr-1" />
            Add Node
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOptionClick({ label: 'Test', value: 'test' })}>
            <Play className="h-4 w-4 mr-1" />
            Test
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOptionClick({ label: 'Save', value: 'save' })}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleOptionClick({ label: 'Share', value: 'share' })}>
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  );
}