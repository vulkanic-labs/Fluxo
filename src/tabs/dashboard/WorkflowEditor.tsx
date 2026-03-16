import React, { useState, useEffect, useCallback, useRef } from "react";
import { ReactFlowProvider, useNodesState, useEdgesState, addEdge, reconnectEdge, type Node, type Edge, type OnNodesChange, type OnEdgesChange, type Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import browser from "webextension-polyfill";

import { workflowService, type Workflow } from "~services/WorkflowService";
import { messagingService } from "~services/MessagingService";
import { EditorSidebar } from "./editor/EditorSidebar";
import { EditorCanvas, type EditorCanvasRef } from "./editor/EditorCanvas";
import { EditorToolbar } from "./editor/EditorToolbar";
import { BlockEditPanel } from "./editor/BlockEditPanel";
import { BLOCK_DEFINITIONS } from "./editor/data/blocks";
import type { EditorActions } from "./editor/EditorActionsContext";
import { useHistory } from "~hooks/useHistory";
import { ThemeProvider, useTheme } from "~context/ThemeContext";

interface WorkflowEditorProps {
  workflowId: string;
}

function EditorInner({ workflowId }: WorkflowEditorProps) {
  const { theme } = useTheme();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataChanged, setIsDataChanged] = useState(false);
  
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<Edge>([]);
  
  const { undo, redo, recordAction, canUndo, canRedo } = useHistory(nodes, edges);

  // Editing panel state
  const [editingBlock, setEditingBlock] = useState<{
    nodeId: string;
    blockTypeId: string;
    data: Record<string, any>;
  } | null>(null);

  const [executingNodeId, setExecutingNodeId] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.action === "fluxo:node-executing") {
        setExecutingNodeId(message.payload.nodeId);
      } else if (message.action === "fluxo:execution-stopped") {
        setExecutingNodeId(null);
      }
    };
    browser.runtime.onMessage.addListener(handleMessage);
    return () => browser.runtime.onMessage.removeListener(handleMessage);
  }, []);

  // Modals
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameDesc, setRenameDesc] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ref for imperative updates (like specialized node data changes from sidebar)
  const canvasRef = useRef<EditorCanvasRef>({ 
    getState: () => ({ nodes: [], edges: [] }),
    updateNodeData: () => {}
  });

  // ─── Load workflow ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      await workflowService.initialize();
      const wf = workflowService.getWorkflowById(workflowId);
      if (wf) {
        setWorkflow(wf);
        setRenameName(wf.name);
        setRenameDesc(wf.description || "");

        if (wf.drawflow) {
          const df = typeof wf.drawflow === "string" ? JSON.parse(wf.drawflow) : wf.drawflow;
          const initialNodes = (df.nodes || []).map((n: Node) => ({ ...n, type: "fluxoBlock" }));
          const initialEdges = (df.edges || []).map((e: Edge) => ({ ...e, type: "deletable" }));
          setNodes(initialNodes);
          setEdges(initialEdges);
        } else {
          setNodes([{
            id: `trigger-${Date.now()}`,
            type: "fluxoBlock",
            position: { x: 250, y: 160 },
            data: { label: "trigger", ...BLOCK_DEFINITIONS.trigger.data },
          }]);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [workflowId, setNodes, setEdges]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleExecute(); }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === "z") { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!workflow) return;
    const drawflowData = { nodes, edges };
    await workflowService.updateWorkflow(workflow.id, {
      drawflow: JSON.stringify(drawflowData),
      updatedAt: Date.now(),
    });
    setIsDataChanged(false);
    setWorkflow(prev => prev ? { ...prev, drawflow: JSON.stringify(drawflowData) } : null);
  }, [workflow, nodes, edges]);

  const handleExecute = useCallback(async () => {
    if (isDataChanged) await handleSave();
    try {
      await messagingService.sendMessage("workflow:execute", { workflowId });
    } catch (err) {
      console.error("Execute error:", err);
    }
  }, [isDataChanged, handleSave, workflowId]);

  const handleUndo = useCallback(() => {
    const prev = undo();
    if (prev) {
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setIsDataChanged(true);
    }
  }, [undo, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    const next = redo();
    if (next) {
      setNodes(next.nodes);
      setEdges(next.edges);
      setIsDataChanged(true);
    }
  }, [redo, setNodes, setEdges]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    onNodesChangeInternal(changes);
    // Significant changes (dimensions, position end, add, remove) should be recorded
    // For simplicity, we record most changes except pure selection/dragging (dragging handled by onNodeDragStop)
    const isInterim = changes.some(c => c.type === 'position' && c.dragging);
    if (!isInterim) {
      recordAction(nodes, edges);
      setIsDataChanged(true);
    }
  }, [onNodesChangeInternal, recordAction, nodes, edges]);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    onEdgesChangeInternal(changes);
    recordAction(nodes, edges);
    setIsDataChanged(true);
  }, [onEdgesChangeInternal, recordAction, nodes, edges]);

  const onConnect = useCallback((params: Connection | Edge) => {
    setEdges(eds => addEdge({ ...params, type: "deletable", animated: false }, eds));
    recordAction(nodes, edges);
    setIsDataChanged(true);
  }, [setEdges, recordAction, nodes, edges]);

  const onReconnect = useCallback((oldEdge: Edge, newConnection: Connection) => {
    setEdges(eds => reconnectEdge(oldEdge, newConnection, eds));
    recordAction(nodes, edges);
    setIsDataChanged(true);
  }, [setEdges, recordAction, nodes, edges]);

  const editorActions: EditorActions = {
    onEdit: useCallback((nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      setEditingBlock({
        nodeId,
        blockTypeId: String(node.data.label),
        data: node.data as Record<string, any>,
      });
    }, [nodes]),

    onDelete: useCallback((nodeId: string) => {
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      recordAction(nodes, edges);
      setIsDataChanged(true);
      if (editingBlock?.nodeId === nodeId) setEditingBlock(null);
    }, [nodes, edges, recordAction, setNodes, setEdges, editingBlock]),

    onClearConnections: useCallback((nodeId: string) => {
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      recordAction(nodes, edges);
      setIsDataChanged(true);
    }, [nodes, edges, recordAction, setEdges]),

    onRunFrom: useCallback(async (nodeId: string) => {
      if (isDataChanged) await handleSave();
      try {
        await messagingService.sendMessage("workflow:executeFrom", { workflowId, nodeId });
      } catch (err) { console.error(err); }
    }, [isDataChanged, handleSave, workflowId]),
    executingNodeId,
  };

  const handleUpdateNodeData = useCallback((nodeId: string, data: Record<string, any>) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n));
    recordAction(nodes, edges);
    setIsDataChanged(true);
    setEditingBlock(prev => prev?.nodeId === nodeId ? { ...prev, data } : prev);
  }, [nodes, edges, recordAction, setNodes]);

  const handleRename = useCallback(async () => {
    if (!workflow) return;
    await workflowService.updateWorkflow(workflow.id, { name: renameName, description: renameDesc });
    setWorkflow(prev => prev ? { ...prev, name: renameName, description: renameDesc } : null);
    setShowRenameModal(false);
  }, [workflow, renameName, renameDesc]);

  const handleDelete = useCallback(async () => {
    if (!workflow) return;
    await workflowService.deleteWorkflow(workflow.id);
    window.location.hash = "";
  }, [workflow]);

  const handleToggleDisabled = useCallback(async () => {
    if (!workflow) return;
    const isDisabled = !workflow.isDisabled;
    await workflowService.updateWorkflow(workflow.id, { isDisabled });
    setWorkflow(prev => prev ? { ...prev, isDisabled } : null);
  }, [workflow]);

  // ─── Resizable Panels ──────────────────────────────────────────────────────────
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(224);
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizingLeft = useCallback(() => setIsResizingLeft(true), []);
  const startResizingRight = useCallback(() => setIsResizingRight(true), []);

  useEffect(() => {
    if (!isResizingLeft && !isResizingRight) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        setLeftSidebarWidth(Math.max(160, Math.min(400, e.clientX)));
      } else if (isResizingRight) {
        setRightSidebarWidth(Math.max(240, Math.min(600, window.innerWidth - e.clientX)));
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      // Force React Flow to recalculate its dimensions if needed
      window.dispatchEvent(new Event('resize'));
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  // ─── Loading / Not found ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8fafc] dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8fafc] dark:bg-gray-950 flex items-center justify-center transition-colors">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">Workflow not found</p>
          <button onClick={() => (window.location.hash = "")} className="text-sm text-amber-600 dark:text-amber-500 underline">
            ← Back to workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col bg-[#f8fafc] dark:bg-gray-950 font-sans antialiased transition-colors ${isResizingLeft || isResizingRight ? 'select-none' : ''}`}>
      {/* Top Toolbar */}
      <EditorToolbar
        workflow={{
          id: workflow.id,
          name: workflow.name,
          isDisabled: workflow.isDisabled,
          testingMode: (workflow as any).testingMode,
        }}
        isDataChanged={isDataChanged}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBack={() => (window.location.hash = "")}
        onSave={handleSave}
        onExecute={handleExecute}
        onRename={() => setShowRenameModal(true)}
        onDelete={() => setShowDeleteModal(true)}
        onToggleDisabled={handleToggleDisabled}
        onToggleTestingMode={() => {}}
        onOpenModal={(id) => console.log("Modal:", id)}
      />

      <div className="flex flex-1 min-h-0 relative">
        <aside style={{ width: leftSidebarWidth }} className="shrink-0 flex flex-col overflow-hidden">
          <EditorSidebar workflow={{ name: workflow.name, description: workflow.description || "" }} />
        </aside>

        {/* Left Resize Handle */}
        <div 
          onMouseDown={startResizingLeft} 
          className="w-1.5 shrink-0 cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500 transition-colors z-20 group relative"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gray-200 dark:bg-gray-800 group-hover:bg-transparent" />
        </div>

        <main className="flex-1 relative min-w-0">
          <EditorCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            actions={editorActions}
            canvasRef={canvasRef}
            onDataChanged={() => setIsDataChanged(true)}
          />
        </main>

        {editingBlock && (
          <>
            {/* Right Resize Handle */}
            <div 
              onMouseDown={startResizingRight} 
              className="w-1.5 shrink-0 cursor-col-resize hover:bg-amber-500/50 active:bg-amber-500 transition-colors z-20 group relative"
            >
               <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-gray-200 dark:bg-gray-800 group-hover:bg-transparent" />
            </div>
            
            <aside style={{ width: rightSidebarWidth }} className="shrink-0 flex flex-col overflow-hidden relative">
              <BlockEditPanel
                nodeId={editingBlock.nodeId}
                blockTypeId={editingBlock.blockTypeId}
                data={editingBlock.data}
                onClose={() => setEditingBlock(null)}
                onUpdate={handleUpdateNodeData}
              />
            </aside>
          </>
        )}
      </div>

      {/* ── Rename Modal ─────────────────────────────────────────────────────────── */}
      {showRenameModal && (
        <Modal title="Rename Workflow" onClose={() => setShowRenameModal(false)}>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</span>
              <input
                type="text"
                value={renameName}
                onChange={e => setRenameName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRename()}
                autoFocus
                className="mt-1.5 w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</span>
              <textarea
                value={renameDesc}
                onChange={e => setRenameDesc(e.target.value)}
                rows={3}
                maxLength={300}
                className="mt-1.5 w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none transition-colors"
              />
              <p className="text-right text-[11px] text-gray-400 dark:text-gray-500">{renameDesc.length}/300</p>
            </label>
            <div className="flex gap-2 pt-1">
              <button 
                onClick={() => setShowRenameModal(false)} 
                className="flex-1 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRename} 
                className="flex-1 py-2 text-sm bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors shadow-sm"
              >
                Update
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="Delete Workflow" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Permanently delete <strong className="text-gray-900 dark:text-white">{workflow.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowDeleteModal(false)} 
              className="flex-1 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete} 
              className="flex-1 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transition-colors">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function WorkflowEditor({ workflowId }: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <EditorInner workflowId={workflowId} />
    </ReactFlowProvider>
  );
}
