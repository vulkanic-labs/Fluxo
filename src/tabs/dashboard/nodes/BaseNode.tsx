import React, { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Pencil, Trash2, Settings2, Play, CheckCircle2, Link2Off } from "lucide-react";
import { BLOCK_DEFINITIONS } from "../editor/data/blocks";
import { useEditorActions } from "../editor/EditorActionsContext";

// Category visual config
const CATEGORY_STYLES: Record<string, { band: string; dot: string }> = {
  general:        { band: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-b border-amber-200 dark:border-amber-900/30",   dot: "bg-amber-400" },
  browser:        { band: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-b border-blue-200 dark:border-blue-900/30",      dot: "bg-blue-400" },
  interaction:    { band: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-b border-purple-200 dark:border-purple-900/30", dot: "bg-purple-400" },
  conditions:     { band: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-900/30", dot: "bg-emerald-400" },
  data:           { band: "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-b border-rose-200 dark:border-rose-900/30",      dot: "bg-rose-400" },
  onlineServices: { band: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-b border-cyan-200 dark:border-cyan-900/30",      dot: "bg-cyan-400" },
};

const CATEGORY_NAMES: Record<string, string> = {
  general: "General", browser: "Browser", interaction: "Interaction",
  conditions: "Conditions", data: "Data", onlineServices: "Online Services",
};

export interface FluxoNodeData {
  label: string;       // block type id (e.g. "event-click")
  disableBlock?: boolean;
  description?: string;
  [key: string]: any;
}

export function BaseNode({ id, data, selected }: NodeProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get actions from context — the correct React pattern to avoid stale callbacks
  const { onEdit, onDelete, onRunFrom, onClearConnections, executingNodeId } = useEditorActions();
  const isExecuting = executingNodeId === id;

  const nodeData = data as FluxoNodeData;
  const blockDef = BLOCK_DEFINITIONS[nodeData.label];
  const category = blockDef?.category || "general";
  const styles = CATEGORY_STYLES[category] || CATEGORY_STYLES.general;
  const blockName = blockDef?.name || nodeData.label;
  const isDisabled = nodeData.disableBlock === true;

  const handleCopyId = useCallback(() => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }, [id]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(id);
  }, [id, onEdit]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(id);
  }, [id, onDelete]);

  const handleRun = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRunFrom?.(id);
  }, [id, onRunFrom]);

  const handleClearConnections = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onClearConnections?.(id);
  }, [id, onClearConnections]);

  return (
    <div
      className={`relative select-none transition-opacity ${isDisabled ? "opacity-40" : ""}`}
      style={{ width: 192 }}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
      {/* Execution Indicator Pulse */}
      {isExecuting && (
        <div className="absolute -inset-1 bg-amber-500/20 rounded-2xl animate-pulse -z-10 blur-sm" />
      )}

      {/* Hover toolbar — appears above node */}
      <div
        className={`
          absolute bottom-full left-1/2 -translate-x-1/2 z-50
          flex items-end justify-center
          pb-2 /* Bridge padding: No margin-bottom so there's no gap for onMouseLeave to trigger */
          transition-all duration-150 origin-bottom
          ${showMenu ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none"}
        `}
      >
        <div className="flex items-center gap-1">
          <button
            title="Copy block ID"
            onClick={handleCopyId}
            className="flex items-center gap-1 bg-gray-900 shadow-md shadow-gray-900/10 text-white text-[10px] px-2 py-1.5 rounded-md font-mono hover:bg-gray-700 transition-colors"
          >
            {copied ? <CheckCircle2 size={10} className="text-emerald-400" /> : null}
            {copied ? "Copied!" : `#${id.slice(-6)}`}
          </button>

          <div className="flex items-center bg-gray-900 dark:bg-gray-800 shadow-md shadow-gray-900/10 rounded-md overflow-hidden ring-1 ring-white/10">
            {!blockDef?.disableEdit && (
              <button
                title="Edit block"
                onClick={handleEdit}
                className="p-1.5 text-gray-300 hover:text-blue-300 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              >
                <Pencil size={13} />
              </button>
            )}
            <button
              title="Run from this block"
              onClick={handleRun}
              className="p-1.5 text-gray-300 hover:text-emerald-300 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors border-l border-gray-700 dark:border-gray-600"
            >
              <Play size={13} />
            </button>
            <button
              title="Disconnect all connections"
              onClick={handleClearConnections}
              className="p-1.5 text-gray-300 hover:text-amber-400 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors border-l border-gray-700 dark:border-gray-600"
            >
              <Link2Off size={13} />
            </button>
            <button
              title="Delete block"
              onClick={handleDelete}
              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors border-l border-gray-700 dark:border-gray-600"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Node card */}
      <div
        className={`
          rounded-xl bg-white dark:bg-gray-800 overflow-hidden
          border-2 transition-all duration-100
          ${isExecuting 
            ? "border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
            : selected
              ? "border-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
              : "border-gray-200 dark:border-gray-700 shadow-md hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg"
          }
        `}
        onDoubleClick={handleEdit}
      >
        {/* Category band */}
        <div className={`px-3 py-2 flex items-center gap-2 ${styles.band}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} />
          <span className="text-[10px] font-bold uppercase tracking-widest truncate">
            {CATEGORY_NAMES[category]}
          </span>
        </div>

        {/* Body */}
        <div className="px-3 py-3">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{blockName}</p>
          {nodeData.description ? (
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 truncate">{nodeData.description}</p>
          ) : (
            <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">Double-click to configure</p>
          )}
        </div>

        {/* Connection handles */}
        {blockDef && blockDef.inputs > 0 && (
          <Handle
            type="target"
            id="input"
            position={Position.Left}
            style={{ width: 10, height: 10, background: "#94a3b8", border: "2px solid white", borderRadius: "50%" }}
          />
        )}

        {blockDef && blockDef.outputs === 1 && (
          <Handle
            type="source"
            id="output"
            position={Position.Right}
            style={{ width: 10, height: 10, background: "#f59e0b", border: "2px solid white", borderRadius: "50%" }}
          />
        )}

        {blockDef && blockDef.outputs === 2 && (
          <>
            <Handle
              type="source" id="output-1" position={Position.Right}
              style={{ top: "35%", width: 10, height: 10, background: "#10b981", border: "2px solid white", borderRadius: "50%" }}
            />
            <Handle
              type="source" id="output-2" position={Position.Right}
              style={{ top: "65%", width: 10, height: 10, background: "#f87171", border: "2px solid white", borderRadius: "50%" }}
            />
          </>
        )}
      </div>
    </div>
  );
}
