import { useCallback, useRef, useState } from "react";
import { type Node, type Edge } from "@xyflow/react";

interface HistoryState {
  nodes: Node[];
  edges: Edge[];
}

export function useHistory(initialNodes: Node[], initialEdges: Edge[], maxHistory = 50) {
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  
  // Use ref to keep track of current state without triggering re-renders for EVERY change if we don't want to
  const currentState = useRef<HistoryState>({ nodes: initialNodes, edges: initialEdges });

  const recordAction = useCallback((nodes: Node[], edges: Edge[]) => {
    // Basic optimization: don't record if same as last
    const lastPast = past[past.length - 1];
    if (lastPast && JSON.stringify(lastPast) === JSON.stringify({ nodes, edges })) return;

    setPast((prev) => {
      const nextPast = [...prev, currentState.current];
      if (nextPast.length > maxHistory) nextPast.shift();
      return nextPast;
    });
    setFuture([]);
    currentState.current = { nodes, edges };
  }, [past, maxHistory]);

  const undo = useCallback((): HistoryState | null => {
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prev) => [currentState.current, ...prev]);
    setPast(newPast);
    currentState.current = previous;

    return previous;
  }, [past]);

  const redo = useCallback((): HistoryState | null => {
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, currentState.current]);
    setFuture(newFuture);
    currentState.current = next;

    return next;
  }, [future]);

  return { undo, redo, recordAction, canUndo: past.length > 0, canRedo: future.length > 0 };
}
