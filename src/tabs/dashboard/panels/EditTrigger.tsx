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
        <FormGroup label="Context menu label">
          <TextInput
            value={data.contextMenuName || ""}
            onChange={v => onChange({ contextMenuName: v })}
            placeholder="Run workflow..."
          />
        </FormGroup>
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
