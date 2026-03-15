import React, { useState, useEffect } from "react";
import { Search, Plus, UploadCloud, Pin, LayoutGrid } from "lucide-react";
import { workflowService, type Workflow } from "~services/WorkflowService";
import { WorkflowCard } from "./WorkflowCard";
// We might not have a Button component fully configured if we port from generic UI.
// Using native HTML buttons for simplicity but styled precisely.

export function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [query, setQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  
  useEffect(() => {
    async function load() {
      await workflowService.initialize();
      setWorkflows(workflowService.getWorkflows());
      
      const storage = await chrome.storage.local.get("pinnedWorkflows");
      if (storage.pinnedWorkflows) {
        setPinnedIds(storage.pinnedWorkflows);
      }
    }
    load();
  }, []);

  const filteredWorkflows = workflows.filter((w) => 
    w.name.toLowerCase().includes(query.toLowerCase())
  );
  
  const pinnedWorkflows = filteredWorkflows.filter(w => pinnedIds.includes(w.id));
  const unpinnedWorkflows = filteredWorkflows.filter(w => !pinnedIds.includes(w.id));

  const createWorkflow = async () => {
    const id = Date.now().toString();
    await workflowService.insertWorkflow({
      id,
      name: "Untitled Workflow",
      icon: "riGlobalLine",
      folderId: null,
      content: {},
      drawflow: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDisabled: false,
      settings: {},
      version: "0.0.1",
      globalData: "",
      description: "" // Assuming we add description in type later
    } as any);
    
    setWorkflows(workflowService.getWorkflows());
  };

  const deleteWorkflow = async (id: string) => {
    if (confirm("Are you sure you want to delete this workflow?")) {
      await workflowService.deleteWorkflow(id);
      setWorkflows(workflowService.getWorkflows());
    }
  };

  const togglePin = async (id: string) => {
    const newPinned = pinnedIds.includes(id) 
      ? pinnedIds.filter(p => p !== id) 
      : [...pinnedIds, id];
    
    setPinnedIds(newPinned);
    await chrome.storage.local.set({ pinnedWorkflows: newPinned });
  };

  return (
    <div className="flex flex-col h-full font-sans">
      {/* Top Bar Area */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
        
        <div className="grow"></div>
        
        <button 
          title="Backup Workflows"
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
        >
          <UploadCloud size={20} />
        </button>
        
        <button 
          className="flex items-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shadow-sm"
          onClick={createWorkflow}
        >
          <Plus size={18} className="mr-2" />
          New Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center max-w-md">
            <span className="text-6xl mb-6 block">👽</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">It's pretty empty here.</h2>
            <p className="text-gray-500 mb-8">Create your first workflow or import one from the marketplace to get started automating your processes.</p>
            <button 
              className="inline-flex items-center px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shadow-sm"
              onClick={createWorkflow}
            >
              <Plus size={20} className="mr-2" />
              Build a Workflow
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto pb-12">
          {pinnedWorkflows.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center text-gray-500 font-medium mb-4 px-1">
                <Pin size={18} className="mr-2" />
                <span>Pinned Workflows</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinnedWorkflows.map(w => (
                  <WorkflowCard 
                    key={w.id} 
                    workflow={w} 
                    isPinned={true} 
                    onTogglePin={() => togglePin(w.id)}
                    onDelete={() => deleteWorkflow(w.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {unpinnedWorkflows.map(w => (
              <WorkflowCard 
                key={w.id} 
                workflow={w}
                isPinned={false}
                onTogglePin={() => togglePin(w.id)}
                onDelete={() => deleteWorkflow(w.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
