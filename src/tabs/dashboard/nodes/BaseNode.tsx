import React, { useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Pencil, Trash2, Settings2, Play, CheckCircle2 } from "lucide-react";
import { BLOCK_DEFINITIONS } from "../editor/data/blocks";
import { useEditorActions } from "../editor/EditorActionsContext";

// Category visual config
const CATEGORY_STYLES: Record<string, { band: string; dot: string }> = {
  general:        { band: "bg-amber-50 text-amber-700 border-b border-amber-200",   dot: "bg-amber-400" },
  browser:        { band: "bg-blue-50 text-blue-700 border-b border-blue-200",      dot: "bg-blue-400" },
  interaction:    { band: "bg-purple-50 text-purple-700 border-b border-purple-200", dot: "bg-purple-400" },
  conditions:     { band: "bg-emerald-50 text-emerald-700 border-b border-emerald-200", dot: "bg-emerald-400" },
  data:           { band: "bg-rose-50 text-rose-700 border-b border-rose-200",      dot: "bg-rose-400" },
  onlineServices: { band: "bg-cyan-50 text-cyan-700 border-b border-cyan-200",      dot: "bg-cyan-400" },
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
  const { onEdit, onDelete, onRunFrom } = useEditorActions();

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

  return (
    <div
      className={`relative select-none transition-opacity ${isDisabled ? "opacity-40" : ""}`}
      style={{ width: 192 }}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => setShowMenu(false)}
    >
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

          <div className="flex items-center bg-gray-900 shadow-md shadow-gray-900/10 rounded-md overflow-hidden">
            {!blockDef?.disableEdit && (
              <button
                title="Edit block"
                onClick={handleEdit}
                className="p-1.5 text-gray-300 hover:text-blue-300 hover:bg-gray-800 transition-colors"
              >
                <Pencil size={13} />
              </button>
            )}
            <button
              title="Run from this block"
              onClick={handleRun}
              className="p-1.5 text-gray-300 hover:text-emerald-300 hover:bg-gray-800 transition-colors border-l border-gray-700"
            >
              <Play size={13} />
            </button>
            <button
              title="Delete block"
              onClick={handleDelete}
              className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-gray-800 transition-colors border-l border-gray-700"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Node card */}
      <div
        className={`
          rounded-xl bg-white overflow-hidden
          border-2 transition-all duration-100
          ${selected
            ? "border-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
            : "border-gray-200 shadow-md hover:border-gray-300 hover:shadow-lg"
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
          <p className="text-sm font-semibold text-gray-800 leading-tight">{blockName}</p>
          {nodeData.description ? (
            <p className="text-[11px] text-gray-400 mt-1 truncate">{nodeData.description}</p>
          ) : (
            <p className="text-[11px] text-gray-300 mt-1">Double-click to configure</p>
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
