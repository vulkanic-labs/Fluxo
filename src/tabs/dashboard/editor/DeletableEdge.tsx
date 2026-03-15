import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';
import { X } from 'lucide-react';

export function DeletableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges((edges) => edges.filter((edge) => edge.id !== id));
  };

  return (
    <g 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
      className="group"
    >
      {/* Invisible hit area (thicker path for easier hovering) */}
      <BaseEdge 
        path={edgePath} 
        style={{ strokeWidth: 20, stroke: 'transparent' }} 
      />
      
      {/* Visual edge path */}
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{ 
          ...style, 
          stroke: (isHovered || selected) ? '#f59e0b' : (style.stroke || '#94a3b8'),
          transition: 'stroke 0.2s ease',
          strokeWidth: (isHovered || selected) ? 3 : 2
        }} 
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className={`
              w-6 h-6 bg-white dark:bg-gray-800 border-2 rounded-full flex items-center justify-center 
              shadow-lg transition-all duration-200 hover:scale-110
              ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-2 pointer-events-none'}
              ${selected ? 'border-amber-500 text-amber-600' : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-red-500 hover:border-red-500'}
            `}
            onClick={onEdgeDelete}
            title="Remove connection"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </g>
  );
}
