'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Node, Edge } from 'reactflow';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowRight,
  Database,
  FileJson,
  Activity,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react';

interface DataFlowVisualizationProps {
  nodes: Node[];
  edges: Edge[];
  executionData?: any;
}

interface DataPacket {
  id: string;
  sourceNode: string;
  targetNode: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'transmitting' | 'received' | 'processed';
}

export function DataFlowVisualization({
  nodes,
  edges,
  executionData
}: DataFlowVisualizationProps) {
  const [dataPackets, setDataPackets] = useState<DataPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<DataPacket | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const animationFrameRef = useRef<number>();

  // Simulate data flow
  useEffect(() => {
    if (!executionData) return;

    const packets: DataPacket[] = edges.map((edge, index) => ({
      id: `packet-${index}`,
      sourceNode: edge.source,
      targetNode: edge.target,
      data: {
        input: { /* sample input data */ },
        output: { /* sample output data */ },
        metadata: {
          timestamp: Date.now(),
          size: Math.floor(Math.random() * 1000) + 100,
          type: 'json'
        }
      },
      timestamp: Date.now() + (index * 1000),
      status: 'pending'
    }));

    setDataPackets(packets);

    // Animate packet flow
    let currentPacketIndex = 0;
    const animatePackets = () => {
      if (currentPacketIndex < packets.length) {
        setDataPackets(prev => prev.map((packet, index) => {
          if (index === currentPacketIndex) {
            return { ...packet, status: 'transmitting' };
          } else if (index < currentPacketIndex) {
            return { ...packet, status: 'processed' };
          }
          return packet;
        }));
        
        currentPacketIndex++;
        animationFrameRef.current = requestAnimationFrame(() => {
          setTimeout(animatePackets, 1500);
        });
      }
    };

    animatePackets();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [edges, executionData]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getNodeLabel = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node?.data?.label || nodeId;
  };

  const getStatusColor = (status: DataPacket['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'transmitting': return 'text-yellow-500 animate-pulse';
      case 'received': return 'text-blue-500';
      case 'processed': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -300 }}
      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 max-w-md"
    >
      <Card className="shadow-xl border-2">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Data Flow Monitor</h3>
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <ScrollArea className="h-96">
                <div className="p-4 space-y-3">
                  {dataPackets.map((packet, index) => (
                    <motion.div
                      key={packet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedPacket?.id === packet.id 
                          ? 'bg-accent border-primary' 
                          : 'bg-card hover:bg-accent/50'
                      }`}
                      onClick={() => setSelectedPacket(packet)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Activity className={`h-4 w-4 ${getStatusColor(packet.status)}`} />
                          <span className="text-sm font-medium">
                            Data Packet #{index + 1}
                          </span>
                        </div>
                        <Badge 
                          variant={packet.status === 'processed' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {packet.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{getNodeLabel(packet.sourceNode)}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="truncate">{getNodeLabel(packet.targetNode)}</span>
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs">
                        <div className="flex items-center gap-1">
                          <FileJson className="h-3 w-3" />
                          <span>{packet.data.metadata?.size || 0} bytes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>{new Date(packet.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {selectedPacket?.id === packet.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t"
                        >
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Input Data</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(JSON.stringify(packet.data.input, null, 2), `${packet.id}-input`);
                                  }}
                                >
                                  {copiedId === `${packet.id}-input` ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
                                <code>{JSON.stringify(packet.data.input || {}, null, 2)}</code>
                              </pre>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">Output Data</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(JSON.stringify(packet.data.output, null, 2), `${packet.id}-output`);
                                  }}
                                >
                                  {copiedId === `${packet.id}-output` ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                              <pre className="p-2 bg-muted rounded text-xs overflow-x-auto">
                                <code>{JSON.stringify(packet.data.output || {}, null, 2)}</code>
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}

                  {dataPackets.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Database className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No data flow yet</p>
                      <p className="text-xs mt-1">Execute the workflow to see data packets</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}