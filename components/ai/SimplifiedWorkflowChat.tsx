'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bot,
  User,
  Workflow,
  ChevronRight,
  Plus,
  Settings,
  Play,
  Save,
  Download,
  Share2,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
  FileJson,
  Code,
  Copy,
  ExternalLink
} from 'lucide-react';

interface WorkflowNode {
  id: string;
  type: string;
  name: string;
  icon: string;
  config?: any;
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
    connections: { from: string; to: string }[];
  };
  code?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}

interface SimplifiedWorkflowChatProps {
  initialIdea: string;
  onWorkflowGenerated?: (workflow: any) => void;
}

export function SimplifiedWorkflowChat({ initialIdea, onWorkflowGenerated }: SimplifiedWorkflowChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial message
    if (initialIdea) {
      generateInitialWorkflow(initialIdea);
    }
  }, [initialIdea]);

  useEffect(() => {
    // Auto-scroll to bottom
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

    // Simulate API call
    setTimeout(() => {
      // Add assistant response
      addMessage({
        role: 'assistant',
        content: `I understand you want to: "${idea}". Let me create a workflow for you!`,
      });

      // Generate workflow
      setTimeout(() => {
        const workflow = {
          nodes: [
            { id: '1', type: 'trigger', name: 'Webhook Trigger', icon: '🌐' },
            { id: '2', type: 'action', name: 'Process Data', icon: '⚡' },
            { id: '3', type: 'action', name: 'Send Response', icon: '📤' },
          ],
          connections: [
            { from: '1', to: '2' },
            { from: '2', to: '3' },
          ],
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

        // Add next steps
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: 'What would you like to do next? Choose an option or tell me what you need:',
            options: [
              {
                label: 'Add more nodes',
                value: 'add_nodes',
                icon: Plus,
                description: 'Expand your workflow with additional steps',
              },
              {
                label: 'Configure triggers',
                value: 'configure_triggers',
                icon: Settings,
                description: 'Set up when your workflow should run',
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
            ],
          });
          setIsLoading(false);
        }, 1000);
      }, 1500);
    }, 1000);
  };

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleOptionClick = (option: any) => {
    addMessage({
      role: 'user',
      content: option.label,
    });

    setIsLoading(true);

    // Handle different options
    setTimeout(() => {
      switch (option.value) {
        case 'add_nodes':
          handleAddNodes();
          break;
        case 'configure_triggers':
          handleConfigureTriggers();
          break;
        case 'test':
          handleTestWorkflow();
          break;
        case 'export':
          handleExportWorkflow();
          break;
        default:
          handleGenericOption(option);
      }
    }, 500);
  };

  const handleAddNodes = () => {
    addMessage({
      role: 'assistant',
      content: 'What type of node would you like to add?',
      options: [
        {
          label: 'Data Processing',
          value: 'data_processing',
          icon: RefreshCw,
          description: 'Transform, filter, or manipulate data',
        },
        {
          label: 'External Service',
          value: 'external_service',
          icon: ExternalLink,
          description: 'Connect to APIs, databases, or services',
        },
        {
          label: 'Notification',
          value: 'notification',
          icon: AlertCircle,
          description: 'Send emails, messages, or alerts',
        },
        {
          label: 'Conditional Logic',
          value: 'conditional',
          icon: Code,
          description: 'Add if/then logic to your workflow',
        },
      ],
    });
    setIsLoading(false);
  };

  const handleConfigureTriggers = () => {
    addMessage({
      role: 'assistant',
      content: 'How should your workflow be triggered?',
      options: [
        {
          label: 'On Schedule',
          value: 'schedule',
          icon: RefreshCw,
          description: 'Run at specific times or intervals',
        },
        {
          label: 'Webhook',
          value: 'webhook',
          icon: ExternalLink,
          description: 'Trigger via HTTP request',
        },
        {
          label: 'Email Received',
          value: 'email',
          icon: AlertCircle,
          description: 'When an email arrives',
        },
        {
          label: 'Manual',
          value: 'manual',
          icon: Play,
          description: 'Run manually when needed',
        },
      ],
    });
    setIsLoading(false);
  };

  const handleTestWorkflow = () => {
    addMessage({
      role: 'assistant',
      content: 'Testing your workflow with sample data...',
      status: 'info',
    });

    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: '✅ Test completed successfully! All nodes executed without errors.',
        status: 'success',
      });

      addMessage({
        role: 'assistant',
        content: 'Test Results:',
        code: JSON.stringify({
          execution_time: '2.3s',
          nodes_executed: 3,
          status: 'success',
          sample_output: {
            data: 'processed successfully',
            timestamp: new Date().toISOString(),
          },
        }, null, 2),
      });

      setIsLoading(false);
    }, 2000);
  };

  const handleExportWorkflow = () => {
    const n8nWorkflow = {
      name: 'AI Generated Workflow',
      nodes: currentWorkflow?.nodes || [],
      connections: currentWorkflow?.connections || [],
      settings: {},
      staticData: {},
    };

    addMessage({
      role: 'assistant',
      content: 'Here\'s your workflow in n8n format. Copy this JSON and import it into n8n:',
      code: JSON.stringify(n8nWorkflow, null, 2),
    });

    addMessage({
      role: 'assistant',
      content: 'You can also:',
      options: [
        {
          label: 'Download JSON file',
          value: 'download_json',
          icon: Download,
        },
        {
          label: 'Copy to clipboard',
          value: 'copy_json',
          icon: Copy,
        },
        {
          label: 'Open in n8n',
          value: 'open_n8n',
          icon: ExternalLink,
        },
      ],
    });
    setIsLoading(false);
  };

  const handleGenericOption = (option: any) => {
    addMessage({
      role: 'assistant',
      content: `I'll help you with ${option.label}. This feature is being developed.`,
      status: 'info',
    });
    setIsLoading(false);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    addMessage({
      role: 'user',
      content: input,
    });

    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      addMessage({
        role: 'assistant',
        content: `I understand you want to: "${input}". Let me help you with that...`,
      });

      // Provide relevant options based on input
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: 'Here are some options:',
          options: [
            {
              label: 'Show me how',
              value: 'show_how',
              icon: Info,
            },
            {
              label: 'Add to workflow',
              value: 'add_to_workflow',
              icon: Plus,
            },
            {
              label: 'Learn more',
              value: 'learn_more',
              icon: ExternalLink,
            },
          ],
        });
        setIsLoading(false);
      }, 1000);
    }, 500);
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Workflow Assistant</h3>
              <p className="text-sm text-muted-foreground">
                I'll help you build your automation
              </p>
            </div>
          </div>
          <Badge variant="secondary">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              Active
            </div>
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {/* Message Header */}
              <div className="flex items-start gap-3">
                <div className={`p-1.5 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-primary/10' 
                    : 'bg-muted'
                }`}>
                  {message.role === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  {/* Message Content */}
                  <div className={`text-sm ${
                    message.status === 'error' ? 'text-red-600' :
                    message.status === 'success' ? 'text-green-600' :
                    message.status === 'warning' ? 'text-yellow-600' :
                    message.status === 'info' ? 'text-blue-600' :
                    ''
                  }`}>
                    {message.content}
                  </div>

                  {/* Workflow Visualization */}
                  {message.workflow && (
                    <Card className="p-4 bg-muted/30">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Workflow className="h-4 w-4" />
                          Workflow Structure
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {message.workflow.nodes.map((node, idx) => (
                            <div key={node.id} className="flex items-center gap-2">
                              <Badge variant="secondary" className="py-1.5">
                                <span className="mr-2">{node.icon}</span>
                                {node.name}
                              </Badge>
                              {idx < message.workflow.nodes.length - 1 && (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Code Block */}
                  {message.code && (
                    <Card className="p-4 bg-muted/30">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <FileJson className="h-4 w-4" />
                            JSON Output
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(message.code!);
                            }}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <pre className="text-xs overflow-x-auto p-3 bg-background rounded">
                          <code>{message.code}</code>
                        </pre>
                      </div>
                    </Card>
                  )}

                  {/* Options */}
                  {message.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {message.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          className="justify-start h-auto p-3"
                          onClick={() => handleOptionClick(option)}
                          disabled={isLoading}
                        >
                          <div className="flex items-start gap-3 w-full">
                            {option.icon && (
                              <option.icon className="h-4 w-4 mt-0.5 shrink-0" />
                            )}
                            <div className="text-left">
                              <div className="font-medium text-sm">
                                {option.label}
                              </div>
                              {option.description && (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {option.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="p-1.5 rounded-lg bg-muted">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI is thinking...
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      <Separator />

      {/* Input */}
      <div className="p-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask me anything about your workflow..."
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div className="flex gap-1 mt-2">
          <Button variant="ghost" size="sm" className="text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Add Node
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <Play className="h-3 w-3 mr-1" />
            Test
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <Save className="h-3 w-3 mr-1" />
            Save
          </Button>
          <Button variant="ghost" size="sm" className="text-xs">
            <Share2 className="h-3 w-3 mr-1" />
            Share
          </Button>
        </div>
      </div>
    </Card>
  );
}