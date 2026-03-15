import React from "react";
import { FormGroup, TextInput, Toggle, NumberInput } from "./FormPrimitives";
import type { EditPanelProps } from "../editor/BlockEditPanel";

function SelectorInput({ value, onChange, findBy, onFindByChange }: {
  value: string;
  onChange: (v: string) => void;
  findBy: string;
  onFindByChange: (v: string) => void;
}) {
  return (
    <FormGroup label="Element selector">
      <select
        value={findBy || "cssSelector"}
        onChange={e => onFindByChange(e.target.value)}
        className="w-full text-xs px-2 py-1.5 mb-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
      >
        <option value="cssSelector">CSS Selector</option>
        <option value="xpath">XPath</option>
        <option value="deepCss">Deep CSS</option>
      </select>
      <TextInput
        value={value || ""}
        onChange={onChange}
        placeholder={findBy === 'xpath' ? "//div[@class='example']" : ".class-name, #id"}
      />
    </FormGroup>
  );
}

export { SelectorInput };

export function EditNewTabPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="URL">
        <TextInput
          type="url"
          value={data.url || ""}
          onChange={v => onChange({ url: v })}
          placeholder="https://example.com"
        />
      </FormGroup>
      <Toggle
        checked={data.active ?? true}
        onChange={v => onChange({ active: v })}
        label="Make tab active"
      />
      <div className="mt-3">
        <Toggle
          checked={data.waitTabLoaded ?? false}
          onChange={v => onChange({ waitTabLoaded: v })}
          label="Wait for tab to load"
        />
      </div>
      <div className="mt-3">
        <Toggle
          checked={data.updatePrevTab ?? false}
          onChange={v => onChange({ updatePrevTab: v })}
          label="Update previous tab URL instead"
        />
      </div>
      <div className="mt-4">
        <FormGroup label="Description (optional)">
          <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
        </FormGroup>
      </div>
    </div>
  );
}

export function EditClickElementPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <SelectorInput
        value={data.selector || ""}
        onChange={v => onChange({ selector: v })}
        findBy={data.findBy || "cssSelector"}
        onFindByChange={v => onChange({ findBy: v })}
      />
      <Toggle
        checked={data.waitForSelector ?? false}
        onChange={v => onChange({ waitForSelector: v })}
        label="Wait for element to appear"
      />
      {data.waitForSelector && (
        <div className="mt-2">
          <FormGroup label="Wait timeout (ms)">
            <NumberInput value={data.waitSelectorTimeout || 5000} onChange={v => onChange({ waitSelectorTimeout: v })} step={500} />
          </FormGroup>
        </div>
      )}
      <div className="mt-3">
        <Toggle
          checked={data.multiple ?? false}
          onChange={v => onChange({ multiple: v })}
          label="Click all matching elements"
        />
      </div>
      <div className="mt-4">
        <FormGroup label="Description (optional)">
          <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
        </FormGroup>
      </div>
    </div>
  );
}

