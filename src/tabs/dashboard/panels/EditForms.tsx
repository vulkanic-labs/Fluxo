import React from "react";
import { FormGroup, TextInput, Toggle, NumberInput, FormDivider, KeyValueList, CodeEditor } from "./FormPrimitives";
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

const PROTOCOLS = [
  { value: 'https://', label: 'HTTPS' },
  { value: 'http://', label: 'HTTP' },
  { value: 'ftp://', label: 'FTP' },
  { value: 'file://', label: 'FILE' },
  { value: 'mailto:', label: 'MAILTO' },
];

export function EditNewTabPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="URL">
        <div className="flex gap-2">
          <select
            value={data.protocol || "https://"}
            onChange={e => onChange({ protocol: e.target.value, url: e.target.value + (data.urlPath || "") })}
            className="w-24 text-sm px-2 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            {PROTOCOLS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <TextInput
            value={data.urlPath || ""}
            onChange={v => onChange({ urlPath: v, url: (data.protocol || "https://") + v })}
            placeholder="example.com"
          />
        </div>
      </FormGroup>
      <div className="space-y-3">
        <Toggle
          checked={data.active ?? true}
          onChange={v => onChange({ active: v })}
          label="Make tab active"
        />
        <Toggle
          checked={data.waitTabLoaded ?? false}
          onChange={v => onChange({ waitTabLoaded: v })}
          label="Wait for tab to load"
        />
        <Toggle
          checked={data.updatePrevTab ?? false}
          onChange={v => onChange({ updatePrevTab: v })}
          label="Update previous tab instead"
        />
        <Toggle
          checked={data.inGroup ?? false}
          onChange={v => onChange({ inGroup: v })}
          label="Open in tab group"
        />
        <Toggle
          checked={data.customUserAgent ?? false}
          onChange={v => onChange({ customUserAgent: v })}
          label="Custom User Agent"
        />
        {data.customUserAgent && (
          <TextInput 
            value={data.userAgent || ""} 
            onChange={v => onChange({ userAgent: v })} 
            placeholder="Mozilla/5.0..." 
          />
        )}
      </div>
      <div className="mt-4">
        <FormGroup label={`Tab Zoom (${data.tabZoom || 1}x)`}>
          <input 
            type="range" 
            min="0.25" 
            max="4.5" 
            step="0.25" 
            value={data.tabZoom || 1} 
            onChange={e => onChange({ tabZoom: Number(e.target.value) })}
            className="w-full accent-amber-500 mb-2"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0.25x</span>
            <span>1x</span>
            <span>4.5x</span>
          </div>
        </FormGroup>
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
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
      <div className="mt-3 space-y-3">
        <Toggle
          checked={data.multiple ?? false}
          onChange={v => onChange({ multiple: v })}
          label="Click all matching elements"
        />
        <Toggle
          checked={data.markEl ?? false}
          onChange={v => onChange({ markEl: v })}
          label="Mark element (visual highlight)"
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
      <div className="space-y-3">
        <Toggle
          checked={data.waitForSelector ?? false}
          onChange={v => onChange({ waitForSelector: v })}
          label="Wait for element"
        />
        <Toggle
          checked={data.saveData ?? true}
          onChange={v => onChange({ saveData: v })}
          label="Save to data column"
        />
        {data.saveData && (
          <FormGroup label="Data column name">
            <TextInput value={data.dataColumn || ""} onChange={v => onChange({ dataColumn: v })} placeholder="Column name" />
          </FormGroup>
        )}
        <Toggle
          checked={data.assignVariable ?? false}
          onChange={v => onChange({ assignVariable: v })}
          label="Assign to variable"
        />
        {data.assignVariable && (
          <FormGroup label="Variable name">
            <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="myVariable" />
          </FormGroup>
        )}
        <Toggle
          checked={data.multiple ?? false}
          onChange={v => onChange({ multiple: v })}
          label="Get text from all matching elements"
        />
        <Toggle
          checked={data.markEl ?? false}
          onChange={v => onChange({ markEl: v })}
          label="Mark element"
        />
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditLogDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Workflow ID">
        <TextInput value={data.workflowId || ""} onChange={v => onChange({ workflowId: v })} placeholder="ID of the workflow" />
      </FormGroup>
      <div className="space-y-3 mb-4">
        <Toggle
          checked={data.saveData ?? true}
          onChange={v => onChange({ saveData: v })}
          label="Save to data column"
        />
        {data.saveData && (
          <FormGroup label="Data column name">
            <TextInput value={data.dataColumn || ""} onChange={v => onChange({ dataColumn: v })} placeholder="logs" />
          </FormGroup>
        )}
        <Toggle
          checked={data.assignVariable ?? false}
          onChange={v => onChange({ assignVariable: v })}
          label="Assign to variable"
        />
        {data.assignVariable && (
          <FormGroup label="Variable name">
            <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="logsVar" />
          </FormGroup>
        )}
      </div>
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
        <Toggle
          checked={data.multiple ?? false}
          onChange={v => onChange({ multiple: v })}
          label="Apply to all matching elements"
        />
        <Toggle
          checked={data.markEl ?? false}
          onChange={v => onChange({ markEl: v })}
          label="Mark element"
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
      <KeyValueList 
        title="Headers"
        items={data.headers || []}
        onChange={v => onChange({ headers: v })}
        keyPlaceholder="Header Name"
        valuePlaceholder="Value"
      />
      {data.method !== "GET" && (
        <CodeEditor
          label="Request body"
          value={data.body || "{}"}
          onChange={v => onChange({ body: v })}
          rows={6}
          placeholder='{"key": "value"}'
        />
      )}
      <FormGroup label="Timeout (ms)">
        <NumberInput value={data.timeout || 10000} onChange={v => onChange({ timeout: v })} step={1000} />
      </FormGroup>
      
      <FormDivider />
      
      <FormGroup label="Response handling">
        <select
          value={data.responseType || "json"}
          onChange={e => onChange({ responseType: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors mb-2"
        >
          <option value="json">JSON</option>
          <option value="text">Plain text</option>
          <option value="base64">Base64</option>
        </select>
        {data.responseType === 'json' && (
          <TextInput 
            value={data.dataPath || ""} 
            onChange={v => onChange({ dataPath: v })} 
            placeholder="path.to.data (optional)" 
          />
        )}
      </FormGroup>

      <Toggle
        checked={data.assignVariable ?? false}
        onChange={v => onChange({ assignVariable: v })}
        label="Save response to variable"
      />
      {data.assignVariable && (
        <div className="mt-2">
          <FormGroup label="Variable name">
            <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="responseVar" />
          </FormGroup>
        </div>
      )}
    </div>
  );
}

export function EditDelayPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label={`Delay duration: ${data.time || 500}ms`}>
        <input 
          type="range" 
          min="0" 
          max="30000" 
          step="100" 
          value={data.time || 500} 
          onChange={e => onChange({ time: Number(e.target.value) })}
          className="w-full accent-amber-500"
        />
      </FormGroup>
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>0s</span>
        <span>15s</span>
        <span>30s</span>
      </div>
    </div>
  );
}

