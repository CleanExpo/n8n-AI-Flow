'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  FileText,
  Mic,
  Upload,
  Zap,
  MessageSquare,
  Image as ImageIcon,
  Code,
  Database,
  Mail,
  Calendar,
  Globe,
  Check,
  ArrowRight,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: () => void;
  highlight?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ReactNode;
}

interface DemoScenario {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  tags: string[];
  prompt: string;
  expectedNodes: string[];
  sampleFile?: {
    name: string;
    content: string;
    type: string;
  };
}

interface DemoModeProps {
  onSelectScenario?: (scenario: DemoScenario) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

const demoScenarios: DemoScenario[] = [
  {
    id: 'email-to-slack',
    title: 'Email to Slack Notifications',
    description: 'Automatically forward important emails to a Slack channel',
    icon: <Mail className="h-5 w-5" />,
    category: 'Communication',
    difficulty: 'beginner',
    estimatedTime: '2 min',
    tags: ['email', 'slack', 'notification'],
    prompt: 'Create a workflow that monitors my Gmail inbox for emails with "urgent" in the subject and sends them to a Slack channel #alerts',
    expectedNodes: ['Gmail Trigger', 'Filter', 'Slack']
  },
  {
    id: 'csv-to-database',
    title: 'CSV Data Import',
    description: 'Process CSV files and import data into a database',
    icon: <Database className="h-5 w-5" />,
    category: 'Data Processing',
    difficulty: 'intermediate',
    estimatedTime: '3 min',
    tags: ['csv', 'database', 'etl'],
    prompt: 'Build a workflow that reads a CSV file with customer data and inserts it into a PostgreSQL database after validating email addresses',
    expectedNodes: ['File Trigger', 'Spreadsheet File', 'Function', 'Postgres'],
    sampleFile: {
      name: 'customers.csv',
      content: 'name,email,company\nJohn Doe,john@example.com,Acme Corp\nJane Smith,jane@example.com,Tech Inc',
      type: 'text/csv'
    }
  },
  {
    id: 'api-integration',
    title: 'API Data Sync',
    description: 'Sync data between multiple APIs and transform it',
    icon: <Globe className="h-5 w-5" />,
    category: 'Integration',
    difficulty: 'advanced',
    estimatedTime: '5 min',
    tags: ['api', 'webhook', 'transform'],
    prompt: 'Create a workflow that receives webhook data, transforms it, calls an external API for enrichment, and stores the result in Google Sheets',
    expectedNodes: ['Webhook', 'Function', 'HTTP Request', 'Google Sheets']
  },
  {
    id: 'scheduled-report',
    title: 'Scheduled Reports',
    description: 'Generate and send reports on a schedule',
    icon: <Calendar className="h-5 w-5" />,
    category: 'Automation',
    difficulty: 'beginner',
    estimatedTime: '2 min',
    tags: ['schedule', 'report', 'email'],
    prompt: 'Set up a daily report that queries sales data from a database and emails it to the team at 9 AM every weekday',
    expectedNodes: ['Schedule Trigger', 'Database', 'Function', 'Email Send']
  },
  {
    id: 'image-processing',
    title: 'Image OCR Workflow',
    description: 'Extract text from images and process it',
    icon: <ImageIcon className="h-5 w-5" />,
    category: 'AI Processing',
    difficulty: 'intermediate',
    estimatedTime: '4 min',
    tags: ['ocr', 'image', 'ai'],
    prompt: 'Build a workflow that processes uploaded images, extracts text using OCR, and creates tasks in a project management tool',
    expectedNodes: ['File Trigger', 'OCR', 'Function', 'Asana/Trello']
  },
  {
    id: 'voice-automation',
    title: 'Voice Command Automation',
    description: 'Process voice commands to trigger actions',
    icon: <Mic className="h-5 w-5" />,
    category: 'AI Processing',
    difficulty: 'advanced',
    estimatedTime: '5 min',
    tags: ['voice', 'ai', 'automation'],
    prompt: 'Create a workflow that accepts voice recordings, converts them to text, understands the intent, and executes appropriate actions',
    expectedNodes: ['Webhook', 'Speech-to-Text', 'AI Intent', 'Switch', 'Multiple Actions']
  },
  {
    id: 'social-media',
    title: 'Social Media Automation',
    description: 'Cross-post content across multiple platforms',
    icon: <MessageSquare className="h-5 w-5" />,
    category: 'Marketing',
    difficulty: 'intermediate',
    estimatedTime: '3 min',
    tags: ['social', 'marketing', 'content'],
    prompt: 'Automate posting blog updates to Twitter, LinkedIn, and Facebook with customized messages for each platform',
    expectedNodes: ['RSS Feed', 'Function', 'Twitter', 'LinkedIn', 'Facebook']
  },
  {
    id: 'code-deployment',
    title: 'Code Review & Deploy',
    description: 'Automate code review and deployment pipeline',
    icon: <Code className="h-5 w-5" />,
    category: 'DevOps',
    difficulty: 'advanced',
    estimatedTime: '6 min',
    tags: ['github', 'ci/cd', 'deployment'],
    prompt: 'Set up a workflow that triggers on GitHub pull requests, runs tests, posts results to Slack, and deploys to staging if tests pass',
    expectedNodes: ['GitHub Trigger', 'Execute Command', 'If', 'Slack', 'SSH']
  }
];

const tourSteps: DemoStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to n8n AI Flow!',
    description: 'Let me show you how to create powerful automation workflows using AI. This tour will walk you through the key features.',
    action: () => console.log('Welcome'),
    icon: <Sparkles className="h-5 w-5" />
  },
  {
    id: 'chat-input',
    title: 'Natural Language Input',
    description: 'Simply describe what you want to automate in plain English. Our AI understands your intent and generates the workflow.',
    action: () => document.getElementById('chat-input')?.focus(),
    highlight: 'chat-input',
    position: 'top',
    icon: <MessageSquare className="h-5 w-5" />
  },
  {
    id: 'voice-input',
    title: 'Voice Commands',
    description: 'Click the microphone to speak your automation needs. Perfect for complex workflows you want to describe verbally.',
    action: () => document.getElementById('voice-button')?.click(),
    highlight: 'voice-button',
    position: 'bottom',
    icon: <Mic className="h-5 w-5" />
  },
  {
    id: 'file-upload',
    title: 'Document Processing',
    description: 'Upload documents, spreadsheets, or images. The AI analyzes them and suggests relevant automation workflows.',
    action: () => document.getElementById('file-upload')?.click(),
    highlight: 'file-upload',
    position: 'bottom',
    icon: <Upload className="h-5 w-5" />
  },
  {
    id: 'workflow-canvas',
    title: 'Visual Workflow Builder',
    description: 'See your workflow come to life! Drag, drop, and connect nodes to customize the generated workflow.',
    action: () => console.log('Canvas'),
    highlight: 'workflow-canvas',
    position: 'left',
    icon: <Zap className="h-5 w-5" />
  },
  {
    id: 'test-deploy',
    title: 'Test & Deploy',
    description: 'Test your workflow with sample data and deploy it to n8n with one click when ready.',
    action: () => console.log('Deploy'),
    highlight: 'deploy-button',
    position: 'top',
    icon: <Check className="h-5 w-5" />
  }
];

