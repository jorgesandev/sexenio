"use client";

import { useId } from "react";

interface Option<T extends string | number> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string | number> {
  legend: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string | number>({
  legend,
  value,
  options,
  onChange,
  className = "",
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <fieldset className={`segmented ${className}`}>
      <legend className="sr-only">{legend}</legend>
      {options.map((option) => (
        <label key={String(option.value)} className="segmented__option">
          <input
            type="radio"
            name={name}
            value={String(option.value)}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
