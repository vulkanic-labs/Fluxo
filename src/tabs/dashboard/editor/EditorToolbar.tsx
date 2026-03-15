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
  Sun,
  Moon,
  Undo2,
  Redo2,
} from "lucide-react";
import { useTheme } from "~context/ThemeContext";

export interface ToolbarWorkflow {
  id: string;
  name: string;
  isDisabled?: boolean;
  testingMode?: boolean;
}

interface EditorToolbarProps {
  workflow: ToolbarWorkflow;
  isDataChanged: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: EditorToolbarProps) {
  const [showMore, setShowMore] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm shrink-0 relative z-10 transition-colors">
      {/* Back */}
      <button
        onClick={onBack}
        className="p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title="Back to workflows"
      >
        <ArrowLeft size={18} />
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <IconButton 
          icon={<Undo2 size={16} />} 
          title="Undo (Ctrl+Z)" 
          onClick={() => onUndo?.()} 
          disabled={!canUndo} 
        />
        <IconButton 
          icon={<Redo2 size={16} />} 
          title="Redo (Ctrl+Shift+Z)" 
          onClick={() => onRedo?.()} 
          disabled={!canRedo} 
        />
      </div>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />

      {/* Workflow name + unsaved indicator */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className={`w-2 h-2 rounded-full shrink-0 ${isDataChanged ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{workflow.name}</h2>
        {workflow.isDisabled && (
          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded">Disabled</span>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      </button>

      <div className="w-px h-5 bg-gray-200 dark:bg-gray-800 mx-0.5" />

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
            <div className="absolute right-0 top-8 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg w-48 py-1 overflow-hidden">
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
              <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
              <MenuItem
                icon={<Trash2 size={14} />}
                label="Delete workflow"
                className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
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

function IconButton({ icon, title, onClick, disabled }: { icon: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-1.5 rounded-lg transition-colors ${
        disabled 
          ? "text-gray-200 dark:text-gray-800 cursor-not-allowed" 
          : "text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
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
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${className || "text-gray-700 dark:text-gray-300"}`}
    >
      <span className="text-gray-400 dark:text-gray-500">{icon}</span>
      {label}
    </button>
  );
}
