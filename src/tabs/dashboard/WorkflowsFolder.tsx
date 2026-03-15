import React, { useState, useEffect } from "react";
import { Folder as FolderIcon, Plus, MoreVertical, Edit2, Trash2, Download } from "lucide-react";
import { folderService, type Folder } from "~services/FolderService";
import { workflowService } from "~services/WorkflowService";

interface WorkflowsFolderProps {
  activeFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function WorkflowsFolder({ activeFolderId, onSelectFolder }: WorkflowsFolderProps) {
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    async function load() {
      await folderService.initialize();
      setFolders(folderService.getFolders());
    }
    load();
  }, []);

  const handleCreateFolder = async () => {
    const name = prompt("Folder Name:");
    if (!name || !name.trim()) return;

    await folderService.addFolder(name.trim());
    setFolders([...folderService.getFolders()]);
  };

  const handleRenameFolder = async (folder: Folder) => {
    const name = prompt("Rename Folder:", folder.name);
    if (!name || !name.trim()) return;

    await folderService.updateFolder(folder.id, name.trim());
    setFolders([...folderService.getFolders()]);
  };

  const handleDeleteFolder = async (folder: Folder) => {
    if (!confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) return;

    await folderService.deleteFolder(folder.id);
    if (activeFolderId === folder.id) {
      onSelectFolder(null);
    }
    setFolders([...folderService.getFolders()]);
  };

  const handleExportFolder = (folderId: string) => {
    // Stub for now. Will export workflows matching folderId
    const workflows = workflowService.getWorkflows().filter(w => w.folderId === folderId);
    console.log("Exporting workflows", workflows);
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add("ring-2", "ring-amber-500", "bg-amber-50/50");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("ring-2", "ring-amber-500", "bg-amber-50/50");
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    handleDragLeave(e);
    try {
      const data = e.dataTransfer.getData("workflows");
      if (!data) return;
      const ids: string[] = JSON.parse(data);
      if (!Array.isArray(ids)) return;

      for (const id of ids) {
        await workflowService.updateWorkflow(id, { folderId: targetFolderId });
      }
      // Assuming Workflows component will re-render or we can notify it via state lifting
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-64 border-r border-gray-100 pr-6 hidden lg:block font-sans">
      <div className="flex items-center justify-between text-gray-800 font-semibold mb-3 px-2">
        <span>Folders</span>
        <button 
          onClick={handleCreateFolder}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-500 hover:text-gray-900"
          title="New Folder"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="space-y-1">
        {/* All Workflows Item */}
        <div 
          className={`group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeFolderId === null ? 'bg-amber-100 text-amber-900 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
          onClick={() => onSelectFolder(null)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <FolderIcon size={18} className={`mr-3 ${activeFolderId === null ? 'text-amber-600' : 'text-gray-400'}`} />
          <span className="flex-1 truncate">All</span>
        </div>

        {/* Dynamic Folders */}
        {folders.map(folder => (
          <div 
            key={folder.id}
            className={`group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeFolderId === folder.id ? 'bg-amber-100 text-amber-900 font-medium' : 'hover:bg-gray-50 text-gray-600'}`}
            onClick={() => onSelectFolder(folder.id)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, folder.id)}
          >
            <FolderIcon size={18} className={`mr-3 ${activeFolderId === folder.id ? 'text-amber-600' : 'text-gray-400'}`} />
            <span className="flex-1 truncate text-sm">{folder.name}</span>
            
            {/* Folder Actions */}
            <div className="relative inline-block group/menu opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                className="p-1 hover:bg-gray-200 rounded-md text-gray-500"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={16} />
              </button>
              
              <div className="absolute left-full top-0 ml-1 w-36 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20">
                <div className="py-1">
                  <button className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); handleExportFolder(folder.id) }}>
                    <Download size={14} className="mr-2 text-gray-400" /> Export
                  </button>
                  <button className="flex items-center w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50" onClick={(e) => { e.stopPropagation(); handleRenameFolder(folder) }}>
                    <Edit2 size={14} className="mr-2 text-gray-400" /> Rename
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button className="flex items-center w-full px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder) }}>
                    <Trash2 size={14} className="mr-2 text-red-400" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