export function DemoMode({ onSelectScenario, onClose, isOpen = true }: DemoModeProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTour, setShowTour] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const categories = ['all', ...new Set(demoScenarios.map(s => s.category))];

  const filteredScenarios = demoScenarios.filter(scenario => 
    selectedCategory === 'all' || scenario.category === selectedCategory
  );

  const handleSelectScenario = (scenario: DemoScenario) => {
    // Simulate loading the scenario
    if (onSelectScenario) {
      onSelectScenario(scenario);
    }
    
    // Auto-fill the chat input with the prompt
    const chatInput = document.querySelector('textarea[placeholder*="Describe"]') as HTMLTextAreaElement;
    if (chatInput) {
      chatInput.value = scenario.prompt;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // If there's a sample file, simulate file upload
    if (scenario.sampleFile) {
      const file = new File(
        [scenario.sampleFile.content],
        scenario.sampleFile.name,
        { type: scenario.sampleFile.type }
      );
      
      // Trigger file upload event
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const startTour = () => {
    setShowTour(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    tourSteps[0].action();
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, tourSteps[currentStep].id]));
      setCurrentStep(currentStep + 1);
      tourSteps[currentStep + 1].action();
    } else {
      endTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      tourSteps[currentStep - 1].action();
    }
  };

  const endTour = () => {
    setShowTour(false);
    setCurrentStep(0);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Demo Panel */}
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-4 md:inset-8 flex items-center justify-center">
          <Card className="w-full max-w-6xl max-h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Workflow Demo Center</h2>
                  <p className="text-sm text-muted-foreground">
                    Choose a scenario or take the guided tour
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={startTour}
                  className="gap-2"
                >
                  <Play className="h-4 w-4" />
                  Start Tour
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 p-4 border-b overflow-x-auto">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category === 'all' ? 'All Scenarios' : category}
                </Button>
              ))}
            </div>

            {/* Scenarios Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredScenarios.map(scenario => (
                  <Card
                    key={scenario.id}
                    className="p-4 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleSelectScenario(scenario)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg shrink-0",
                        scenario.difficulty === 'beginner' && "bg-green-100 text-green-600",
                        scenario.difficulty === 'intermediate' && "bg-yellow-100 text-yellow-600",
                        scenario.difficulty === 'advanced' && "bg-red-100 text-red-600"
                      )}>
                        {scenario.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary">
                          {scenario.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {scenario.description}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {scenario.difficulty}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {scenario.estimatedTime}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {scenario.tags.map(tag => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs px-1 py-0"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Quick Start Tips */}
            <div className="p-4 border-t bg-muted/50">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-muted-foreground">Beginner friendly</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-muted-foreground">Some experience needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-muted-foreground">Advanced users</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Guided Tour Overlay */}
      {showTour && (
        <div className="fixed inset-0 z-[60] pointer-events-none">
          {/* Highlight overlay */}
          {tourSteps[currentStep].highlight && (
            <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={endTour}>
              <div 
                className="spotlight"
                data-highlight={tourSteps[currentStep].highlight}
              />
            </div>
          )}

          {/* Tour tooltip */}
          <div 
            className={cn(
              "absolute bg-background border rounded-lg shadow-xl p-4 max-w-sm pointer-events-auto",
              tourSteps[currentStep].position === 'top' && "bottom-full mb-2",
              tourSteps[currentStep].position === 'bottom' && "top-full mt-2",
              tourSteps[currentStep].position === 'left' && "right-full mr-2",
              tourSteps[currentStep].position === 'right' && "left-full ml-2",
              !tourSteps[currentStep].position && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          >
            <div className="flex items-start gap-3 mb-3">
              {tourSteps[currentStep].icon}
              <div>
                <h4 className="font-semibold mb-1">
                  {tourSteps[currentStep].title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {tourSteps[currentStep].description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-colors",
                      index === currentStep && "bg-primary w-3",
                      index < currentStep && "bg-primary/50",
                      index > currentStep && "bg-muted-foreground/30"
                    )}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {currentStep > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={prevStep}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={nextStep}
                >
                  {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
                  {currentStep < tourSteps.length - 1 && (
                    <ChevronRight className="h-4 w-4 ml-1" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={endTour}
                >
                  Skip
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spotlight {
          position: absolute;
          border: 2px solid var(--primary);
          border-radius: 8px;
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 20px var(--primary);
          }
          100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </>
  );
}