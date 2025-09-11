import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';
import { motion } from 'framer-motion';

export function AnimatedEdge({
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
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeDasharray: 5,
        }}
      />
      {data?.animated !== false && (
        <motion.circle
          r="4"
          fill="#10b981"
          initial={{ offsetDistance: '0%' }}
          animate={{ offsetDistance: '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </motion.circle>
      )}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="px-2 py-1 bg-background border rounded-md shadow-sm"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}