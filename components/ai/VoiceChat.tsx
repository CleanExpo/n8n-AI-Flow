'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Zap,
  Bot,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface VoiceChatProps {
  onTranscript?: (text: string) => void;
  onVoiceCommand?: (command: string) => void;
  aiResponse?: string;
  isProcessing?: boolean;
}

export function VoiceChat({ 
  onTranscript, 
  onVoiceCommand,
  aiResponse,
  isProcessing = false
}: VoiceChatProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setStatus('listening');
        setTranscript('');
        setInterimTranscript('');
      };
      
      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        
        if (final) {
          setTranscript(prev => prev + final);
          if (onTranscript) {
            onTranscript(final.trim());
          }
          
          // Check for voice commands
          const command = final.toLowerCase().trim();
          if (command.includes('create workflow') || 
              command.includes('build workflow') ||
              command.includes('make workflow')) {
            if (onVoiceCommand) {
              onVoiceCommand('create_workflow');
            }
          } else if (command.includes('help') || command.includes('what can you do')) {
            if (onVoiceCommand) {
              onVoiceCommand('help');
            }
          } else if (command.includes('stop') || command.includes('cancel')) {
            stopListening();
          }
        }
        
        setInterimTranscript(interim);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setStatus('idle');
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setStatus('idle');
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onVoiceCommand]);

  // Initialize audio context for visualization
  const initAudioContext = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      // Start visualization
      visualizeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    setAudioLevel(average / 255);
    
    animationFrameRef.current = requestAnimationFrame(visualizeAudio);
  };

  // Start listening
  const startListening = async () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
      await initAudioContext();
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Clean up audio context
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Text-to-speech for AI responses
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !text) return;
    
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
    
    synthRef.current = utterance;
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

        {/* Audio Visualizer */}
        <div className="relative h-20 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg overflow-hidden">
          <AnimatePresence>
            {isListening && (
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
                      height: isListening ? 
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
        {(transcript || interimTranscript) && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm">
                  {transcript}
                  {interimTranscript && (
                    <span className="text-muted-foreground italic">{interimTranscript}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          <Button
            onClick={isListening ? stopListening : startListening}
            variant={isListening ? "destructive" : "default"}
            size="lg"
            className="flex-1"
          >
            {isListening ? (
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