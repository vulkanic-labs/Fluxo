import React from "react";
import { FormGroup, Select, TextInput, Toggle } from "./FormPrimitives";
import { type EditPanelProps } from "../editor/BlockEditPanel";

export function EditTriggerPanel({ data, onChange }: EditPanelProps) {
  return (
    <div>
      <FormGroup label="Trigger type">
        <Select
          value={data.type || "manual"}
          onChange={v => onChange({ type: v })}
          options={[
            { value: "manual", label: "Manual" },
            { value: "url-match", label: "When visiting URL" },
            { value: "interval", label: "On interval" },
            { value: "date", label: "On specific date" },
            { value: "on-startup", label: "On browser startup" },
            { value: "keyboard-shortcut", label: "Keyboard shortcut" },
            { value: "context-menu", label: "Context menu" },
            { value: "element-observe", label: "Element observe" },
          ]}
        />
      </FormGroup>

      {data.type === "url-match" && (
        <FormGroup label="URL / Pattern">
          <TextInput
            value={data.url || ""}
            onChange={v => onChange({ url: v })}
            placeholder="https://example.com/*"
          />
          <Toggle
            checked={data.isUrlRegex || false}
            onChange={v => onChange({ isUrlRegex: v })}
            label="Use regex pattern"
          />
        </FormGroup>
      )}

      {data.type === "interval" && (
        <FormGroup label="Interval (minutes)">
          <TextInput
            type="number"
            value={String(data.interval || 60)}
            onChange={v => onChange({ interval: Number(v) })}
            placeholder="60"
          />
        </FormGroup>
      )}

      {data.type === "keyboard-shortcut" && (
        <FormGroup label="Keyboard shortcut">
          <TextInput
            value={data.shortcut || ""}
            onChange={v => onChange({ shortcut: v })}
            placeholder="e.g. Ctrl+Shift+A"
          />
        </FormGroup>
      )}

      {data.type === "context-menu" && (
        <div className="space-y-3">
          <FormGroup label="Context menu label">
            <TextInput
              value={data.contextMenuName || ""}
              onChange={v => onChange({ contextMenuName: v })}
              placeholder="Run workflow..."
            />
          </FormGroup>
          <div className="mt-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Context Types</p>
            <div className="grid grid-cols-2 gap-2">
              {["page", "selection", "link", "image", "video", "audio"].map(type => (
                <Toggle
                  key={type}
                  checked={(data.contextTypes || []).includes(type)}
                  onChange={v => {
                    const types = [...(data.contextTypes || [])];
                    if (v) types.push(type);
                    else types.splice(types.indexOf(type), 1);
                    onChange({ contextTypes: types });
                  }}
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {data.type === "on-startup" || data.type === "interval" || data.type === "date" ? (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Active Days</p>
          <div className="flex flex-wrap gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <button
                key={day}
                onClick={() => {
                  const days = [...(data.days || [])];
                  if (days.includes(i)) days.splice(days.indexOf(i), 1);
                  else days.push(i);
                  onChange({ days });
                }}
                className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                  (data.days || []).includes(i)
                    ? "bg-amber-500 border-amber-500 text-white"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {data.type === "element-observe" && (
        <div className="space-y-4">
          <FormGroup label="Element to observe">
            <TextInput
              value={data.observeElement?.selector || ""}
              onChange={v => onChange({ observeElement: { ...(data.observeElement || {}), selector: v } })}
              placeholder="CSS Selector"
            />
          </FormGroup>
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Options</p>
            <Toggle
              checked={data.observeElement?.targetOptions?.childList ?? true}
              onChange={v => onChange({ observeElement: { ...data.observeElement, targetOptions: { ...data.observeElement.targetOptions, childList: v } } })}
              label="Observe child list"
            />
            <Toggle
              checked={data.observeElement?.targetOptions?.subtree ?? false}
              onChange={v => onChange({ observeElement: { ...data.observeElement, targetOptions: { ...data.observeElement.targetOptions, subtree: v } } })}
              label="Observe subtree"
            />
            <Toggle
              checked={data.observeElement?.targetOptions?.attributes ?? false}
              onChange={v => onChange({ observeElement: { ...data.observeElement, targetOptions: { ...data.observeElement.targetOptions, attributes: v } } })}
              label="Observe attributes"
            />
          </div>
        </div>
      )}

      <FormGroup label="Description (optional)">
        <TextInput
          value={data.description || ""}
          onChange={v => onChange({ description: v })}
          placeholder="What does this workflow do?"
        />
      </FormGroup>
    </div>
  );
}
