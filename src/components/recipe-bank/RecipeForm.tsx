'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { FormatRecipeResponse, Recipe } from '@/types';
import Badge from '@/components/ui/Badge';

export default function RecipeForm() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'review'>('input');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<FormatRecipeResponse | null>(null);
  const [error, setError] = useState('');

  const handleFormat = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/format-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDescription: text }),
      });
      if (!res.ok) throw new Error('Failed to format recipe');
      const data: FormatRecipeResponse = await res.json();
      setResult(data);
      setStep('review');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.recipe),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push('/recipe-bank');
    } catch {
      setError('Failed to save recipe.');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'review' && result) {
    const r = result.recipe as Partial<Recipe>;
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{r.name}</h2>
          {r.nameEs && <p className="text-muted text-sm">{r.nameEs}</p>}
          <p className="text-muted mt-1 text-sm">{r.description}</p>
        </div>

        {result.warnings && result.warnings.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
            <p className="text-xs text-amber-400 font-semibold mb-1">⚠️ Notes from Carmy</p>
            {result.warnings.map((w, i) => <p key={i} className="text-xs text-amber-300">{w}</p>)}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'kcal', value: r.macrosPerServing?.kcal },
            { label: 'protein', value: `${r.macrosPerServing?.proteinG}g` },
            { label: 'carbs', value: `${r.macrosPerServing?.carbsG}g` },
            { label: 'fat', value: `${r.macrosPerServing?.fatG}g` },
          ].map((m) => (
            <div key={m.label} className="bg-surface-3 rounded-lg p-3 text-center">
              <p className="text-lg font-bold font-mono text-accent">{m.value}</p>
              <p className="text-xs text-muted">{m.label}</p>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Ingredients (per serving)</h3>
          <ul className="flex flex-col gap-1">
            {r.ingredients?.map((ing, i) => (
              <li key={i} className="text-sm text-muted flex justify-between">
                <span>{ing.name} / <span className="text-muted/60">{ing.nameEs}</span></span>
                <span className="font-mono">{ing.quantity}{ing.unit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Steps</h3>
          <ol className="flex flex-col gap-2">
            {r.steps?.sort((a, b) => a.order - b.order).map((s) => (
              <li key={s.order} className="flex gap-3 text-sm">
                <span className="flex-shrink-0 w-5 h-5 bg-surface-3 rounded-full flex items-center justify-center text-xs text-muted">{s.order}</span>
                <span className="text-muted">{s.instruction}</span>
              </li>
            ))}
          </ol>
        </div>

        {r.airFryerSettings && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-sm">
            <p className="font-semibold text-amber-400 mb-1">💨 Air Fryer Settings</p>
            <p className="text-amber-300 font-mono">{r.airFryerSettings.tempC}°C · {r.airFryerSettings.durationMin} min {r.airFryerSettings.preheat ? '· Preheat' : ''}</p>
            {r.airFryerSettings.notes && <p className="text-amber-300/70 text-xs mt-1">{r.airFryerSettings.notes}</p>}
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => setStep('input')}>← Edit</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Save to Recipe Bank</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">
        Describe a recipe in any format — Carmy will adapt it to your profile (pescatarian, lactose-free), calculate macros, and format it for your bank.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Grilled miso cod with bok choy and brown rice. Marinate cod in miso paste, mirin, and soy sauce for 30 min. Grill 5 min per side..."
        className="w-full h-48 bg-surface-3 border border-border rounded-xl p-4 text-sm text-foreground placeholder:text-muted/50 resize-none focus:outline-none focus:border-accent"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button onClick={handleFormat} loading={loading} disabled={!text.trim()}>
        Format with Carmy →
      </Button>
    </div>
  );
}
