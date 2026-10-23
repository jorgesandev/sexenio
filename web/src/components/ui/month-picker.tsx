"use client";

import { useId } from "react";
import { monthShortLabels, strings } from "@/lib/strings";

interface MonthPickerProps {
  label: string;
  value: string;
  min: string;
  max: string;
  onChange: (value: string) => void;
  className?: string;
}

function monthOptions(): Array<{ value: string; label: string }> {
  return monthShortLabels.map((label, index) => ({
    value: String(index + 1).padStart(2, "0"),
    label,
  }));
}

const MONTHS = monthOptions();

export function MonthPicker({
  label,
  value,
  min,
  max,
  onChange,
  className = "",
}: MonthPickerProps) {
  const groupId = useId();
  const monthId = useId();
  const yearId = useId();

  const year = Number(value.slice(0, 4));
  const month = value.slice(5, 7);
  const minYear = Number(min.slice(0, 4));
  const maxYear = Number(max.slice(0, 4));

  const years: number[] = [];
  for (let candidate = minYear; candidate <= maxYear; candidate += 1) {
    years.push(candidate);
  }

  const isMonthDisabled = (monthValue: string) => {
    const candidate = `${year}-${monthValue}`;
    return candidate < min || candidate > max;
  };

  const commit = (candidate: string) => {
    if (candidate < min) {
      onChange(min);
    } else if (candidate > max) {
      onChange(max);
    } else {
      onChange(candidate);
    }
  };

  return (
    <div role="group" aria-labelledby={groupId} className={className}>
      <span id={groupId} className="field-label">
        {label}
      </span>
      <div className="flex min-w-0 gap-1">
        <div className="min-w-0 flex-[0.8]">
          <label htmlFor={monthId} className="sr-only">
            {label}: {strings.ui.month}
          </label>
          <select
            id={monthId}
            className="input min-w-0 px-1"
            value={month}
            onChange={(event) =>
              commit(`${year}-${event.target.value}`)
            }
          >
            {MONTHS.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={isMonthDisabled(option.value)}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 flex-1">
          <label htmlFor={yearId} className="sr-only">
            {label}: {strings.ui.year}
          </label>
          <select
            id={yearId}
            className="input min-w-0 px-1"
            value={year}
            onChange={(event) =>
              commit(`${event.target.value}-${month}`)
            }
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
