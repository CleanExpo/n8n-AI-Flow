'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  X,
  ChevronRight,
  CheckCircle,
  Circle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DemoVideoService } from '@/lib/services/demo-video.service';
import { PlaceholderGenerator } from '@/lib/utils/placeholder-generator';

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  timestamp: number; // start time in seconds
  highlight?: string; // CSS selector to highlight
  action?: () => void; // Optional action to perform
}

interface DemoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoPlayer: React.FC<DemoPlayerProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [demoMode, setDemoMode] = useState<'video' | 'interactive'>('interactive');
  const [videoManifest, setVideoManifest] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressInterval = useRef<NodeJS.Timeout>();
  const demoVideoService = DemoVideoService.getInstance();

  // Demo steps that match the video timeline
  const demoSteps: DemoStep[] = [
    {
      id: 'intro',
      title: 'Welcome to n8n AI Flow',
      description: 'Create powerful automation workflows with AI assistance',
      duration: 5,
      timestamp: 0
    },
    {
      id: 'ai-chat',
      title: 'AI Workflow Generation',
      description: 'Describe your workflow in natural language and let AI create it for you',
      duration: 10,
      timestamp: 5
    },
    {
      id: 'canvas',
      title: 'Visual Workflow Builder',
      description: 'Drag and drop nodes to build complex workflows visually',
      duration: 8,
      timestamp: 15
    },
    {
      id: 'youtube',
      title: 'YouTube Animation Workflows',
      description: 'Create automated video content like AI Revolution and Julia McCoy',
      duration: 10,
      timestamp: 23
    },
    {
      id: 'configure',
      title: 'Node Configuration',
      description: 'Configure each node with powerful options and AI assistance',
      duration: 8,
      timestamp: 33
    },
    {
      id: 'export-methods',
      title: 'Export Methods',
      description: 'Multiple ways to export your workflow to n8n',
      duration: 6,
      timestamp: 41
    },
    {
      id: 'clipboard',
      title: 'Quick Copy & Paste',
      description: 'Copy workflow and paste directly into n8n canvas with Ctrl+V',
      duration: 7,
      timestamp: 47
    },
    {
      id: 'download',
      title: 'Download & Import',
      description: 'Save workflow as JSON and import through n8n menu',
      duration: 7,
      timestamp: 54
    },
    {
      id: 'n8n-import',
      title: 'Import in n8n',
      description: 'See how easy it is to import workflows into n8n',
      duration: 8,
      timestamp: 61
    },
    {
      id: 'execute',
      title: 'Execute & Monitor',
      description: 'Run your workflows and monitor execution in real-time',
      duration: 8,
      timestamp: 69
    },
    {
      id: 'complete',
      title: 'Ready to Automate!',
      description: 'Your workflow is now running in n8n, automating your tasks',
      duration: 5,
      timestamp: 77
    }
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentStep(0);
      setCurrentTime(0);
    } else {
      // Load video manifest and prepare demo
      loadDemoAssets();
    }
  }, [isOpen]);

  const loadDemoAssets = async () => {
    try {
      setIsLoading(true);
      const manifest = await demoVideoService.loadManifest();
      setVideoManifest(manifest);
      
      // Cache video for offline use if possible
      if (manifest.offline.enabled) {
        await demoVideoService.cacheVideoForOffline(manifest.videos.main.mp4);
      }
      
      // Preload chapter thumbnails
      if (manifest.chapters) {
        await demoVideoService.preloadChapterThumbnails(manifest.chapters);
      }
    } catch (error) {
      console.warn('Failed to load demo assets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && demoMode === 'interactive') {
      progressInterval.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          const currentStepData = demoSteps[currentStep];
          
          // Auto advance to next step
          if (currentStepData && next >= currentStepData.timestamp + currentStepData.duration) {
            if (currentStep < demoSteps.length - 1) {
              setCurrentStep(currentStep + 1);
            } else {
              setIsPlaying(false);
              return prev;
            }
          }
          
          return next;
        });
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [isPlaying, currentStep, demoMode]);

  const handlePlayPause = () => {
    if (demoMode === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleStepClick = (index: number) => {
    setCurrentStep(index);
    setCurrentTime(demoSteps[index].timestamp);
    if (demoMode === 'video' && videoRef.current) {
      videoRef.current.currentTime = demoSteps[index].timestamp;
    }
  };

  const handleSkipBack = () => {
    if (currentStep > 0) {
      handleStepClick(currentStep - 1);
    }
  };

  const handleSkipForward = () => {
    if (currentStep < demoSteps.length - 1) {
      handleStepClick(currentStep + 1);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && playerRef.current) {
      playerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    return demoSteps.reduce((acc, step) => acc + step.duration, 0);
  };

  const renderInteractiveDemo = () => {
    const step = demoSteps[currentStep];
    
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient" />
        </div>

        {/* Demo Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center p-8">
          {/* Step Number */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-white/20">
              {(currentStep + 1).toString().padStart(2, '0')}
            </div>
          </div>

          {/* Step Content */}
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              {step.title}
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              {step.description}
            </p>

            {/* Visual Demo */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
              {renderStepVisual(step.id)}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              {currentStep < demoSteps.length - 1 && (
                <Button
                  onClick={handleSkipForward}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Next Step
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {currentStep === demoSteps.length - 1 && (
                <Button
                  onClick={() => {
                    onClose();
                    window.location.href = '/ai-workflow';
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Start Building
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{
              width: `${((currentTime / getTotalDuration()) * 100)}%`
            }}
          />
        </div>
      </div>
    );
  };

  const renderStepVisual = (stepId: string) => {
    switch (stepId) {
      case 'intro':
        return (
          <div className="text-white">
            <div className="text-6xl mb-4">🚀</div>
            <div className="text-xl font-semibold">n8n AI Flow</div>
            <div className="text-sm opacity-80">Automation Made Simple</div>
          </div>
        );
      
      case 'ai-chat':
        return (
          <div className="bg-gray-800 rounded-lg p-4 text-left">
            <div className="text-green-400 text-sm mb-2">AI Assistant:</div>
            <div className="text-white text-sm">
              "Create a workflow that monitors RSS feeds for AI news and posts to Slack"
            </div>
            <div className="mt-3 text-blue-400 text-sm">Generating workflow...</div>
          </div>
        );
      
      case 'canvas':
        return (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-purple-600 rounded p-2 text-white text-xs">RSS Feed</div>
            <div className="bg-blue-600 rounded p-2 text-white text-xs">AI Filter</div>
            <div className="bg-green-600 rounded p-2 text-white text-xs">Slack Post</div>
          </div>
        );
      
      case 'youtube':
        return (
          <div className="flex justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">📺</div>
              <div className="text-xs text-white">AI Revolution Style</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💼</div>
              <div className="text-xs text-white">Julia McCoy Style</div>
            </div>
          </div>
        );
      
      case 'export-methods':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-600/50 rounded p-2 text-white text-xs">📋 Clipboard</div>
            <div className="bg-green-600/50 rounded p-2 text-white text-xs">💾 Download</div>
            <div className="bg-purple-600/50 rounded p-2 text-white text-xs">📱 QR Code</div>
            <div className="bg-orange-600/50 rounded p-2 text-white text-xs">📧 Email</div>
          </div>
        );
      
      case 'clipboard':
        return (
          <div className="text-white">
            <div className="bg-gray-700 rounded p-3 mb-2 text-sm font-mono">
              Workflow copied to clipboard! ✅
            </div>
            <div className="text-xs opacity-80">Press Ctrl+V in n8n canvas</div>
          </div>
        );
      
      case 'n8n-import':
        return (
          <div className="bg-gray-700 rounded p-4">
            <div className="text-green-400 text-sm mb-2">✅ Workflow Imported!</div>
            <div className="text-white text-xs">3 nodes • 2 connections • Ready to activate</div>
          </div>
        );
      
      default:
        return (
          <div className="text-white">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div
        ref={playerRef}
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            n8n AI Flow - Complete Demo Walkthrough
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDemoMode(demoMode === 'video' ? 'interactive' : 'video')}
              className="text-gray-400 hover:text-white"
            >
              {demoMode === 'video' ? 'Interactive' : 'Video'} Mode
            </Button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Video/Demo Area */}
          <div className="flex-1 relative bg-black">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            ) : demoMode === 'video' ? (
              <video
                ref={videoRef}
                className="w-full h-full"
                src={videoManifest?.videos?.main?.mp4 || "/demo-assets/demo-video.mp4"}
                poster={videoManifest?.videos?.main?.poster || "/demo-assets/demo-poster.jpg"}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={(e) => {
                  const video = e.currentTarget;
                  setCurrentTime(video.currentTime);
                  setDuration(video.duration);
                  
                  // Update current step based on video time
                  const step = demoSteps.findIndex((s, i) => {
                    const nextStep = demoSteps[i + 1];
                    return video.currentTime >= s.timestamp && 
                           (!nextStep || video.currentTime < nextStep.timestamp);
                  });
                  if (step !== -1) setCurrentStep(step);
                }}
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
                  setIsLoading(false);
                }}
                onError={() => {
                  console.warn('Video failed to load, showing fallback placeholder');
                  // Show a placeholder instead of switching modes
                }}
              >
                <source src={videoManifest?.videos?.main?.webm || "/demo-assets/demo-video.webm"} type="video/webm" />
                <source src={videoManifest?.videos?.main?.mp4 || "/demo-assets/demo-video.mp4"} type="video/mp4" />
              </video>
            ) : (
              renderInteractiveDemo()
            )}
          </div>

          {/* Steps Sidebar */}
          <div className="w-80 bg-gray-800 p-4 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-400 mb-3">Demo Steps</h3>
            <div className="space-y-2">
              {demoSteps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-blue-600/20 border border-blue-500'
                      : index < currentStep
                      ? 'bg-gray-700/50 hover:bg-gray-700'
                      : 'bg-gray-900/50 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {index < currentStep ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : index === currentStep ? (
                        <div className="h-5 w-5 rounded-full border-2 border-blue-500 bg-blue-500/20" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-white">
                        {step.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatTime(step.timestamp)} - {step.duration}s
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-4">
            {/* Play Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSkipBack}
                disabled={currentStep === 0}
                className="p-2 hover:bg-gray-800 rounded-lg text-white disabled:opacity-50"
              >
                <SkipBack className="h-5 w-5" />
              </button>
              <button
                onClick={handlePlayPause}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button
                onClick={handleSkipForward}
                disabled={currentStep === demoSteps.length - 1}
                className="p-2 hover:bg-gray-800 rounded-lg text-white disabled:opacity-50"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{
                      width: `${((currentTime / getTotalDuration()) * 100)}%`
                    }}
                  />
                </div>
                <span className="text-xs text-gray-400 w-12">
                  {formatTime(getTotalDuration())}
                </span>
              </div>
            </div>

            {/* Volume & Fullscreen */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-gray-800 rounded-lg text-white"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-800 rounded-lg text-white"
              >
                <Maximize className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};