export function EditTabURLPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Data source">
        <select
          value={data.type || "active-tab"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="active-tab">Active tab</option>
          <option value="all-tabs">All tabs</option>
          <option value="query">Query tab</option>
        </select>
      </FormGroup>
      {data.type === 'query' && (
        <div className="space-y-3 mb-4">
          <FormGroup label="Title query">
            <TextInput value={data.qTitle || ""} onChange={v => onChange({ qTitle: v })} placeholder="e.g. Google Search" />
          </FormGroup>
          <FormGroup label="Match patterns">
            <TextInput value={data.qMatchPatterns || ""} onChange={v => onChange({ qMatchPatterns: v })} placeholder="*://*.google.com/*" />
          </FormGroup>
        </div>
      )}
      <div className="space-y-3 mb-4">
        <Toggle
          checked={data.saveData ?? true}
          onChange={v => onChange({ saveData: v })}
          label="Save to data column"
        />
        {data.saveData && (
          <FormGroup label="Data column name">
            <TextInput value={data.dataColumn || ""} onChange={v => onChange({ dataColumn: v })} placeholder="url" />
          </FormGroup>
        )}
        <Toggle
          checked={data.assignVariable ?? false}
          onChange={v => onChange({ assignVariable: v })}
          label="Assign to variable"
        />
        {data.assignVariable && (
          <FormGroup label="Variable name">
            <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="tabUrl" />
          </FormGroup>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditCookiePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Action">
        <select
          value={data.type || "get"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="get">Get cookie</option>
          <option value="set">Set cookie</option>
          <option value="delete">Delete cookie</option>
        </select>
      </FormGroup>
      <div className="space-y-3">
        <FormGroup label="Cookie name">
          <TextInput value={data.name || ""} onChange={v => onChange({ name: v })} placeholder="session_id" />
        </FormGroup>
        <FormGroup label="URL">
          <TextInput value={data.url || ""} onChange={v => onChange({ url: v })} placeholder="https://example.com" />
        </FormGroup>
        {data.type === 'set' && (
          <>
            <FormGroup label="Value">
              <TextInput value={data.value || ""} onChange={v => onChange({ value: v })} placeholder="" />
            </FormGroup>
            <FormGroup label="Domain (optional)">
              <TextInput value={data.domain || ""} onChange={v => onChange({ domain: v })} placeholder=".example.com" />
            </FormGroup>
            <FormGroup label="Path (optional)">
              <TextInput value={data.path || "/"} onChange={v => onChange({ path: v })} placeholder="/" />
            </FormGroup>
          </>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditCreateElementPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="HTML Content">
        <textarea
          value={data.html || ""}
          onChange={e => onChange({ html: e.target.value })}
          rows={5}
          className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder="<div>Hello!</div>"
        />
      </FormGroup>
      <FormGroup label="CSS Rules">
        <textarea
          value={data.css || ""}
          onChange={e => onChange({ css: e.target.value })}
          rows={3}
          className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder=".my-el { color: red; }"
        />
      </FormGroup>
      <FormGroup label="JavaScript (optional)">
        <textarea
          value={data.javascript || ""}
          onChange={e => onChange({ javascript: e.target.value })}
          rows={3}
          className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder="element.addEventListener('click', ...)"
        />
      </FormGroup>
      <FormDivider />
      <FormGroup label="Target selector (where to insert)">
        <TextInput value={data.selector || "body"} onChange={v => onChange({ selector: v })} placeholder="body" />
      </FormGroup>
      <FormGroup label="Insertion point">
        <select
          value={data.insertAt || "after"}
          onChange={e => onChange({ insertAt: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg"
        >
          <option value="after">After the target</option>
          <option value="before">Before the target</option>
          <option value="append">Append to target</option>
          <option value="prepend">Prepend to target</option>
        </select>
      </FormGroup>
    </div>
  );
}

export function EditIncreaseVariablePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Variable name">
        <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="myCounter" />
      </FormGroup>
      <FormGroup label="Amount to increase (can be negative)">
        <NumberInput value={data.increaseBy || 1} onChange={v => onChange({ increaseBy: v })} step={1} />
      </FormGroup>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditSliceVariablePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Variable name">
        <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="myVariable" />
      </FormGroup>
      <div className="grid grid-cols-2 gap-4">
        <FormGroup label="Start index">
          <NumberInput value={data.startIndex || 0} onChange={v => onChange({ startIndex: v })} min={0} />
        </FormGroup>
        <FormGroup label="End index">
          <div className="flex flex-col gap-1.5">
            <Toggle 
              checked={data.endIdxEnabled || false} 
              onChange={v => onChange({ endIdxEnabled: v })} 
              label="Enable" 
            />
            {data.endIdxEnabled && (
              <NumberInput value={data.endIndex || 0} onChange={v => onChange({ endIndex: v })} min={0} />
            )}
          </div>
        </FormGroup>
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditNotificationPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Title">
        <TextInput value={data.title || "Hello world!"} onChange={v => onChange({ title: v })} placeholder="Notification Title" />
      </FormGroup>
      <FormGroup label="Message">
        <textarea
          value={data.message || ""}
          onChange={e => onChange({ message: e.target.value })}
          rows={4}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder="Message to display..."
        />
      </FormGroup>
      <FormGroup label="Icon URL (optional)">
        <TextInput value={data.iconUrl || ""} onChange={v => onChange({ iconUrl: v })} placeholder="https://example.com/icon.png" />
      </FormGroup>
      <FormGroup label="Image URL (optional)">
        <TextInput value={data.imageUrl || ""} onChange={v => onChange({ imageUrl: v })} placeholder="https://example.com/image.png" />
      </FormGroup>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
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
      <FormGroup label="Execution ID (optional)">
        <TextInput value={data.executeId || ""} onChange={v => onChange({ executeId: v })} placeholder="e.g. child-wf-1" />
      </FormGroup>
      <div className="space-y-3 mb-4">
        <Toggle 
          checked={data.insertAllGlobalData ?? false} 
          onChange={v => onChange({ insertAllGlobalData: v })} 
          label="Pass all global data"
        />
        <Toggle 
          checked={data.insertAllVars ?? false} 
          onChange={v => onChange({ insertAllVars: v })} 
          label="Pass all variables"
        />
      </div>
      {!data.insertAllVars && (
        <FormGroup label="Variables to pass (comma separated)">
          <TextInput 
            value={data.insertVars || ""} 
            onChange={v => onChange({ insertVars: v })} 
            placeholder="var1, var2, var3" 
          />
        </FormGroup>
      )}
      <FormGroup label="Initial variables (JSON - optional)">
        <textarea
          value={data.globalData || ""}
          onChange={e => onChange({ globalData: e.target.value })}
          rows={5}
          className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
          placeholder='{"key": "value"}'
        />
      </FormGroup>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditExportDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Data to export">
        <select
          value={data.dataToExport || "data-columns"}
          onChange={e => onChange({ dataToExport: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="data-columns">Table Data</option>
          <option value="google-sheets">Google Sheets</option>
          <option value="variable">Variables</option>
        </select>
      </FormGroup>

      {data.dataToExport === 'google-sheets' && (
        <FormGroup label="Reference key">
          <TextInput value={data.refKey || ""} onChange={v => onChange({ refKey: v })} placeholder="Sheet reference" />
        </FormGroup>
      )}

      {data.dataToExport === 'variable' && (
        <FormGroup label="Variable name">
          <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="myVariable" />
        </FormGroup>
      )}

      <FormGroup label="Filename">
        <TextInput value={data.name || ""} onChange={v => onChange({ name: v })} placeholder="export-filename" />
      </FormGroup>

      <FormGroup label="Format">
        <select
          value={data.type || "json"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="txt">Text file</option>
        </select>
      </FormGroup>

      <FormGroup label="On conflict">
        <select
          value={data.onConflict || "uniquify"}
          onChange={e => onChange({ onConflict: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="uniquify">Make filename unique</option>
          <option value="overwrite">Overwrite existing file</option>
          <option value="prompt">Ask where to save</option>
        </select>
      </FormGroup>

      {data.type === 'csv' && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 space-y-3 mb-4">
          <Toggle 
            checked={data.addBOMHeader ?? false} 
            onChange={v => onChange({ addBOMHeader: v })} 
            label="Add BOM (for Excel support)"
          />
          <FormGroup label="CSV Delimiter">
            <TextInput value={data.csvDelimiter || ","} onChange={v => onChange({ csvDelimiter: v })} placeholder="," />
          </FormGroup>
        </div>
      )}

      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
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
          <option value="get">Get text from clipboard</option>
          <option value="set">Set text to clipboard</option>
        </select>
      </FormGroup>

      {data.type === "set" ? (
        <div className="space-y-3">
          <Toggle 
            checked={data.copySelectedText ?? false} 
            onChange={v => onChange({ copySelectedText: v })} 
            label="Copy currently selected text"
          />
          {!data.copySelectedText && (
            <FormGroup label="Data to copy">
              <textarea
                value={data.dataToCopy || ""}
                onChange={e => onChange({ dataToCopy: e.target.value })}
                rows={4}
                className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none transition-colors"
                placeholder="Text to copy to clipboard..."
              />
            </FormGroup>
          )}
        </div>
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
          <Toggle
            checked={data.saveData ?? true}
            onChange={v => onChange({ saveData: v })}
            label="Save to data column"
          />
          {data.saveData && (
            <FormGroup label="Data column name">
              <TextInput
                value={data.dataColumn || ""}
                onChange={v => onChange({ dataColumn: v })}
                placeholder="clipboard"
              />
            </FormGroup>
          )}
        </div>
      )}

      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}
export function EditLoopDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Loop ID">
        <TextInput value={data.loopId || ""} onChange={v => onChange({ loopId: v })} placeholder="unique-loop-id" />
      </FormGroup>
      <FormGroup label="Loop through">
        <select
          value={data.loopThrough || "data-columns"}
          onChange={e => onChange({ loopThrough: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="data-columns">Table rows</option>
          <option value="numbers">Range of numbers</option>
          <option value="variable">Variable (Array/Object)</option>
          <option value="google-sheets">Google Sheets</option>
          <option value="custom-data">Custom JSON data</option>
          <option value="elements">Page elements</option>
        </select>
      </FormGroup>

      {data.loopThrough === 'numbers' && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <FormGroup label="From">
            <NumberInput value={data.fromNumber || 0} onChange={v => onChange({ fromNumber: v })} />
          </FormGroup>
          <FormGroup label="To">
            <NumberInput value={data.toNumber || 10} onChange={v => onChange({ toNumber: v })} />
          </FormGroup>
        </div>
      )}

      {(data.loopThrough === 'variable' || data.loopThrough === 'google-sheets') && (
        <FormGroup label={data.loopThrough === 'variable' ? "Variable name" : "Reference key"}>
          <TextInput value={data.referenceKey || ""} onChange={v => onChange({ referenceKey: v })} placeholder="" />
        </FormGroup>
      )}

      {data.loopThrough === 'custom-data' && (
        <CodeEditor
          label="JSON Data"
          value={data.loopData || "[]"}
          onChange={v => onChange({ loopData: v })}
          rows={6}
        />
      )}

      {data.loopThrough === 'elements' && (
        <SelectorInput
          value={data.elementSelector || ""}
          onChange={v => onChange({ elementSelector: v })}
          findBy={data.findBy || "cssSelector"}
          onFindByChange={v => onChange({ findBy: v })}
        />
      )}

      <FormDivider />

      <div className="space-y-3 mb-4">
        <FormGroup label="Max loops (0 = infinite)">
          <NumberInput value={data.maxLoop || 0} onChange={v => onChange({ maxLoop: v })} min={0} />
        </FormGroup>
        <Toggle
          checked={data.reverseLoop ?? false}
          onChange={v => onChange({ reverseLoop: v })}
          label="Reverse loop order"
        />
        <Toggle
          checked={data.resumeLastWorkflow ?? false}
          onChange={v => onChange({ resumeLastWorkflow: v })}
          label="Resume from last iteration"
        />
      </div>

      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditLoopElementsPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Loop ID">
        <TextInput value={data.loopId || ""} onChange={v => onChange({ loopId: v })} placeholder="unique-loop-id" />
      </FormGroup>
      <SelectorInput
        value={data.selector || ""}
        onChange={v => onChange({ selector: v })}
        findBy={data.findBy || "cssSelector"}
        onFindByChange={v => onChange({ findBy: v })}
      />
      <div className="space-y-3 mb-4">
        <FormGroup label="Max loops (0 = infinite)">
          <NumberInput value={data.maxLoop || 0} onChange={v => onChange({ maxLoop: v })} min={0} />
        </FormGroup>
        <Toggle
          checked={data.reverseLoop ?? false}
          onChange={v => onChange({ reverseLoop: v })}
          label="Reverse loop order"
        />
        <FormDivider />
        <p className="text-xs font-semibold mb-2 uppercase tracking-tight text-gray-500">Interaction & Pagination</p>
        <Toggle
          checked={data.scrollToBottom ?? true}
          onChange={v => onChange({ scrollToBottom: v })}
          label="Scroll to bottom before loop"
        />
        <FormGroup label="Load more action">
          <select
            value={data.loadMoreAction || "none"}
            onChange={e => onChange({ loadMoreAction: e.target.value })}
            className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            <option value="none">None</option>
            <option value="click">Click "Load More" button</option>
            <option value="scroll">Scroll to bottom</option>
          </select>
        </FormGroup>
        {data.loadMoreAction === 'click' && (
          <FormGroup label="Action element selector">
            <TextInput value={data.actionElSelector || ""} onChange={v => onChange({ actionElSelector: v })} placeholder=".load-more-btn" />
          </FormGroup>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditInsertDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Add mappings to insert data into tables or variables.</p>
      <KeyValueList
        title="Data Mappings"
        items={data.dataList || []}
        onChange={v => onChange({ dataList: v })}
        keyPlaceholder="Column/Variable Name"
        valuePlaceholder="Value or {{variable}}"
      />
      <FormDivider />
      <div className="space-y-3">
        <Toggle
          checked={data.isFile ?? false}
          onChange={v => onChange({ isFile: v })}
          label="Import from file"
        />
        {data.isFile && (
          <FormGroup label="File URL / Path">
            <TextInput value={data.filePath || ""} onChange={v => onChange({ filePath: v })} placeholder="file:///path/to/data.json" />
          </FormGroup>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditDeleteDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Select the data items or variables to remove.</p>
      <KeyValueList
        title="Delete List"
        items={data.deleteList || []}
        onChange={v => onChange({ deleteList: v })}
        keyPlaceholder="Column/Variable Name"
        valuePlaceholder="Optional condition"
      />
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditDataMappingPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <KeyValueList
        title="Mapping Rules"
        items={data.mapping || []}
        onChange={v => onChange({ mapping: v })}
        keyPlaceholder="Source key"
        valuePlaceholder="Target variable"
      />
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditSortDataPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Column to sort by">
        <TextInput value={data.dataColumn || ""} onChange={v => onChange({ dataColumn: v })} placeholder="e.g. price" />
      </FormGroup>
      <FormGroup label="Sort order">
        <select
          value={data.order || "asc"}
          onChange={e => onChange({ order: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="asc">Ascending (A-Z, 0-9)</option>
          <option value="desc">Descending (Z-A, 9-0)</option>
        </select>
      </FormGroup>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditRegexVariablePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Variable name">
        <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="sourceVar" />
      </FormGroup>
      <FormGroup label="Regex pattern">
        <TextInput value={data.regex || ""} onChange={v => onChange({ regex: v })} placeholder="[0-9]+" />
      </FormGroup>
      <FormGroup label="Flags">
        <TextInput value={data.flags || "g"} onChange={v => onChange({ flags: v })} placeholder="gim" />
      </FormGroup>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditGoogleDrivePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Action">
        <select
          value={data.type || "upload"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="upload">Upload file</option>
          <option value="download">Download file</option>
          <option value="list">List files in folder</option>
        </select>
      </FormGroup>
      <div className="space-y-3">
        <FormGroup label="File name / Pattern">
          <TextInput value={data.fileName || ""} onChange={v => onChange({ fileName: v })} placeholder="backup.json" />
        </FormGroup>
        {data.type !== 'upload' && (
          <FormGroup label="File/Folder ID">
            <TextInput value={data.fileId || ""} onChange={v => onChange({ fileId: v })} placeholder="Google Drive ID" />
          </FormGroup>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditAiWorkflowPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Input parameters for the AI-powered workflow.</p>
      <FormGroup label="Flow UUID">
        <TextInput value={data.flowUuid || ""} onChange={v => onChange({ flowUuid: v })} placeholder="AI Flow UUID" />
      </FormGroup>
      <FormGroup label="Flow Label">
        <TextInput value={data.flowLabel || ""} onChange={v => onChange({ flowLabel: v })} placeholder="e.g. Data Extractor" />
      </FormGroup>
      <Toggle
        checked={data.assignVariable || false}
        onChange={v => onChange({ assignVariable: v })}
        label="Assign to variable"
      />
      {data.assignVariable && (
        <FormGroup label="Variable Name">
          <TextInput value={data.variableName || ""} onChange={v => onChange({ variableName: v })} placeholder="result" />
        </FormGroup>
      )}
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditWorkflowStatePanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Action Type">
        <select
          value={data.type || "stop-current"}
          onChange={e => onChange({ type: e.target.value })}
          className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          <option value="stop-current">Stop current workflow</option>
          <option value="stop-all">Stop all workflows</option>
          <option value="stop-specific">Stop specific workflows</option>
        </select>
      </FormGroup>
      <div className="space-y-3">
        <Toggle
          checked={data.throwError || false}
          onChange={v => onChange({ throwError: v })}
          label="Throw error"
        />
        {data.throwError && (
          <FormGroup label="Error message">
            <TextInput value={data.errorMessage || ""} onChange={v => onChange({ errorMessage: v })} placeholder="Unexpected state reached" />
          </FormGroup>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditParameterPromptPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Prompt the user for input during execution.</p>
      <FormGroup label="Timeout (ms)">
        <NumberInput value={data.timeout || 60000} onChange={v => onChange({ timeout: v })} />
      </FormGroup>
      <div className="mt-4">
        <p className="text-xs font-semibold mb-2">Parameters (Inputs)</p>
        <KeyValueList
          title="Inputs"
          items={data.parameters || []}
          onChange={v => onChange({ parameters: v })}
          keyPlaceholder="Param Name"
          valuePlaceholder="Default Value"
        />
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
    </div>
  );
}

export function EditWaitConnectionsPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">Wait for all incoming connections before continuing.</p>
      <FormGroup label="Timeout (ms)">
        <NumberInput value={data.timeout || 10000} onChange={v => onChange({ timeout: v })} step={1000} />
      </FormGroup>
      <div className="space-y-3">
        <Toggle
          checked={data.specificFlow || false}
          onChange={v => onChange({ specificFlow: v })}
          label="Wait for specific block"
        />
        {data.specificFlow && (
          <FormGroup label="Block ID">
            <TextInput value={data.flowBlockId || ""} onChange={v => onChange({ flowBlockId: v })} placeholder="e.g. trigger-1" />
          </FormGroup>
        )}
      </div>
      <FormGroup label="Description (optional)">
        <TextInput value={data.description || ""} onChange={v => onChange({ description: v })} placeholder="" />
      </FormGroup>
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
