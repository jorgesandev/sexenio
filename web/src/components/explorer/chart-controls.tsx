"use client";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { MonthPicker } from "@/components/ui/month-picker";
import { EXPLORER_MIN_MONTH, EXPLORER_REFERENCE_MONTH } from "@/lib/dataset";
import type { ExplorerModel } from "@/lib/explorer-model";
import { strings } from "@/lib/strings";
import type {
  ExplorerState,
  MovingAverage,
  ScaleMode,
  SourceOption,
  ViewMode,
} from "@/lib/url-state";

const VIEW_OPTIONS: ReadonlyArray<{ value: ViewMode; label: string }> = [
  { value: "level", label: strings.explorer.viewLevel },
  { value: "delta", label: strings.explorer.viewDelta },
  { value: "index", label: strings.explorer.viewIndex },
];

const SCALE_OPTIONS: ReadonlyArray<{ value: ScaleMode; label: string }> = [
  { value: "linear", label: strings.explorer.scaleLinear },
  { value: "log", label: strings.explorer.scaleLog },
];

const MA_OPTIONS: ReadonlyArray<{ value: MovingAverage; label: string }> = [
  { value: 0, label: strings.explorer.maNone },
  { value: 3, label: strings.explorer.ma3 },
  { value: 12, label: strings.explorer.ma12 },
];

interface ChartControlsProps {
  state: ExplorerState;
  model: ExplorerModel;
  update: (patch: Partial<ExplorerState>) => void;
}

export function ChartControls({ state, model, update }: ChartControlsProps) {
  const sourceOptions = model.sourceChoices
    .filter((choice) => choice.hasData)
    .flatMap((choice) =>
      choice.id === "inegi" || choice.id === "sesnsp"
        ? [
            {
              value: choice.id as SourceOption,
              label: choice.source.name,
            },
          ]
        : [],
    );

  return (
    <div className="border-b border-rule px-4 py-4 lg:px-6">
      <div className="flex flex-wrap items-end gap-x-5 gap-y-4">
        <div>
          <span className="field-label" aria-hidden="true">
            {strings.explorer.viewLabel}
          </span>
          <SegmentedControl
            legend={strings.explorer.viewLabel}
            value={state.view}
            options={VIEW_OPTIONS}
            onChange={(value) => update({ view: value })}
          />
        </div>

        <div>
          <span className="field-label" aria-hidden="true">
            {strings.explorer.scaleLabel}
          </span>
          <SegmentedControl
            legend={strings.explorer.scaleLabel}
            value={state.scale}
            options={SCALE_OPTIONS}
            onChange={(value) => update({ scale: value })}
          />
        </div>

        <div>
          <label htmlFor="ma-select" className="field-label">
            {strings.explorer.maLabel}
          </label>
          <select
            id="ma-select"
            className="input w-[200px]"
            value={state.ma}
            onChange={(event) =>
              update({ ma: Number(event.target.value) as MovingAverage })
            }
          >
            {MA_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {sourceOptions.length > 1 ? (
          <div>
            <span className="field-label" aria-hidden="true">
              {strings.explorer.sourceLabel}
            </span>
            <SegmentedControl
              legend={strings.explorer.sourceLabel}
              value={
                sourceOptions.some((option) => option.value === state.source)
                  ? state.source
                  : "inegi"
              }
              options={sourceOptions}
              onChange={(value) => update({ source: value })}
            />
          </div>
        ) : null}

        <div className="flex w-full items-end gap-2 sm:ml-auto sm:w-auto">
          <MonthPicker
            className="min-w-0 flex-1 sm:w-[168px] sm:flex-none"
            label={strings.explorer.fromLabel}
            value={state.from}
            min={EXPLORER_MIN_MONTH}
            max={state.to}
            onChange={(value) => {
              const nextTo = value > state.to ? value : state.to;
              update({ from: value, to: nextTo });
            }}
          />
          <MonthPicker
            className="min-w-0 flex-1 sm:w-[168px] sm:flex-none"
            label={strings.explorer.toLabel}
            value={state.to}
            min={state.from}
            max={EXPLORER_REFERENCE_MONTH}
            onChange={(value) => {
              const nextFrom = value < state.from ? value : state.from;
              update({ from: nextFrom, to: value });
            }}
          />
        </div>
      </div>
    </div>
  );
}
