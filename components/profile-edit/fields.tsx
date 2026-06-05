"use client";

import type {
  InputHTMLAttributes,
  Ref,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const labelCls =
  "block text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-1.5";
const baseCls =
  "w-full px-3 py-2 text-sm text-ink border border-line-2 rounded-lg bg-white focus:outline-none focus:border-[var(--red)] focus:ring-2 focus:ring-[rgba(220,38,38,0.1)] transition-colors disabled:bg-line disabled:cursor-not-allowed";

export function InputField({
  label,
  ref,
  ...rest
}: { label: string; ref?: Ref<HTMLInputElement> } & Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "className"
>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <input ref={ref} className={baseCls} {...rest} />
    </div>
  );
}

export function TextareaField({
  label,
  rows = 3,
  ref,
  ...rest
}: { label: string; ref?: Ref<HTMLTextAreaElement> } & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "className"
>) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <textarea ref={ref} rows={rows} className={baseCls} {...rest} />
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

export function SelectField({
  label,
  options,
  placeholder,
  ref,
  ...rest
}: {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  ref?: Ref<HTMLSelectElement>;
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "className">) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <select ref={ref} className={baseCls} {...rest}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
