import React, { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

// Shared form primitives shared by all edit panels
export function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder = "", type = "text" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
    />
  );
}

export function TextArea({ value, onChange, placeholder = "", rows = 3 }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value ?? ""}
      rows={rows}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none font-mono transition-colors"
    />
  );
}

export function Select({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value ?? ""}
      onChange={e => onChange(e.target.value)}
      className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">{opt.label}</option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-700 dark:text-gray-300 select-none transition-colors">{label}</span>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${
            checked ? "bg-amber-500" : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
    </label>
  );
}

export function NumberInput({ value, onChange, min, max, step = 1, label }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? 0}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
    />
  );
}

export function FormDivider() {
  return <hr className="border-gray-100 dark:border-gray-800 my-4 transition-colors" />;
}

export function CodeEditor({ value, onChange, placeholder = "", label, rows = 5 }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}) {
  return (
    <div className="mb-4">
      {label && <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>}
      <textarea
        value={value ?? ""}
        rows={rows}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-xs px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-y font-mono transition-colors"
      />
    </div>
  );
}

export function KeyValueList({ 
  items, 
  onChange, 
  title, 
  keyPlaceholder = "Key", 
  valuePlaceholder = "Value" 
}: {
  items: { name: string; value: string }[];
  onChange: (items: { name: string; value: string }[]) => void;
  title: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const addItem = () => {
    onChange([...(items || []), { name: "", value: "" }]);
  };

  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const updateItem = (index: number, field: "name" | "value", val: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    onChange(newItems);
  };

  return (
    <div className="mb-4">
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-1">
          {isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</span>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); addItem(); }}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-amber-500 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {(!items || items.length === 0) && (
            <p className="text-xs text-gray-400 italic text-center py-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
              No items added
            </p>
          )}
          {items?.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={item.name}
                onChange={e => updateItem(index, "name", e.target.value)}
                placeholder={keyPlaceholder}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <input
                type="text"
                value={item.value}
                onChange={e => updateItem(index, "value", e.target.value)}
                placeholder={valuePlaceholder}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors"
              />
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