export function EditGetTextPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <SelectorInput
        value={data.selector || ""}
        onChange={v => onChange({ selector: v })}
        findBy={data.findBy || "cssSelector"}
        onFindByChange={v => onChange({ findBy: v })}
      />
      <Toggle
        checked={data.waitForSelector ?? false}
        onChange={v => onChange({ waitForSelector: v })}
        label="Wait for element"
      />
      <div className="mt-3">
        <Toggle
          checked={data.saveData ?? true}
          onChange={v => onChange({ saveData: v })}
          label="Save to data column"
        />
      </div>
      {data.saveData && (
        <div className="mt-2">
          <FormGroup label="Data column name">
            <TextInput value={data.dataColumn || ""} onChange={v => onChange({ dataColumn: v })} placeholder="Column name" />
          </FormGroup>
        </div>
      )}
      <div className="mt-3">
        <Toggle
          checked={data.assignVariable ?? false}
          onChange={v => onChange({ assignVariable: v })}
          label="Assign to variable"
        />
      </div>
      {data.assignVariable && (
        <FormGroup label="Variable name">
          <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="myVariable" />
        </FormGroup>
      )}
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditFormsPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Input type">
        <select
          value={data.type || "text-field"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="text-field" className="bg-white dark:bg-gray-800">Text input</option>
          <option value="select" className="bg-white dark:bg-gray-800">Select / Dropdown</option>
          <option value="checkbox" className="bg-white dark:bg-gray-800">Checkbox</option>
          <option value="radio" className="bg-white dark:bg-gray-800">Radio button</option>
        </select>
      </FormGroup>
      <SelectorInput
        value={data.selector || ""}
        onChange={v => onChange({ selector: v })}
        findBy={data.findBy || "cssSelector"}
        onFindByChange={v => onChange({ findBy: v })}
      />
      <FormGroup label="Value to enter">
        <TextInput value={data.value || ""} onChange={v => onChange({ value: v })} placeholder="Enter value" />
      </FormGroup>
      <Toggle
        checked={data.waitForSelector ?? false}
        onChange={v => onChange({ waitForSelector: v })}
        label="Wait for element"
      />
      <div className="mt-3">
        <Toggle
          checked={data.clearValue ?? true}
          onChange={v => onChange({ clearValue: v })}
          label="Clear existing value first"
        />
      </div>
    </div>
  );
}

