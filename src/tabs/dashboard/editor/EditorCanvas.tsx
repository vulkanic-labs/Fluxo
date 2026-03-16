import React, { useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import { useTheme } from "~context/ThemeContext";
import { BaseNode } from "../nodes/BaseNode";
import { BLOCK_DEFINITIONS } from "./data/blocks";
import { DeletableEdge } from "./DeletableEdge";
import { EditorActionsContext, type EditorActions } from "./EditorActionsContext";

// Node types declared OUTSIDE component to prevent React Flow from re-rendering all nodes
const nodeTypes = { fluxoBlock: BaseNode };
const edgeTypes = { deletable: DeletableEdge };

export interface EditorCanvasRef {
  getState: () => { nodes: Node[]; edges: Edge[] };
  updateNodeData: (nodeId: string, data: Record<string, any>) => void;
}

interface EditorCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (params: Connection | Edge) => void;
  onReconnect?: (oldEdge: Edge, newConnection: Connection) => void;
  actions: EditorActions;
  canvasRef?: React.MutableRefObject<EditorCanvasRef>;
  onDataChanged?: () => void;
}

export function EditorCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  actions,
  canvasRef,
  onDataChanged,
}: EditorCanvasProps) {
  const { theme } = useTheme();
  const { screenToFlowPosition } = useReactFlow();
  const edgeReconnectSuccessful = React.useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const handleReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    edgeReconnectSuccessful.current = true;
    onReconnect?.(oldEdge, newConnection);
  }, [onReconnect]);

  const onReconnectEnd = useCallback((_: any, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      onEdgesChange([{ id: edge.id, type: "remove" }]);
    }
    edgeReconnectSuccessful.current = true;
  }, [onEdgesChange]);

  // Expose current state and update methods via ref
  if (canvasRef) {
    canvasRef.current = { 
      getState: () => ({ nodes, edges }),
      updateNodeData: (nodeId, data) => {
        // This is now handled by the parent via handleUpdateNodeData
        // but we keep the ref interface for compatibility with existing sidebar drag logic if any
      }
    };
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const blockDef = BLOCK_DEFINITIONS[type];
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: "fluxoBlock",
        position,
        data: { label: type, ...(blockDef?.data || {}) },
      };

      // Trigger change in parent
      onNodesChange([{ type: "add", item: newNode }]);
      onDataChanged?.();
    },
    [screenToFlowPosition, onNodesChange, onDataChanged]
  );

  return (
    <EditorActionsContext.Provider value={actions}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onReconnect={handleReconnect}
        onReconnectStart={onReconnectStart}
        onReconnectEnd={onReconnectEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={theme}
        fitView
        snapToGrid
        snapGrid={[12, 12]}
        defaultEdgeOptions={{ 
          type: "deletable", 
          animated: false,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
          reconnectable: true,
          selectable: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color={theme === "dark" ? "#334155" : "#e5e7eb"} 
          gap={24} 
          size={1} 
          style={{ background: theme === "dark" ? "#0f172a" : "#f8fafc" }} 
        />
        <Controls
          showInteractive
          className="!bg-white dark:!bg-slate-900 !border-gray-200 dark:!border-slate-800 !shadow-lg !rounded-xl overflow-hidden"
          style={{ 
            fill: theme === "dark" ? "#94a3b8" : "#64748b",
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const colors: Record<string, string> = {
              general: "#fde68a", browser: "#bfdbfe",
              interaction: "#e9d5ff", conditions: "#a7f3d0",
              data: "#fecaca", onlineServices: "#a5f3fc",
            };
            const cat = BLOCK_DEFINITIONS[n.data?.label as string]?.category;
            const baseColor = colors[cat || "general"] || "#e5e7eb";
            return theme === "dark" ? baseColor : baseColor; // Keeping original colors for now
          }}
          nodeStrokeWidth={3}
          nodeStrokeColor={theme === "dark" ? "#ffffff20" : "#00000010"}
          nodeBorderRadius={8}
          maskColor={theme === "dark" ? "rgba(2, 6, 23, 0.7)" : "rgba(248, 250, 252, 0.85)"}
          maskStrokeColor={theme === "dark" ? "#f59e0b" : "#f59e0b"}
          maskStrokeWidth={2}
          className="!bg-white dark:!bg-slate-800 !border-gray-200 dark:!border-slate-700 !shadow-xl !rounded-xl"
        />
      </ReactFlow>
    </EditorActionsContext.Provider>
  );
}
