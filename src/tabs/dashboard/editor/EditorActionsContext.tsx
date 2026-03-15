import { createContext, useContext } from "react";

export interface EditorActions {
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onRunFrom?: (nodeId: string) => void;
  onClearConnections?: (nodeId: string) => void;
  executingNodeId?: string | null;
}

export const EditorActionsContext = createContext<EditorActions>({
  onEdit: () => {},
  onDelete: () => {},
  executingNodeId: null,
});

export function useEditorActions() {
  return useContext(EditorActionsContext);
}
