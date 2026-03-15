import React from "react";
import { Play, MoreVertical, Pin, PinOff, Copy, FileDown, Edit2, Trash2, Calendar, Share, Server } from "lucide-react";
import { type Workflow } from "~services/WorkflowService";

interface WorkflowCardProps {
  workflow: Workflow;
  isPinned?: boolean;
  isHosted?: boolean;
  isShared?: boolean;
  onExecute?: () => void;
  onTogglePin?: () => void;
  onDuplicate?: () => void;
  onExport?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
}

export function WorkflowCard({
  workflow,
  isPinned = false,
  isHosted = false,
  isShared = false,
  onExecute,
  onTogglePin,
  onDuplicate,
  onExport,
  onRename,
  onDelete,
  onClick
}: WorkflowCardProps) {
  return (
    <div 
      className="group flex flex-col bg-white border border-gray-200 rounded-xl p-4 hover:ring-2 hover:ring-amber-500 hover:shadow-md transition-all cursor-pointer relative font-sans"
      onClick={onClick}
    >
      <div className="flex items-center mb-3">
        {workflow.icon?.startsWith("http") ? (
          <img src={workflow.icon} alt="icon" className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
            {/* If there's an icon string we could map it, but mostly we'll use a placeholder */}
            <Server size={20} />
          </div>
        )}

        <div className="grow"></div>
        
        {workflow.isDisabled ? (
          <span className="text-sm text-gray-500 font-medium px-2 py-1 bg-gray-100 rounded-md">Disabled</span>
        ) : (
          <button 
            className="invisible group-hover:visible p-1.5 hover:bg-amber-100 text-amber-600 rounded-md transition-colors"
            onClick={(e) => { e.stopPropagation(); onExecute?.(); }}
            title="Execute"
          >
            <Play size={18} fill="currentColor" />
          </button>
        )}
        
        {/* Dropdown Menu Trigger (Simplified for now) */}
        <div className="relative inline-block ml-1 group/menu">
          <button 
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={18} />
          </button>
          
          {/* Menu Dropdown - hidden by default, visible on hover of the container */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
            <div className="py-1">
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); onTogglePin?.(); }}>
                {isPinned ? <PinOff size={16} className="mr-2 text-gray-400" /> : <Pin size={16} className="mr-2 text-gray-400" />}
                {isPinned ? "Unpin Workflow" : "Pin Workflow"}
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}>
                <Copy size={16} className="mr-2 text-gray-400" /> Duplicate
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); onExport?.(); }}>
                <FileDown size={16} className="mr-2 text-gray-400" /> Export
              </button>
              <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); onRename?.(); }}>
                <Edit2 size={16} className="mr-2 text-gray-400" /> Rename
              </button>
              <div className="h-px bg-gray-100 my-1"></div>
              <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); onDelete?.(); }}>
                <Trash2 size={16} className="mr-2 text-red-400" /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 mt-1">
        <h3 className="font-semibold text-gray-800 line-clamp-1">{workflow.name}</h3>
        {workflow.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{workflow.description}</p>
        )}
      </div>
      
      <div className="flex items-center text-xs text-gray-400 mt-4 pt-4 border-t border-gray-50">
        <Calendar size={14} className="mr-1.5" />
        <span className="flex-1">{new Date(workflow.createdAt).toLocaleDateString()}</span>
        
        {isShared && <span title="Shared" className="ml-2 text-amber-500 flex"><Share size={16} /></span>}
        {isHosted && <span title="Hosted" className="ml-2 text-blue-500 flex"><Server size={16} /></span>}
      </div>
    </div>
  );
}
