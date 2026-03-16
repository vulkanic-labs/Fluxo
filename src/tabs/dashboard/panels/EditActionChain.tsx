import React, { useState } from "react";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp, ChevronRight, Settings2 } from "lucide-react";
import { FormGroup, TextInput, Toggle } from "./FormPrimitives";
import type { EditPanelProps } from "../editor/BlockEditPanel";

const ACTION_TYPES = [
  { value: "click", label: "Click Element" },
  { value: "right_click", label: "Right Click" },
  { value: "forms", label: "Input / Form Field" },
  { value: "get-text", label: "Get Text / Attribute" },
  { value: "hover-element", label: "Hover" },
  { value: "element-scroll", label: "Scroll" },
  { value: "javascript-code", label: "Custom Script" },
  { value: "wait", label: "Wait / Condition" },
  { value: "log", label: "Log Message" },
];

interface StepProps {
  step: any;
  index: number;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  depth?: number;
}

// Helper to generate IDs safely
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
};

function ActionStep({ step, index, onUpdate, onRemove, onMoveUp, onMoveDown, depth = 0 }: StepProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateParams = (paramUpdates: any) => {
    onUpdate({ 
      params: { ...step.params, ...paramUpdates } 
    });
  };

  const addPostAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    const postActions = step.params?.postActions || [];
    updateParams({
      postActions: [
        ...postActions,
        { action: "click", id: generateId(), params: { selector: "" } }
      ]
    });
    setIsExpanded(true);
  };

  return (
    <div className={`group border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-all ${depth > 0 ? 'ml-6 border-l-4 border-l-amber-500/40' : ''}`}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center flex-wrap gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="text-gray-400 shrink-0">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </div>
          <div className="p-1 -ml-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 dark:text-gray-600 transition-colors shrink-0" onClick={(e) => e.stopPropagation()}>
            <GripVertical size={14} />
          </div>
          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] font-bold text-gray-500 dark:text-gray-400">
            {index + 1}
          </span>
          
          <div className="flex items-center gap-2 min-w-0" onClick={(e) => e.stopPropagation()}>
            <select
              value={step.action}
              onChange={(e) => onUpdate({ action: e.target.value })}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-gray-700 dark:text-gray-200 min-w-0"
            >
              {ACTION_TYPES.map(type => (
                <option key={type.value} value={type.value} className="bg-white dark:bg-gray-800">{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            title="Action Settings"
            className={`p-1.5 rounded-lg transition-all ${showAdvanced ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
          >
            <Settings2 size={14} />
          </button>
          <div className="h-4 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1" />
          <button onClick={onMoveUp} className="p-1 px-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 transition-colors"><ChevronUp size={14} /></button>
          <button onClick={onMoveDown} className="p-1 px-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-400 transition-colors"><ChevronDown size={14} /></button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }} 
            className="p-1.5 ml-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-500 transition-all"
            title="Remove Step"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 bg-white dark:bg-gray-800 transition-all animate-in slide-in-from-top-2 duration-200">
          {step.action !== "log" && (
            <FormGroup label="Selector (Optional if relative)">
              <TextInput 
                value={step.params?.selector || step.selector || ""} 
                onChange={(v) => onUpdate({ selector: v, params: { ...step.params, selector: v } })}
                placeholder="e.g. .btn, variables.mySelector"
              />
            </FormGroup>
          )}

          {step.action === "forms" && (
            <FormGroup label="Value to type">
              <TextInput 
                value={step.params?.value || ""} 
                onChange={(v) => updateParams({ value: v })}
                placeholder="e.g. My Username"
              />
            </FormGroup>
          )}

          {step.action === "get-text" && (
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Property">
                <TextInput value={step.params?.property || "innerText"} onChange={(v) => updateParams({ property: v })} />
              </FormGroup>
              <FormGroup label="Save to Variable">
                <TextInput value={step.params?.variableName || ""} onChange={(v) => updateParams({ variableName: v })} placeholder="var_name" />
              </FormGroup>
            </div>
          )}

          {step.action === "wait" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Index (all, 0, variables.idx)">
                  <TextInput value={step.params?.index || "0"} onChange={(v) => updateParams({ index: v })} />
                </FormGroup>
                <FormGroup label="Timeout (ms)">
                  <TextInput value={step.params?.timeout || "10000"} onChange={(v) => updateParams({ timeout: v })} />
                </FormGroup>
              </div>
              
              {showAdvanced && (
                <div className="bg-amber-50/50 dark:bg-amber-900/5 p-3 rounded-xl border border-amber-100 dark:border-amber-900/20 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="Save Count to Var">
                      <TextInput value={step.params?.saveCountTo || ""} onChange={(v) => updateParams({ saveCountTo: v })} placeholder="count_var" />
                    </FormGroup>
                    <FormGroup label="Extract to Var">
                      <TextInput value={step.params?.extract?.saveTo || ""} onChange={(v) => updateParams({ extract: { ...step.params.extract, saveTo: v } })} placeholder="val_var" />
                    </FormGroup>
                  </div>
                  <Toggle checked={step.params?.invisible || false} onChange={(v) => updateParams({ invisible: v })} label="Wait for disappear (Invisible)" />
                  <FormGroup label="Match Condition (Text contains)">
                    <TextInput value={step.params?.conditionParams?.text || ""} onChange={(v) => updateParams({ condition: v ? "element_match" : "", conditionParams: { text: v } })} placeholder="Text to match..." />
                  </FormGroup>
                </div>
              )}
            </>
          )}

          {step.action === "log" && (
            <FormGroup label="Log Message">
              <TextInput value={step.params?.message || ""} onChange={(v) => updateParams({ message: v })} placeholder="Found {variables.count} elements" />
            </FormGroup>
          )}

          {step.action === "javascript-code" && (
            <FormGroup label="Custom Script">
              <textarea
                value={step.params?.code || ""}
                onChange={(e) => updateParams({ code: e.target.value })}
                className="w-full text-[11px] font-mono p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-gray-800 dark:text-gray-200 transition-all"
                placeholder="// variables, tableData available"
              />
            </FormGroup>
          )}

          {/* postActions support */}
          {step.action === "wait" && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Post Actions</span>
                  <span className="text-[10px] text-gray-400 italic">Nested sub-flow</span>
                </div>
                <button 
                  onClick={addPostAction} 
                  className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors border border-amber-200 dark:border-amber-800"
                >
                  <Plus size={12} />
                  SUB-STEP
                </button>
              </div>
              <div className="space-y-3">
                {(step.params?.postActions || []).map((pStep: any, pIdx: number) => (
                  <ActionStep 
                    key={pStep.id}
                    step={pStep}
                    index={pIdx}
                    depth={depth + 1}
                    onUpdate={(up) => {
                      const next = [...(step.params.postActions || [])];
                      next[pIdx] = { ...next[pIdx], ...up };
                      updateParams({ postActions: next });
                    }}
                    onRemove={() => {
                      updateParams({ postActions: step.params.postActions.filter((_: any, i: number) => i !== pIdx) });
                    }}
                    onMoveUp={() => {
                      if (pIdx === 0) return;
                      const next = [...step.params.postActions];
                      [next[pIdx], next[pIdx-1]] = [next[pIdx-1], next[pIdx]];
                      updateParams({ postActions: next });
                    }}
                    onMoveDown={() => {
                      if (pIdx === step.params.postActions.length - 1) return;
                      const next = [...step.params.postActions];
                      [next[pIdx], next[pIdx+1]] = [next[pIdx+1], next[pIdx]];
                      updateParams({ postActions: next });
                    }}
                  />
                ))}
                {(step.params?.postActions || []).length === 0 && (
                  <div className="text-center py-6 bg-gray-50/50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                    <p className="text-[10px] text-gray-400">No post-actions configured</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/30">
            <Toggle checked={step.params?.optional || false} onChange={(v) => updateParams({ optional: v })} label="Optional Step" />
            <div className="text-[9px] text-gray-300 dark:text-gray-600 font-mono select-all bg-gray-50 dark:bg-gray-900/50 px-1.5 py-0.5 rounded">
              ID: {step.id?.slice(0, 8)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function EditActionChain({ data, onChange }: EditPanelProps) {
  const steps = data.steps || [];

  const addStep = () => {
    const newSteps = [...steps, { action: "click", params: { selector: "" }, id: generateId() }];
    onChange({ steps: newSteps });
  };

  const updateStepAt = (index: number, updates: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    onChange({ steps: newSteps });
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center flex-wrap justify-between sticky top-0 bg-white/10 dark:bg-gray-900/10 backdrop-blur-md z-10 py-2 border-b border-gray-100 dark:border-gray-800 -mx-4 px-4 mb-4">
        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 tracking-tight truncate">Sequence Execution</h3>
          <p className="text-[10px] text-gray-400 truncate">Chained actions with shared context</p>
        </div>
        <button
          onClick={addStep}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none shrink-0"
        >
          <Plus size={14} />
          ADD ACTION
        </button>
      </div>

      <div className="space-y-4">
        {steps.map((step: any, index: number) => (
          <ActionStep 
            key={step.id || index}
            step={step}
            index={index}
            onUpdate={(up) => updateStepAt(index, up)}
            onRemove={() => {
              const next = steps.filter((_: any, i: number) => i !== index);
              onChange({ steps: next });
            }}
            onMoveUp={() => {
              if (index === 0) return;
              const next = [...steps];
              [next[index], next[index-1]] = [next[index-1], next[index]];
              onChange({ steps: next });
            }}
            onMoveDown={() => {
              if (index === steps.length - 1) return;
              const next = [...steps];
              [next[index], next[index+1]] = [next[index+1], next[index]];
              onChange({ steps: next });
            }}
          />
        ))}
        {steps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-3xl bg-gray-50/50 dark:bg-gray-900/20 gap-3 group hover:border-amber-200 transition-colors cursor-pointer" onClick={addStep}>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm text-gray-300 group-hover:text-amber-500 transition-colors">
              <Plus size={24} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">Your sequence is empty</p>
              <p className="text-[11px] text-gray-300 dark:text-gray-600">Click to add your first interactive step</p>
            </div>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
        <FormGroup label="Description / Summary">
          <TextInput 
            value={data.description || ""} 
            onChange={(v) => onChange({ description: v })} 
            placeholder="Describe what this chain does..."
          />
        </FormGroup>
        
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
            <strong>Pro Tip:</strong> Actions share a DOM context. If step 1 finds a scroll container, step 2 can interact with elements relative to it without re-specifying the base selector.
          </p>
        </div>
      </div>
    </div>
  );
}
