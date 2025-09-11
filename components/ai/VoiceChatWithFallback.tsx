'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Loader2,
  MessageSquare,
  Headphones,
  Activity,
  AlertCircle,
  Shield,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import 'regenerator-runtime/runtime';

interface VoiceChatProps {
  onTranscript?: (text: string) => void;
  onVoiceCommand?: (command: string) => void;
  aiResponse?: string;
  isProcessing?: boolean;
}

export function VoiceChatWithFallback({ 
  onTranscript, 
  onVoiceCommand,
  aiResponse,
  isProcessing = false
}: VoiceChatProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [showPermissionError, setShowPermissionError] = useState(false);
  const [isHttps, setIsHttps] = useState(true);
  const [browserSupported, setBrowserSupported] = useState(true);
  
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
  } = useSpeechRecognition({
    commands: [
      {
        command: ['create workflow', 'build workflow', 'make workflow'],
        callback: () => onVoiceCommand?.('create_workflow'),
        matchInterim: true
      },
      {
        command: ['help', 'what can you do'],
        callback: () => onVoiceCommand?.('help'),
        matchInterim: true
      },
      {
        command: ['stop', 'cancel', 'stop listening'],
        callback: () => stopListening(),
        matchInterim: true
      }
    ]
  });

  // Check environment on mount
  useEffect(() => {
    // Check if we're on HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    setIsHttps(isSecure);
    
    // Check browser support
    setBrowserSupported(browserSupportsSpeechRecognition);
    
    // Check for microphone permission issues
    if (!isSecure && browserSupportsSpeechRecognition) {
      setShowPermissionError(true);
    }
  }, [browserSupportsSpeechRecognition]);

  // Update status based on listening state
  useEffect(() => {
    if (listening) {
      setStatus('listening');
    } else if (isProcessing) {
      setStatus('processing');
    } else if (isSpeaking) {
      setStatus('speaking');
    } else {
      setStatus('idle');
    }
  }, [listening, isProcessing, isSpeaking]);

  // Send transcript when it changes
  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Start listening
  const startListening = async () => {
    try {
      // Reset transcript before starting
      resetTranscript();
      
      // Use continuous listening
      await SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US'
      });
      
      // Simulate audio level animation
      const interval = setInterval(() => {
        setAudioLevel(Math.random());
      }, 100);
      
      // Store interval ID for cleanup
      (window as any).audioLevelInterval = interval;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setShowPermissionError(true);
    }
  };

  // Stop listening
  const stopListening = () => {
    SpeechRecognition.stopListening();
    
    // Clear audio level animation
    if ((window as any).audioLevelInterval) {
      clearInterval((window as any).audioLevelInterval);
      delete (window as any).audioLevelInterval;
    }
    setAudioLevel(0);
  };

  // Text-to-speech for AI responses
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !text || typeof window === 'undefined') return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Use a more natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') || 
      voice.name.includes('Microsoft') ||
      voice.name.includes('Natural')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('speaking');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus('idle');
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      setStatus('idle');
    };
    
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  // Speak AI responses
  useEffect(() => {
    if (aiResponse && voiceEnabled) {
      // Clean the response for better speech
      const cleanedResponse = aiResponse
        .replace(/[*_]/g, '') // Remove markdown formatting
        .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
        .replace(/\n{2,}/g, '. ') // Replace multiple newlines with periods
        .replace(/[#]+/g, ''); // Remove headers
      
      speak(cleanedResponse);
    }
  }, [aiResponse, speak, voiceEnabled]);

  // Toggle voice output
  const toggleVoice = () => {
    setVoiceEnabled(!voiceEnabled);
    if (!voiceEnabled) {
      window.speechSynthesis.cancel();
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setStatus('idle');
  };

  // Show error states
  if (!browserSupported) {
    return (
      <Card className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!isHttps) {
    return (
      <Card className="p-4">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Voice features require a secure connection (HTTPS). They will work when deployed to production.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!isMicrophoneAvailable && listening) {
    return (
      <Card className="p-4">
        <Alert>
          <Mic className="h-4 w-4" />
          <AlertDescription>
            Microphone access is required for voice input. Please allow microphone access in your browser settings.
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              status === 'listening' ? "bg-red-100 text-red-600" :
              status === 'speaking' ? "bg-blue-100 text-blue-600" :
              status === 'processing' ? "bg-yellow-100 text-yellow-600" :
              "bg-gray-100 text-gray-600"
            )}>
              {status === 'listening' ? <Mic className="h-4 w-4" /> :
               status === 'speaking' ? <Volume2 className="h-4 w-4" /> :
               status === 'processing' ? <Loader2 className="h-4 w-4 animate-spin" /> :
               <Headphones className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold">Voice Assistant</h3>
              <p className="text-xs text-muted-foreground">
                {status === 'listening' ? "Listening..." :
                 status === 'speaking' ? "Speaking..." :
                 status === 'processing' ? "Processing..." :
                 "Click mic to start talking"}
              </p>
            </div>
          </div>
          
          <Badge variant={status !== 'idle' ? "default" : "secondary"}>
            {status === 'idle' ? 'Ready' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {/* Permission Error Alert */}
        {showPermissionError && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please allow microphone access to use voice features. Click the microphone button and grant permission when prompted.
            </AlertDescription>
          </Alert>
        )}

        {/* Audio Visualizer */}
        <div className="relative h-20 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg overflow-hidden">
          <AnimatePresence>
            {listening && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-1 bg-primary rounded-full"
                    animate={{
                      height: listening ? 
                        `${Math.max(10, audioLevel * 100 * (1 + Math.sin(Date.now() / 100 + i) * 0.3))}%` : 
                        '10%'
                    }}
                    transition={{ duration: 0.1 }}
                  />
                ))}
              </motion.div>
            )}
            
            {isSpeaking && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 bg-blue-500 rounded-full"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Status indicator */}
          <div className="absolute top-2 right-2">
            <Activity className={cn(
              "h-4 w-4 transition-colors",
              status !== 'idle' ? "text-primary animate-pulse" : "text-gray-400"
            )} />
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">{transcript}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={listening ? stopListening : startListening}
            variant={listening ? "destructive" : "default"}
            size="lg"
            className="flex-1"
            disabled={!browserSupported || !isHttps}
          >
            {listening ? (
              <>
                <MicOff className="h-5 w-5 mr-2" />
                Stop Listening
              </>
            ) : (
              <>
                <Mic className="h-5 w-5 mr-2" />
                Start Talking
              </>
            )}
          </Button>
          
          <Button
            onClick={toggleVoice}
            variant="outline"
            size="lg"
            className="px-4"
          >
            {voiceEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
          
          {isSpeaking && (
            <Button
              onClick={stopSpeaking}
              variant="outline"
              size="lg"
              className="px-4"
            >
              <VolumeX className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Voice Commands Help */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Voice Commands:</p>
          <ul className="ml-4 space-y-0.5">
            <li>• Say "Create workflow" to start building</li>
            <li>• Say "Help" for assistance</li>
            <li>• Say "Stop" to stop listening</li>
            <li>• Describe your automation naturally</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}