export function EditJavascriptCodePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Execution context">
        <select
          value={data.context || "website"}
          onChange={e => onChange({ context: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="website">In the website context</option>
          <option value="background">In the background script</option>
        </select>
      </FormGroup>
      <FormGroup label="JavaScript code">
        <textarea
          value={data.code || ""}
          onChange={e => onChange({ code: e.target.value })}
          rows={10}
          className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-900 text-green-400 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder={`console.log("Hello world!");\nautomaNextBlock()`}
        />
      </FormGroup>
      <FormGroup label="Timeout (ms)">
        <NumberInput value={data.timeout || 20000} onChange={v => onChange({ timeout: v })} step={1000} />
      </FormGroup>
    </div>
  );
}

export function EditWebhookPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="URL">
        <TextInput type="url" value={data.url || ""} onChange={v => onChange({ url: v })} placeholder="https://api.example.com/endpoint" />
      </FormGroup>
      <FormGroup label="HTTP Method">
        <select
          value={data.method || "POST"}
          onChange={e => onChange({ method: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg"
        >
          {["GET", "POST", "PUT", "PATCH", "DELETE"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </FormGroup>
      <FormGroup label="Content type">
        <select
          value={data.contentType || "json"}
          onChange={e => onChange({ contentType: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="json">JSON</option>
          <option value="form-data">Form data</option>
          <option value="plain-text">Plain text</option>
        </select>
      </FormGroup>
      {data.method !== "GET" && (
        <FormGroup label="Request body">
          <textarea
            value={data.body || "{}"}
            onChange={e => onChange({ body: e.target.value })}
            rows={6}
            className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          />
        </FormGroup>
      )}
      <FormGroup label="Timeout (ms)">
        <NumberInput value={data.timeout || 10000} onChange={v => onChange({ timeout: v })} step={1000} />
      </FormGroup>
      <Toggle
        checked={data.assignVariable ?? false}
        onChange={v => onChange({ assignVariable: v })}
        label="Save response to variable"
      />
      {data.assignVariable && (
        <FormGroup label="Variable name">
          <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="responseVar" />
        </FormGroup>
      )}
    </div>
  );
}

export function EditDelayPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Delay duration (ms)">
        <NumberInput value={data.time || 500} onChange={v => onChange({ time: v })} step={100} min={0} />
      </FormGroup>
      <p className="text-xs text-gray-400 mt-1">1000ms = 1 second</p>
    </div>
  );
}

import { workflowService } from "~services/WorkflowService";

export function EditExecuteWorkflowPanel({ data, onChange }: EditPanelProps) {
  const [workflows, setWorkflows] = React.useState<{ id: string; name: string }[]>([]);

  React.useEffect(() => {
    const list = workflowService.getWorkflows();
    setWorkflows(list.map(w => ({ id: w.id, name: w.name })));
  }, []);

  return (
    <div>
      <FormGroup label="Select workflow">
        <select
          value={data.workflowId || ""}
          onChange={e => onChange({ workflowId: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
        >
          <option value="" className="bg-white dark:bg-gray-800">Select a workflow...</option>
          {workflows.map(w => (
            <option key={w.id} value={w.id} className="bg-white dark:bg-gray-800">{w.name}</option>
          ))}
        </select>
      </FormGroup>
      <FormGroup label="Global data (JSON - optional)">
        <textarea
          value={data.globalData || ""}
          onChange={e => onChange({ globalData: e.target.value })}
          rows={5}
          className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder='{"key": "value"}'
        />
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">Pass initial variables to the child workflow</p>
      </FormGroup>
      <div className="mt-4">
        <FormGroup label="Description (optional)">
          <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
        </FormGroup>
      </div>
    </div>
  );
}

export function EditExportDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Filename">
        <TextInput value={data.name || ""} onChange={v => onChange({ name: v })} placeholder="export-filename" />
        <p className="text-[10px] text-gray-400 mt-1">Leave empty to use 'export'</p>
      </FormGroup>
      <FormGroup label="Format">
        <select
          value={data.type || "json"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
        >
          <option value="json" className="bg-white dark:bg-gray-800">JSON</option>
          <option value="csv" className="bg-white dark:bg-gray-800">CSV</option>
        </select>
      </FormGroup>
      <div className="mt-4">
        <FormGroup label="Description (optional)">
          <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
        </FormGroup>
      </div>
    </div>
  );
}

export function EditClipboardPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Action">
        <select
          value={data.type || "get"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
        >
          <option value="get" className="bg-white dark:bg-gray-800">Get text</option>
          <option value="set" className="bg-white dark:bg-gray-800">Set text</option>
        </select>
      </FormGroup>

      {data.type === "set" ? (
        <FormGroup label="Data to copy">
          <textarea
            value={data.dataToCopy || ""}
            onChange={e => onChange({ dataToCopy: e.target.value })}
            rows={4}
            className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
            placeholder="Text to copy to clipboard..."
          />
        </FormGroup>
      ) : (
        <div className="space-y-3">
          <Toggle
            checked={data.assignVariable || false}
            onChange={v => onChange({ assignVariable: v })}
            label="Assign to variable"
          />
          {data.assignVariable && (
            <FormGroup label="Variable name">
              <TextInput
                value={data.variableName || ""}
                onChange={v => onChange({ variableName: v })}
                placeholder="clipboardValue"
              />
            </FormGroup>
          )}
        </div>
      )}

      <div className="mt-4">
        <FormGroup label="Description (optional)">
          <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
        </FormGroup>
      </div>
    </div>
  );
}

export function GenericEditPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-4">Configure this block's settings:</p>
      {Object.entries(data).filter(([k]) => !['disableBlock', '$breakpoint', 'actions'].includes(k)).map(([key, val]) => {
        if (typeof val === 'boolean') {
          return (
            <div className="mb-3" key={key}>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input type="checkbox" checked={val} onChange={e => onChange({ [key]: e.target.checked })} className="rounded" />
              </label>
            </div>
          );
        }
        if (typeof val === 'number') {
          return (
            <FormGroup label={key.replace(/([A-Z])/g, ' $1')} key={key}>
              <NumberInput value={val} onChange={v => onChange({ [key]: v })} />
            </FormGroup>
          );
        }
        if (typeof val === 'string') {
          return (
            <FormGroup label={key.replace(/([A-Z])/g, ' $1')} key={key}>
              <TextInput value={val} onChange={v => onChange({ [key]: v })} />
            </FormGroup>
          );
        }
        return null;
      })}
    </div>
  );
}
