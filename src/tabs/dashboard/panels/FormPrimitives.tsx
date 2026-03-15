import React from "react";

// Shared form primitives shared by all edit panels
export function FormGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
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
      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
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
      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white resize-none font-mono"
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
      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
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
      <span className="text-sm text-gray-700">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? "bg-amber-500" : "bg-gray-200"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-5" : ""}`}
        />
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
      className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
    />
  );
}

export function FormDivider() {
  return <hr className="border-gray-100 my-4" />;
}
