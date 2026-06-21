"use client";

import { Plus, Minus } from "lucide-react";

interface MoqStepperProps {
  quantity: number;
  moq: number;
  moqStep: number;
  moqUnit?: string;
  onChange: (next: number) => void;
}

/**
 * Enforces MOQ at the UI layer: the floor for this control is always the
 * product's `moq`, and every step moves by `moqStep` — so for a fabric
 * with moq=2, moqStep=0.5, the customer can land on 2, 2.5, 3 ... but
 * never 1.5 or 2.25. Mirrors the validation done again server-side at
 * checkout (see /api/checkout).
 */
export function MoqStepper({ quantity, moq, moqStep, moqUnit, onChange }: MoqStepperProps) {
  const atFloor = quantity <= moq;

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(moq, roundStep(quantity - moqStep, moqStep)))}
          disabled={atFloor}
          aria-label="Decrease quantity"
          className="tap-target flex items-center justify-center border border-line rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-base font-medium w-16 text-center tabular-nums">
          {quantity} {moqUnit ?? ""}
        </span>
        <button
          type="button"
          onClick={() => onChange(roundStep(quantity + moqStep, moqStep))}
          aria-label="Increase quantity"
          className="tap-target flex items-center justify-center border border-line rounded"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-bark">
        Minimum order: {moq} {moqUnit ?? "units"}
        {moqStep !== 1 ? ` · increments of ${moqStep}` : ""}
      </p>
    </div>
  );
}

function roundStep(value: number, step: number) {
  if (!step || step <= 0) return value;
  return Math.round((Math.round(value / step) * step) * 1000) / 1000;
}
