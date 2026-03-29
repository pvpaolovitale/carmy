'use client';

import { useState } from 'react';
import { CookingStep } from '@/types';

interface StepListProps {
  steps: CookingStep[];
  onAllStepsDone?: () => void;
}

export default function StepList({ steps, onAllStepsDone }: StepListProps) {
  const [current, setCurrent] = useState(0);
  const sorted = [...steps].sort((a, b) => a.order - b.order);

  return (
    <ol className="flex flex-col gap-3">
      {sorted.map((step, i) => {
        const done = i < current;
        const active = i === current;

        return (
          <li
            key={step.order}
            onClick={() => setCurrent(i)}
            className={`flex gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
              done
                ? 'opacity-40 border-border bg-surface-2'
                : active
                ? 'border-accent bg-accent/5'
                : 'border-border bg-surface-2 hover:border-accent/40'
            }`}
          >
            <div
              className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-green-600 text-white' : active ? 'bg-accent text-black' : 'bg-surface-3 text-muted'
              }`}
            >
              {done ? '✓' : step.order}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${active ? 'text-foreground' : 'text-muted'}`}>{step.instruction}</p>
              {active && step.tip && (
                <div className="mt-2 flex gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                  <span className="text-sm">👨‍🍳</span>
                  <p className="text-xs text-amber-300">{step.tip}</p>
                </div>
              )}
              {active && step.durationMin && (
                <p className="text-xs text-muted mt-1 font-mono">⏱ {step.durationMin} min</p>
              )}
            </div>
          </li>
        );
      })}

      <div className="flex gap-3 mt-2">
        <button
          onClick={() => setCurrent(Math.max(0, current - 1))}
          disabled={current === 0}
          className="flex-1 py-2.5 text-sm border border-border rounded-lg text-muted hover:text-foreground disabled:opacity-30 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => {
            const next = Math.min(sorted.length - 1, current + 1);
            setCurrent(next);
            if (next === sorted.length - 1 && onAllStepsDone) {
              onAllStepsDone();
            }
          }}
          disabled={current === sorted.length - 1}
          className="flex-1 py-2.5 text-sm bg-accent text-black font-semibold rounded-lg hover:bg-amber-500 disabled:opacity-30 transition-colors"
        >
          {current === sorted.length - 2 ? 'Last Step →' : 'Next →'}
        </button>
      </div>
    </ol>
  );
}
