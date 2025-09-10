import React, { useEffect, useState } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';

interface DataFlowEdgeProps extends EdgeProps {
  data?: {
    label?: string;
    dataType?: string;
    dataSize?: number;
    learningMode?: boolean;
    isExecuting?: boolean;
  };
}

export function DataFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}: DataFlowEdgeProps) {
  const [showDataFlow, setShowDataFlow] = useState(false);
  const [dataPackets, setDataPackets] = useState<number[]>([]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  useEffect(() => {
    if (data?.isExecuting) {
      setShowDataFlow(true);
      // Create multiple data packets for animation
      const packets = Array.from({ length: 3 }, (_, i) => i);
      setDataPackets(packets);
    } else {
      setShowDataFlow(false);
      setDataPackets([]);
    }
  }, [data?.isExecuting]);

  return (
    <>
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
          <stop offset="50%" stopColor="#10b981" stopOpacity={0.8} />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.2} />
        </linearGradient>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: data?.learningMode ? `url(#gradient-${id})` : style.stroke,
          strokeWidth: data?.learningMode ? 3 : 2,
          filter: data?.learningMode ? 'drop-shadow(0 0 3px rgba(16, 185, 129, 0.5))' : undefined,
        }}
      />

      {/* Animated data packets */}
      <AnimatePresence>
        {showDataFlow && dataPackets.map((packet, index) => (
          <motion.g key={`packet-${id}-${index}`}>
            <motion.circle
              r="6"
              fill="#10b981"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{
                duration: 2,
                delay: index * 0.5,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={edgePath}
                begin={`${index * 0.5}s`}
              />
            </motion.circle>
            
            {/* Data packet trail */}
            <motion.circle
              r="3"
              fill="#22c55e"
              opacity={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.6, 0.6, 0] }}
              transition={{
                duration: 2,
                delay: index * 0.5 + 0.1,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <animateMotion
                dur="2s"
                repeatCount="indefinite"
                path={edgePath}
                begin={`${index * 0.5 + 0.1}s`}
              />
            </motion.circle>
          </motion.g>
        ))}
      </AnimatePresence>

      {/* Enhanced label with data info */}
      {(data?.label || data?.learningMode) && (
        <EdgeLabelRenderer>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="px-3 py-2 bg-background/95 backdrop-blur-sm border-2 rounded-lg shadow-lg"
          >
            <div className="space-y-1">
              {data.label && (
                <div className="text-xs font-medium">{data.label}</div>
              )}
              {data.learningMode && (
                <>
                  {data.dataType && (
                    <div className="text-xs text-muted-foreground">
                      Type: <span className="font-mono text-primary">{data.dataType}</span>
                    </div>
                  )}
                  {data.dataSize && (
                    <div className="text-xs text-muted-foreground">
                      Size: <span className="font-mono text-primary">{data.dataSize} bytes</span>
                    </div>
                  )}
                  {showDataFlow && (
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                      Transferring data...
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </EdgeLabelRenderer>
      )}

      {/* Connection strength indicator */}
      {data?.learningMode && (
        <g>
          <motion.rect
            x={labelX - 30}
            y={labelY - 40}
            width="60"
            height="4"
            rx="2"
            fill="#e5e7eb"
          />
          <motion.rect
            x={labelX - 30}
            y={labelY - 40}
            width="60"
            height="4"
            rx="2"
            fill="#10b981"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: showDataFlow ? 1 : 0.3 }}
            transition={{ duration: 1, ease: "easeInOut" }}
            style={{ transformOrigin: 'left center' }}
          />
        </g>
      )}
    </>
  );
}