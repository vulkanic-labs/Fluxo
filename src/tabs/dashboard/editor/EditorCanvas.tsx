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
          className="!border !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-sm !bg-white dark:!bg-gray-800 dark:!text-gray-300"
        />
        <MiniMap
          nodeColor={(n) => {
            const colors: Record<string, string> = {
              general: "#fde68a", browser: "#bfdbfe",
              interaction: "#e9d5ff", conditions: "#a7f3d0",
              data: "#fecaca", onlineServices: "#a5f3fc",
            };
            const cat = BLOCK_DEFINITIONS[n.data?.label as string]?.category;
            return colors[cat || "general"] || "#e5e7eb";
          }}
          nodeBorderRadius={8}
          maskColor={theme === "dark" ? "rgba(15, 23, 42, 0.7)" : "rgba(248, 250, 252, 0.85)"}
          className="!border !border-gray-200 dark:!border-gray-700 !rounded-xl !shadow-sm !bg-white/90 dark:!bg-gray-800/90"
        />
      </ReactFlow>
    </EditorActionsContext.Provider>
  );
}
