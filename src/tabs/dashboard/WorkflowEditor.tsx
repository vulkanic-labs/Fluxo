import React, { useState, useEffect, useCallback, useRef } from "react";
import { ReactFlowProvider, type Node, type Edge } from "@xyflow/react";
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

interface WorkflowEditorProps {
  workflowId: string;
}

function EditorInner({ workflowId }: WorkflowEditorProps) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataChanged, setIsDataChanged] = useState(false);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);

  // Editing panel state
  const [editingBlock, setEditingBlock] = useState<{
    nodeId: string;
    blockTypeId: string;
    data: Record<string, any>;
  } | null>(null);

  // Rename modal
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameName, setRenameName] = useState("");
  const [renameDesc, setRenameDesc] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ref to access live canvas state for saving
  const canvasRef = useRef<EditorCanvasRef>({ getState: () => ({ nodes: [], edges: [] }) });

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
          const df = typeof wf.drawflow === "string"
            ? JSON.parse(wf.drawflow)
            : wf.drawflow;
          const nodes = (df.nodes || []).map((n: Node) => ({ ...n, type: "fluxoBlock" }));
          setInitialNodes(nodes);
          setInitialEdges(df.edges || []);
        } else {
          setInitialNodes([{
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
  }, [workflowId]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); handleExecute(); }
    };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  });

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!workflow) return;
    const { nodes, edges } = canvasRef.current.getState();
    const drawflowData = { nodes, edges };
    await workflowService.updateWorkflow(workflow.id, {
      drawflow: JSON.stringify(drawflowData),
      updatedAt: Date.now(),
    });
    setIsDataChanged(false);
    setWorkflow(prev => prev ? { ...prev, drawflow: JSON.stringify(drawflowData) } : null);
  }, [workflow]);

  const handleExecute = useCallback(async () => {
    if (isDataChanged) await handleSave();
    try {
      await messagingService.sendMessage("workflow:execute", { workflowId });
    } catch (err) {
      console.error("Execute error:", err);
    }
  }, [isDataChanged, handleSave, workflowId]);

  // The actions object passed into EditorCanvas → provided via Context to all nodes
  const editorActions: EditorActions = {
    onEdit: useCallback((nodeId: string) => {
      const { nodes } = canvasRef.current.getState();
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      setEditingBlock({
        nodeId,
        blockTypeId: String(node.data.label),
        data: node.data as Record<string, any>,
      });
    }, []),

    onDelete: useCallback((nodeId: string) => {
      setIsDataChanged(true);
      if (editingBlock?.nodeId === nodeId) setEditingBlock(null);
    }, [editingBlock]),

    onRunFrom: useCallback(async (nodeId: string) => {
      if (isDataChanged) await handleSave();
      try {
        await messagingService.sendMessage("workflow:executeFrom", { workflowId, nodeId });
      } catch (err) { console.error(err); }
    }, [isDataChanged, handleSave, workflowId]),
  };

  const handleUpdateNodeData = useCallback((nodeId: string, data: Record<string, any>) => {
    setIsDataChanged(true);
    setEditingBlock(prev => prev?.nodeId === nodeId ? { ...prev, data } : prev);
  }, []);

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

  // ─── Loading / Not found ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-9 h-9 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-gray-500">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-gray-700">Workflow not found</p>
          <button onClick={() => (window.location.hash = "")} className="text-sm text-amber-600 underline">
            ← Back to workflows
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#f8fafc] font-sans antialiased">
      {/* Top Toolbar */}
      <EditorToolbar
        workflow={{
          id: workflow.id,
          name: workflow.name,
          isDisabled: workflow.isDisabled,
          testingMode: (workflow as any).testingMode,
        }}
        isDataChanged={isDataChanged}
        onBack={() => (window.location.hash = "")}
        onSave={handleSave}
        onExecute={handleExecute}
        onRename={() => setShowRenameModal(true)}
        onDelete={() => setShowDeleteModal(true)}
        onToggleDisabled={handleToggleDisabled}
        onToggleTestingMode={() => {}}
        onOpenModal={(id) => console.log("Modal:", id)}
      />

      {/* Main 3-column layout */}
      <div className="flex flex-1 min-h-0">
        {/* Block Palette */}
        <aside className="w-56 shrink-0 flex flex-col overflow-hidden border-r border-gray-200 bg-white">
          <EditorSidebar workflow={{ name: workflow.name, description: workflow.description || "" }} />
        </aside>

        {/* Canvas */}
        <main className="flex-1 relative min-w-0">
          <EditorCanvas
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            actions={editorActions}
            canvasRef={canvasRef}
            onDataChanged={() => setIsDataChanged(true)}
          />
        </main>

        {/* Block edit panel — slides in from right */}
        {editingBlock && (
          <aside className="w-80 shrink-0 flex flex-col overflow-hidden border-l border-gray-200 bg-white">
            <BlockEditPanel
              nodeId={editingBlock.nodeId}
              blockTypeId={editingBlock.blockTypeId}
              data={editingBlock.data}
              onClose={() => setEditingBlock(null)}
              onUpdate={handleUpdateNodeData}
            />
          </aside>
        )}
      </div>

      {/* ── Rename Modal ─────────────────────────────────────────────────────────── */}
      {showRenameModal && (
        <Modal title="Rename Workflow" onClose={() => setShowRenameModal(false)}>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</span>
              <input
                type="text"
                value={renameName}
                onChange={e => setRenameName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRename()}
                autoFocus
                className="mt-1.5 w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Description</span>
              <textarea
                value={renameDesc}
                onChange={e => setRenameDesc(e.target.value)}
                rows={3}
                maxLength={300}
                className="mt-1.5 w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <p className="text-right text-[11px] text-gray-400">{renameDesc.length}/300</p>
            </label>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowRenameModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleRename} className="flex-1 py-2 text-sm bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors">Update</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Modal ─────────────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <Modal title="Delete Workflow" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-gray-600 mb-5">
            Permanently delete <strong className="text-gray-900">{workflow.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleDelete} className="flex-1 py-2 text-sm bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Simple modal backdrop
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
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
