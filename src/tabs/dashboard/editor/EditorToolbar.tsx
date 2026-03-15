import React, { useState } from "react";
import {
  ArrowLeft,
  Save,
  Play,
  Bug,
  Trash2,
  Edit2,
  MoreVertical,
  Copy,
  ToggleLeft,
  ToggleRight,
  Table2,
  Database,
  Settings,
} from "lucide-react";

export interface ToolbarWorkflow {
  id: string;
  name: string;
  isDisabled?: boolean;
  testingMode?: boolean;
}

interface EditorToolbarProps {
  workflow: ToolbarWorkflow;
  isDataChanged: boolean;
  onBack: () => void;
  onSave: () => void;
  onExecute: () => void;
  onRename: () => void;
  onDelete: () => void;
  onToggleDisabled: () => void;
  onToggleTestingMode: () => void;
  onOpenModal: (id: "table" | "globalData" | "settings") => void;
}

export function EditorToolbar({
  workflow,
  isDataChanged,
  onBack,
  onSave,
  onExecute,
  onRename,
  onDelete,
  onToggleDisabled,
  onToggleTestingMode,
  onOpenModal,
}: EditorToolbarProps) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 shadow-sm shrink-0 relative z-10">
      {/* Back */}
      <button
        onClick={onBack}
        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
        title="Back to workflows"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Workflow name + unsaved indicator */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isDataChanged ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        <h2 className="text-sm font-semibold text-gray-800 truncate">{workflow.name}</h2>
        {workflow.isDisabled && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">Disabled</span>
        )}
      </div>

      {/* Modal Actions */}
      <div className="hidden md:flex items-center gap-1">
        <IconButton icon={<Table2 size={16} />} title="Data Table" onClick={() => onOpenModal("table")} />
        <IconButton icon={<Database size={16} />} title="Global Data" onClick={() => onOpenModal("globalData")} />
        <IconButton icon={<Settings size={16} />} title="Workflow Settings" onClick={() => onOpenModal("settings")} />
      </div>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      {/* Testing mode */}
      <button
        onClick={onToggleTestingMode}
        title="Toggle Testing Mode"
        className={`p-1.5 rounded-lg transition-colors ${
          workflow.testingMode
            ? "bg-amber-100 text-amber-700"
            : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
        }`}
        disabled={isDataChanged}
      >
        <Bug size={16} />
      </button>

      {/* Execute */}
      {!workflow.isDisabled && (
        <button
          onClick={onExecute}
          title="Execute workflow (Ctrl+Enter)"
          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
        >
          <Play size={16} />
        </button>
      )}

      {/* More */}
      <div className="relative">
        <button
          onClick={() => setShowMore(v => !v)}
          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MoreVertical size={16} />
        </button>
        {showMore && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
            <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-xl shadow-lg w-48 py-1 overflow-hidden">
              <MenuItem
                icon={<Edit2 size={14} />}
                label="Rename"
                onClick={() => { setShowMore(false); onRename(); }}
              />
              <MenuItem
                icon={<Copy size={14} />}
                label="Copy workflow ID"
                onClick={() => { setShowMore(false); navigator.clipboard.writeText(workflow.id); }}
              />
              <MenuItem
                icon={workflow.isDisabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                label={workflow.isDisabled ? "Enable" : "Disable"}
                onClick={() => { setShowMore(false); onToggleDisabled(); }}
              />
              <div className="my-1 border-t border-gray-100" />
              <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete workflow"
                className="text-red-500 hover:bg-red-50"
                onClick={() => { setShowMore(false); onDelete(); }}
              />
            </div>
          </>
        )}
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        title="Save (Ctrl+S)"
        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
          isDataChanged
            ? "bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Save size={15} />
        <span>Save</span>
      </button>
    </div>
  );
}

function IconButton({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {icon}
    </button>
  );
}

function MenuItem({ icon, label, onClick, className = "" }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${className || "text-gray-700"}`}
    >
      <span className="text-gray-400">{icon}</span>
      {label}
    </button>
  );
}
