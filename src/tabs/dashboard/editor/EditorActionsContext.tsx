import { createContext, useContext } from "react";

export interface EditorActions {
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onRunFrom?: (nodeId: string) => void;
}

export const EditorActionsContext = createContext<EditorActions>({
  onEdit: () => {},
  onDelete: () => {},
});

export function useEditorActions() {
  return useContext(EditorActionsContext);
}
