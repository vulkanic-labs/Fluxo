import React, { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { BLOCK_DEFINITIONS } from "./data/blocks";

// All panel components are imported from the panels index
import {
  EditTriggerPanel,
  EditNewTabPanel,
  EditClickElementPanel,
  EditGetTextPanel,
  EditFormsPanel,
  EditJavascriptCodePanel,
  EditWebhookPanel,
  EditDelayPanel,
  EditWaitConnectionsPanel,
  EditExecuteWorkflowPanel,
  EditExportDataPanel,
  EditClipboardPanel,
  EditLogDataPanel,
  EditTabURLPanel,
  EditCookiePanel,
  EditCreateElementPanel,
  EditIncreaseVariablePanel,
  EditSliceVariablePanel,
  EditNotificationPanel,
  EditLoopDataPanel,
  EditLoopElementsPanel,
  EditInsertDataPanel,
  EditDeleteDataPanel,
  EditDataMappingPanel,
  EditSortDataPanel,
  EditRegexVariablePanel,
  EditGoogleDrivePanel,
  EditAiWorkflowPanel,
  EditWorkflowStatePanel,
  EditParameterPromptPanel,
  GenericEditPanel,
  EditActionChain,
} from "../panels";

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
  "wait-connections": EditWaitConnectionsPanel,
  "action-chain": EditActionChain,
  "execute-workflow": EditExecuteWorkflowPanel,
  "export-data": EditExportDataPanel,
  clipboard: EditClipboardPanel,
  "log-data": EditLogDataPanel,
  "tab-url": EditTabURLPanel,
  cookie: EditCookiePanel,
  "create-element": EditCreateElementPanel,
  "increase-variable": EditIncreaseVariablePanel,
  "slice-variable": EditSliceVariablePanel,
  notification: EditNotificationPanel,
  "loop-data": EditLoopDataPanel,
  "loop-elements": EditLoopElementsPanel,
  "insert-data": EditInsertDataPanel,
  "delete-data": EditDeleteDataPanel,
  "data-mapping": EditDataMappingPanel,
  "sort-data": EditSortDataPanel,
  "regex-variable": EditRegexVariablePanel,
  "google-drive": EditGoogleDrivePanel,
  "ai-workflow": EditAiWorkflowPanel,
  "workflow-state": EditWorkflowStatePanel,
  "parameter-prompt": EditParameterPromptPanel,
};

export interface EditPanelProps {
  data: Record<string, any>;
  onChange: (updated: Record<string, any>) => void;
}

export function BlockEditPanel({ nodeId, blockTypeId, data, onClose, onUpdate }: BlockEditPanelProps) {
  const [localData, setLocalData] = useState<Record<string, any>>(data);
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  const blockDef = BLOCK_DEFINITIONS[blockTypeId];

  const PanelComponent = PANEL_MAP[blockTypeId] || GenericEditPanel;

  const handleChange = (updated: Record<string, any>) => {
    const newData = { ...localData, ...updated };
    setLocalData(newData);
    onUpdate(nodeId, newData);
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 w-full transition-colors">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {blockDef?.name || blockTypeId}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{blockDef?.description || ''}</p>
        </div>
        <a
          href={`https://docs.fluxo.app/blocks/${blockTypeId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 rounded-md transition-colors"
          title="Documentation"
        >
          <ExternalLink size={14} />
        </a>
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-4 dark:text-gray-300">
        <PanelComponent data={localData} onChange={handleChange} />
      </div>
    </div>
  );
}
