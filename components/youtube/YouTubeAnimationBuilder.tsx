'use client';

import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  Youtube, 
  Zap, 
  BarChart3, 
  Brain,
  Palette,
  Film,
  Upload,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  aiRevolutionTemplate, 
  juliaMccoyTemplate, 
  createHybridTemplate,
  type AnimationTemplate 
} from '@/lib/youtube-animation/workflow-templates';
import { buildYouTubeAnimationWorkflow, exportWorkflowAsN8nJSON } from '@/lib/youtube-animation/n8n-nodes';
import { useWorkflowStore } from '@/lib/stores/workflow-store';
import toast from 'react-hot-toast';

export const YouTubeAnimationBuilder: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState<'ai_revolution' | 'julia_mccoy' | 'hybrid'>('ai_revolution');
  const [contentInput, setContentInput] = useState({
    headline: '',
    keyPoints: ['', '', ''],
    script: '',
    tags: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const { addNode, addEdge, reset } = useWorkflowStore();

  const templates: Record<string, AnimationTemplate> = {
    ai_revolution: aiRevolutionTemplate,
    julia_mccoy: juliaMccoyTemplate,
    hybrid: createHybridTemplate()
  };

  const styleDescriptions = {
    ai_revolution: {
      title: 'AI Revolution Style',
      description: 'Dramatic tech-focused animations with particle effects and glowing text',
      icon: <Zap className="h-5 w-5" />,
      color: 'from-cyan-500 to-blue-600',
      features: ['Particle backgrounds', 'Glowing text', 'Glitch transitions', 'Dramatic music']
    },
    julia_mccoy: {
      title: 'Julia McCoy Style', 
      description: 'Professional business presentations with clean data visualizations',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'from-blue-500 to-indigo-600',
      features: ['Clean gradients', 'Data charts', 'Professional fonts', 'Corporate music']
    },
    hybrid: {
      title: 'Hybrid Style',
      description: 'Combines dramatic visuals with professional data presentation',
      icon: <Brain className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-600',
      features: ['Mixed effects', 'Dynamic charts', 'Balanced styling', 'Versatile music']
    }
  };

  const generateWorkflow = async () => {
    setIsGenerating(true);
    try {
      // Reset the canvas
      reset();

      // Build the workflow
      const workflow = buildYouTubeAnimationWorkflow(selectedStyle);
      
      // Add nodes to canvas
      workflow.nodes.forEach((node, index) => {
        addNode({
          id: node.id,
          type: 'custom',
          position: { x: node.position[0], y: node.position[1] },
          data: {
            label: node.type.split('.').pop()?.replace(/([A-Z])/g, ' $1').trim() || 'Node',
            type: node.type,
            parameters: node.parameters,
            icon: getNodeIcon(node.type),
            description: `Configure ${node.type.split('.').pop()} settings`
          }
        });
      });

      // Add connections
      workflow.connections.forEach((conn, index) => {
        addEdge({
          id: `edge-${index}`,
          source: conn.source,
          target: conn.target,
          type: 'smoothstep',
          animated: true
        });
      });

      toast.success(`YouTube ${selectedStyle.replace('_', ' ')} workflow generated!`);
    } catch (error) {
      toast.error('Failed to generate workflow');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getNodeIcon = (nodeType: string): string => {
    const iconMap: Record<string, string> = {
      'rssMonitor': '📡',
      'contentAnalyzer': '🔍',
      'styleSelector': '🎨',
      'textGenerator': '✍️',
      'imageGenerator': '🖼️',
      'chartGenerator': '📊',
      'particleGenerator': '✨',
      'sceneComposer': '🎬',
      'videoRenderer': '🎥',
      'audioMixer': '🎵',
      'youtubePublisher': '📺',
      'socialDistributor': '🌐',
      'analyticsTracker': '📈'
    };
    
    const nodeKey = nodeType.split('.').pop() || '';
    return iconMap[nodeKey] || '⚡';
  };

  const exportWorkflow = () => {
    const workflow = buildYouTubeAnimationWorkflow(selectedStyle);
    const n8nJSON = exportWorkflowAsN8nJSON(workflow);
    
    const blob = new Blob([JSON.stringify(n8nJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-${selectedStyle}-workflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Workflow exported for n8n!');
  };

  return (
    <div className="h-full p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Youtube className="h-8 w-8 text-red-500" />
          <div>
            <h2 className="text-2xl font-bold">YouTube Animation Workflow Builder</h2>
            <p className="text-sm text-muted-foreground">
              Create automated video content like AI Revolution and Julia McCoy
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportWorkflow}>
            <Upload className="h-4 w-4 mr-2" />
            Export to n8n
          </Button>
          <Button onClick={generateWorkflow} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Generate Workflow
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="style" className="w-full">
        <TabsList>
          <TabsTrigger value="style">
            <Palette className="h-4 w-4 mr-2" />
            Style Selection
          </TabsTrigger>
          <TabsTrigger value="content">
            <Film className="h-4 w-4 mr-2" />
            Content Input
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Advanced Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(styleDescriptions).map(([key, style]) => (
              <Card 
                key={key}
                className={`cursor-pointer transition-all ${
                  selectedStyle === key ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedStyle(key as typeof selectedStyle)}
              >
                <CardHeader>
                  <div className={`h-2 w-full bg-gradient-to-r ${style.color} rounded mb-3`} />
                  <CardTitle className="flex items-center justify-between">
                    {style.title}
                    {style.icon}
                  </CardTitle>
                  <CardDescription>{style.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {style.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <span className="text-primary mr-2">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Style Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 relative overflow-hidden">
                {selectedStyle === 'ai_revolution' && (
                  <>
                    <div className="absolute inset-0 opacity-30">
                      {[...Array(50)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute h-1 w-1 bg-cyan-400 rounded-full animate-pulse"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 3}s`
                          }}
                        />
                      ))}
                    </div>
                    <div className="relative z-10 flex items-center justify-center h-full">
                      <h3 className="text-4xl font-bold text-white" style={{
                        textShadow: '0 0 20px #00ffff'
                      }}>
                        AI REVOLUTION
                      </h3>
                    </div>
                  </>
                )}
                {selectedStyle === 'julia_mccoy' && (
                  <div className="bg-white rounded-lg p-8 h-full flex items-center justify-center">
                    <div className="text-center">
                      <h3 className="text-3xl font-bold text-gray-900 mb-4">Professional Content</h3>
                      <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-16 w-16 text-blue-600" />
                      </div>
                    </div>
                  </div>
                )}
                {selectedStyle === 'hybrid' && (
                  <div className="relative h-full">
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(30)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute h-1 w-1 bg-purple-400 rounded-full animate-pulse"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`
                          }}
                        />
                      ))}
                    </div>
                    <div className="relative z-10 flex items-center justify-between h-full p-8">
                      <div className="text-white">
                        <h3 className="text-3xl font-bold mb-2">Hybrid Style</h3>
                        <p className="text-cyan-300">Best of both worlds</p>
                      </div>
                      <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                        <Brain className="h-12 w-12 text-purple-400" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Configuration</CardTitle>
              <CardDescription>
                Define the content for your automated video
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Headline</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="Breaking: Major AI Breakthrough..."
                  value={contentInput.headline}
                  onChange={(e) => setContentInput({...contentInput, headline: e.target.value})}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Key Points</label>
                {contentInput.keyPoints.map((point, index) => (
                  <input
                    key={index}
                    type="text"
                    className="w-full mt-2 px-3 py-2 border rounded-md"
                    placeholder={`Key point ${index + 1}`}
                    value={point}
                    onChange={(e) => {
                      const newPoints = [...contentInput.keyPoints];
                      newPoints[index] = e.target.value;
                      setContentInput({...contentInput, keyPoints: newPoints});
                    }}
                  />
                ))}
              </div>

              <div>
                <label className="text-sm font-medium">Script/Narration</label>
                <textarea
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  rows={4}
                  placeholder="Enter the main script or narration text..."
                  value={contentInput.script}
                  onChange={(e) => setContentInput({...contentInput, script: e.target.value})}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  placeholder="AI, Technology, Breaking News"
                  value={contentInput.tags}
                  onChange={(e) => setContentInput({...contentInput, tags: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Video Duration</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>Auto (based on content)</option>
                    <option>5 minutes</option>
                    <option>10 minutes</option>
                    <option>15 minutes</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Resolution</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>1080p (Full HD)</option>
                    <option>720p (HD)</option>
                    <option>4K (Ultra HD)</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Voice Style</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>Authoritative</option>
                    <option>Conversational</option>
                    <option>Educational</option>
                    <option>Dramatic</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Background Music</label>
                  <select className="w-full mt-1 px-3 py-2 border rounded-md">
                    <option>Dramatic Tech</option>
                    <option>Corporate</option>
                    <option>Ambient Electronic</option>
                    <option>None</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Auto-generate thumbnail
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" defaultChecked />
                  Add captions
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  Schedule publishing
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};