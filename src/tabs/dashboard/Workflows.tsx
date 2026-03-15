import React, { useState, useEffect, useMemo } from "react";
import { Search, Plus, UploadCloud, Pin, LayoutGrid, ArrowDownAZ, ArrowUpAZ, ChevronLeft, ChevronRight } from "lucide-react";
import { workflowService, type Workflow } from "~services/WorkflowService";
import { WorkflowCard } from "./WorkflowCard";
import { WorkflowsFolder } from "./WorkflowsFolder";

export function Workflows() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [query, setQuery] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  
  // Tabs and Folders
  const [activeTab, setActiveTab] = useState<"local" | "shared" | "host">("local");
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);

  // Sorting & Pagination
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "name">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(18);

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

  const filteredWorkflows = useMemo(() => {
    // 1. Filter by Query
    let result = workflows.filter((w) => 
      w.name.toLowerCase().includes(query.toLowerCase())
    );

    // 2. Filter by Tab (assuming 'host'/'shared' logic will be added to the workflow model later, for now we mock it or filter loosely)
    // If local, just show local. We'll assume all are local for this snippet unless marked heavily.

    // 3. Filter by Folder
    if (activeFolderId) {
      result = result.filter(w => w.folderId === activeFolderId);
    }

    // 4. Sort
    result.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (typeof valA === "string" && typeof valB === "string") {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortOrder === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      }
    });

    return result;
  }, [workflows, query, activeFolderId, sortBy, sortOrder]);

  // Pagination Slice
  const paginatedWorkflows = useMemo(() => {
    const startIndex = (currentPage - 1) * perPage;
    return filteredWorkflows.slice(startIndex, startIndex + perPage);
  }, [filteredWorkflows, currentPage, perPage]);

  // Reset page when filters change
  useEffect(() => setCurrentPage(1), [query, activeFolderId, sortBy, sortOrder, perPage]);
  
  const pinnedWorkflows = paginatedWorkflows.filter(w => pinnedIds.includes(w.id));
  const unpinnedWorkflows = paginatedWorkflows.filter(w => !pinnedIds.includes(w.id));

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
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex bg-gray-100 p-1 rounded-xl">
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "local" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("local")}
          >
            Local
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "shared" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("shared")}
          >
            Shared
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === "host" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            onClick={() => setActiveTab("host")}
          >
            Hosted
          </button>
        </div>

        <div className="relative flex-1 max-w-sm ml-auto">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search workflows..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all shadow-sm"
          />
        </div>
        
        <button 
          title="Backup Workflows"
          className="p-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
        >
          <UploadCloud size={20} />
        </button>

        <div className="flex items-center bg-white border border-gray-200 rounded-xl shadow-sm">
          <button 
            onClick={() => setSortOrder(order => order === "asc" ? "desc" : "asc")}
            className="p-2.5 border-r border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors rounded-l-xl"
            title="Toggle sort order"
          >
            {sortOrder === "asc" ? <ArrowUpAZ size={18} /> : <ArrowDownAZ size={18} />}
          </button>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-transparent border-none text-sm text-gray-600 py-2.5 pl-3 pr-8 focus:ring-0 cursor-pointer outline-none"
          >
            <option value="createdAt">Date Created</option>
            <option value="updatedAt">Date Updated</option>
            <option value="name">Name</option>
          </select>
        </div>
        
        <button 
          className="flex items-center px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium transition-colors shadow-sm"
          onClick={createWorkflow}
        >
          <Plus size={18} className="mr-2" />
          New Workflow
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full gap-8">
        {/* Sidebar */}
        {activeTab === "local" && (
          <WorkflowsFolder activeFolderId={activeFolderId} onSelectFolder={setActiveFolderId} />
        )}

        {/* Main Workspace */}
        <div className="flex-1 overflow-auto pb-12 flex flex-col">
          {filteredWorkflows.length === 0 ? (
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
            <>
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

              {/* Pagination UI */}
              {filteredWorkflows.length > 18 && (
                <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <span>Show</span>
                    <select 
                      value={perPage} 
                      onChange={(e) => setPerPage(Number(e.target.value))}
                      className="mx-2 bg-gray-50 border border-gray-200 rounded-md py-1 px-2 text-gray-700 outline-none"
                    >
                      <option value={18}>18</option>
                      <option value={32}>32</option>
                      <option value={64}>64</option>
                      <option value={128}>128</option>
                    </select>
                    <span>Items - Total {filteredWorkflows.length}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="font-medium px-2">Page {currentPage} of {Math.ceil(filteredWorkflows.length / perPage)}</span>
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredWorkflows.length / perPage), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredWorkflows.length / perPage)}
                      className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-50 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
