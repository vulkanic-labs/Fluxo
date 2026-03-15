import React, { useState } from "react";
import { X, ExternalLink } from "lucide-react";
import { BLOCK_DEFINITIONS } from "./data/blocks";

// All panel components are exported from these two files
import { EditTriggerPanel } from "../panels/EditTrigger";
import {
  EditNewTabPanel,
  EditClickElementPanel,
  EditGetTextPanel,
  EditFormsPanel,
  EditJavascriptCodePanel,
  EditWebhookPanel,
  EditDelayPanel,
  GenericEditPanel,
} from "../panels/EditForms";

export interface BlockEditPanelProps {
  nodeId: string;
  blockTypeId: string; // e.g. "event-click"
  data: Record<string, any>;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Record<string, any>) => void;
}

// Map block type id → panel component
const PANEL_MAP: Record<string, React.ComponentType<EditPanelProps>> = {
  trigger: EditTriggerPanel,
  "new-tab": EditNewTabPanel,
  "event-click": EditClickElementPanel,
  "hover-element": EditClickElementPanel,
  "get-text": EditGetTextPanel,
  forms: EditFormsPanel,
  "javascript-code": EditJavascriptCodePanel,
  webhook: EditWebhookPanel,
  delay: EditDelayPanel,
};

export interface EditPanelProps {
  data: Record<string, any>;
  onChange: (updated: Record<string, any>) => void;
}

export function BlockEditPanel({ nodeId, blockTypeId, data, onClose, onUpdate }: BlockEditPanelProps) {
  const [localData, setLocalData] = useState<Record<string, any>>(data);
  const blockDef = BLOCK_DEFINITIONS[blockTypeId];

  const PanelComponent = PANEL_MAP[blockTypeId] || GenericEditPanel;

  const handleChange = (updated: Record<string, any>) => {
    const newData = { ...localData, ...updated };
    setLocalData(newData);
    onUpdate(nodeId, newData);
  };

  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200 w-80 shrink-0">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 shrink-0">
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {blockDef?.name || blockTypeId}
          </p>
          <p className="text-xs text-gray-400 truncate">{blockDef?.description || ''}</p>
        </div>
        <a
          href={`https://docs.fluxo.app/blocks/${blockTypeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-gray-300 hover:text-gray-500 rounded-md"
          title="Documentation"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4">
        <PanelComponent data={localData} onChange={handleChange} />
      </div>
    </div>
  );
}
