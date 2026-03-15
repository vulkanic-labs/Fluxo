import React, { useState, useCallback, useEffect, useRef } from "react";
import { Search, Pin, PinOff, ChevronDown, ChevronRight } from "lucide-react";
import { BLOCK_DEFINITIONS, BLOCK_CATEGORIES, getBlocksByCategory, type BlockDefinition, type BlockCategory } from "../editor/data/blocks";
import browser from "webextension-polyfill";

interface EditorSidebarProps {
  workflow: { name: string; description?: string; icon?: string };
  onUpdateWorkflow?: (data: Partial<{ name: string; description: string; icon: string }>) => void;
}

const BLOCK_CATEGORY_ORDER: BlockCategory[] = [
  'general', 'browser', 'interaction', 'conditions', 'data', 'onlineServices'
];

export function EditorSidebar({ workflow, onUpdateWorkflow }: EditorSidebarProps) {
  const [query, setQuery] = useState("");
  const [pinnedBlocks, setPinnedBlocks] = useState<string[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    browser.storage.local.get("pinnedBlocks").then((item: Record<string, any>) => {
      if (Array.isArray(item.pinnedBlocks)) setPinnedBlocks(item.pinnedBlocks);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const pinBlock = useCallback((blockId: string) => {
    setPinnedBlocks(prev => {
      const next = prev.includes(blockId)
        ? prev.filter(id => id !== blockId)
        : [...prev, blockId];
      browser.storage.local.set({ pinnedBlocks: next });
      return next;
    });
  }, []);

  const filterBlocks = useCallback((blocks: BlockDefinition[]) => {
    if (!query) return blocks;
    const q = query.toLowerCase();
    return blocks.filter(b =>
      b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.description?.toLowerCase().includes(q)
    );
  }, [query]);

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  const onDragStart = useCallback((e: React.DragEvent, block: BlockDefinition) => {
    e.dataTransfer.setData("application/reactflow", block.id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const blocksByCategory = getBlocksByCategory();

  // Pinned Blocks section
  const pinnedBlockDefs = pinnedBlocks
    .map(id => BLOCK_DEFINITIONS[id])
    .filter(Boolean)
    .filter(b => filterBlocks([b]).length > 0);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors">
      {/* Workflow Header */}
      <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate" title={workflow.name}>
          {workflow.name}
        </h2>
        {workflow.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{workflow.description}</p>
        )}
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search blocks... (Ctrl+F)"
            className="w-full text-sm pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
          />
        </div>
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Pinned blocks */}
        {pinnedBlockDefs.length > 0 && (
          <BlockCategory
            name="Pinned"
            color="bg-amber-50 text-amber-700"
            blocks={pinnedBlockDefs}
            pinnedBlocks={pinnedBlocks}
            onPin={pinBlock}
            onDragStart={onDragStart}
            collapsed={collapsedCategories.has('pinned')}
            onToggle={() => toggleCategory('pinned')}
          />
        )}

        {/* Categories */}
        {BLOCK_CATEGORY_ORDER.map(catId => {
          const catDef = BLOCK_CATEGORIES[catId];
          const blocks = filterBlocks(blocksByCategory[catId] || []);
          if (blocks.length === 0) return null;
          return (
            <BlockCategory
              key={catId}
              name={catDef.name}
              color={`bg-gray-50 ${catDef.color}`}
              blocks={blocks}
              pinnedBlocks={pinnedBlocks}
              onPin={pinBlock}
              onDragStart={onDragStart}
              collapsed={collapsedCategories.has(catId)}
              onToggle={() => toggleCategory(catId)}
            />
          );
        })}
      </div>
    </div>
  );
}

interface BlockCategoryProps {
  name: string;
  color: string;
  blocks: BlockDefinition[];
  pinnedBlocks: string[];
  onPin: (id: string) => void;
  onDragStart: (e: React.DragEvent, block: BlockDefinition) => void;
  collapsed: boolean;
  onToggle: () => void;
}

function BlockCategory({ name, color, blocks, pinnedBlocks, onPin, onDragStart, collapsed, onToggle }: BlockCategoryProps) {
  return (
    <div className="mb-1">
      <button
        className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={onToggle}
      >
        <span className={`text-xs font-semibold uppercase tracking-wider ${color.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>
          {name}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">{blocks.length}</span>
          {collapsed ? <ChevronRight size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        <div className="px-2 pb-1 space-y-1">
          {blocks.map(block => (
            <BlockItem
              key={block.id}
              block={block}
              isPinned={pinnedBlocks.includes(block.id)}
              onPin={onPin}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BlockItemProps {
  block: BlockDefinition;
  isPinned: boolean;
  onPin: (id: string) => void;
  onDragStart: (e: React.DragEvent, block: BlockDefinition) => void;
}

function BlockItem({ block, isPinned, onPin, onDragStart }: BlockItemProps) {
  const [showPinBtn, setShowPinBtn] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, block)}
      onMouseEnter={() => setShowPinBtn(true)}
      onMouseLeave={() => setShowPinBtn(false)}
      className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 cursor-grab active:cursor-grabbing transition-all"
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-700 dark:text-gray-200 leading-tight truncate">{block.name}</p>
        {block.description && (
          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate mt-0.5">{block.description}</p>
        )}
      </div>
      {(showPinBtn || isPinned) && (
        <button
          className={`p-0.5 rounded shrink-0 ${isPinned ? 'text-amber-500' : 'text-gray-300 hover:text-amber-400'}`}
          title={isPinned ? "Unpin block" : "Pin block"}
          onClick={e => { e.stopPropagation(); onPin(block.id); }}
        >
          {isPinned ? <PinOff size={12} /> : <Pin size={12} />}
        </button>
      )}
    </div>
  );
}
