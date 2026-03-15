import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
} from "@xyflow/react";
import { BaseNode } from "../nodes/BaseNode";
import { BLOCK_DEFINITIONS } from "./data/blocks";
import { EditorActionsContext, type EditorActions } from "./EditorActionsContext";

// Node types declared OUTSIDE component to prevent React Flow from re-rendering all nodes
const nodeTypes = { fluxoBlock: BaseNode };

export interface EditorCanvasRef {
  getState: () => { nodes: Node[]; edges: Edge[] };
}

interface EditorCanvasProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  actions: EditorActions;
  canvasRef?: React.MutableRefObject<EditorCanvasRef>;
  onDataChanged?: () => void;
}

export function EditorCanvas({
  initialNodes = [],
  initialEdges = [],
  actions,
  canvasRef,
  onDataChanged,
}: EditorCanvasProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  // Sync if parent updates initial nodes/edges (e.g. after load)
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes.length > 0 ? initialNodes[0]?.id : null]); // only re-run when nodes actually change (by ID of first)

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges.length > 0 ? initialEdges[0]?.id : null]);

  // Expose current state via ref
  if (canvasRef) {
    canvasRef.current = { getState: () => ({ nodes, edges }) };
  }

  // Wrap actions to also call onDelete on the canvas
  const contextActions: EditorActions = {
    onEdit: actions.onEdit,
    onDelete: (id: string) => {
      setNodes(nds => nds.filter(n => n.id !== id));
      setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
      actions.onDelete(id);
    },
    onRunFrom: actions.onRunFrom,
  };

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChangeInternal(changes);
      onDataChanged?.();
    },
    [onNodesChangeInternal, onDataChanged]
  );

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChangeInternal(changes);
      onDataChanged?.();
    },
    [onEdgesChangeInternal, onDataChanged]
  );

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      setEdges(eds => addEdge({ ...params, type: "smoothstep", animated: false }, eds));
      onDataChanged?.();
    },
    [setEdges, onDataChanged]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const blockId = e.dataTransfer.getData("application/reactflow/blockId");
      if (!blockId || !BLOCK_DEFINITIONS[blockId]) return;

      const block = BLOCK_DEFINITIONS[blockId];
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

      const newNode: Node = {
        id: `${blockId}-${Date.now()}`,
        type: "fluxoBlock",
        position,
        data: {
          label: blockId,
          ...block.data,
        },
      };

      setNodes(nds => [...nds, newNode]);
      onDataChanged?.();
    },
    [screenToFlowPosition, setNodes, onDataChanged]
  );

  return (
    <EditorActionsContext.Provider value={contextActions}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Control"
        defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#94a3b8", strokeWidth: 2 } }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={24} size={1} style={{ background: "#f8fafc" }} />
        <Controls
          showInteractive
          className="!border !border-gray-200 !rounded-xl !shadow-sm !bg-white"
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
          maskColor="rgba(248, 250, 252, 0.85)"
          className="!border !border-gray-200 !rounded-xl !shadow-sm !bg-white/90"
        />
      </ReactFlow>
    </EditorActionsContext.Provider>
  );
}
