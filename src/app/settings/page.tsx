'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import {
  PROMPT_SETTING_KEYS,
  PROMPT_SETTING_DEFAULTS,
  PROMPT_SETTING_METADATA,
  PromptSettingKey,
} from '@/lib/prompts';
import Spinner from '@/components/ui/Spinner';

const ORDERED_KEYS: PromptSettingKey[] = [
  PROMPT_SETTING_KEYS.userProfile,
  PROMPT_SETTING_KEYS.planPrompt,
  PROMPT_SETTING_KEYS.shoppingListPrompt,
  PROMPT_SETTING_KEYS.substitutionPrompt,
  PROMPT_SETTING_KEYS.formatRecipePrompt,
  PROMPT_SETTING_KEYS.formatBufferPrompt,
];

export default function SettingsPage() {
  const rawSettings = useQuery(api.settings.getAllSettings);
  const upsertSetting = useMutation(api.settings.upsertSetting);
  const deleteSetting = useMutation(api.settings.deleteSetting);

  // Local draft values per key
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ userProfile: true });

  // Initialise drafts from stored settings (or defaults)
  useEffect(() => {
    if (rawSettings === undefined) return;
    const settings = rawSettings as Record<string, string>;
    const initial: Record<string, string> = {};
    for (const key of ORDERED_KEYS) {
      initial[key] = settings[key] ?? PROMPT_SETTING_DEFAULTS[key];
    }
    setDrafts(initial);
  }, [rawSettings]);

  if (rawSettings === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">⚙️ Settings</h1>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  const settings = rawSettings as Record<string, string>;

  const handleSave = async (key: PromptSettingKey) => {
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      await upsertSetting({ key, value: drafts[key] });
      setSaved((s) => ({ ...s, [key]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000);
    } finally {
      setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const handleReset = async (key: PromptSettingKey) => {
    await deleteSetting({ key });
    setDrafts((d) => ({ ...d, [key]: PROMPT_SETTING_DEFAULTS[key] }));
  };

  const isModified = (key: PromptSettingKey) => {
    const stored = settings[key];
    const current = drafts[key];
    if (!stored) return current !== PROMPT_SETTING_DEFAULTS[key];
    return current !== stored;
  };

  const hasOverride = (key: PromptSettingKey) => !!settings[key];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">⚙️ Settings</h1>
        <p className="text-muted text-sm mt-1">
          Customise the AI prompts used throughout Carmy. Changes take effect immediately on the next generation.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {ORDERED_KEYS.map((key) => {
          const meta = PROMPT_SETTING_METADATA[key];
          const isOpen = expanded[key] ?? false;
          const modified = isModified(key);
          const overridden = hasOverride(key);

          return (
            <div key={key} className="bg-surface-2 border border-border rounded-xl overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpanded((e) => ({ ...e, [key]: !isOpen }))}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-3/40 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-foreground">{meta.label}</span>
                  {overridden && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-accent bg-accent/10 border border-accent/20 rounded px-1.5 py-0.5">
                      custom
                    </span>
                  )}
                  {modified && (
                    <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                      unsaved
                    </span>
                  )}
                </div>
                <span className="text-muted text-sm">{isOpen ? '▲' : '▼'}</span>
              </button>

              {/* Content */}
              {isOpen && (
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-border/50">
                  <p className="text-xs text-muted mt-3">{meta.description}</p>

                  {meta.variables && (
                    <div className="text-[10px] text-muted/60 font-mono flex flex-wrap gap-1">
                      <span className="text-muted/40 mr-1">Variables:</span>
                      {meta.variables.map((v) => (
                        <span key={v} className="bg-surface-3 border border-border/50 rounded px-1 py-0.5">
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  <textarea
                    value={drafts[key] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                    rows={key === PROMPT_SETTING_KEYS.userProfile ? 8 : 18}
                    className="w-full text-xs font-mono bg-surface-3 border border-border rounded-lg px-3 py-2.5 text-foreground focus:outline-none focus:border-accent/60 resize-y"
                    spellCheck={false}
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleSave(key)}
                      disabled={saving[key] || !modified}
                      className="text-xs font-semibold bg-accent text-black px-3 py-1.5 rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {saving[key] ? 'Saving…' : saved[key] ? '✓ Saved' : 'Save'}
                    </button>
                    {overridden && (
                      <button
                        onClick={() => handleReset(key)}
                        className="text-xs text-muted hover:text-red-400 border border-border px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Reset to default
                      </button>
                    )}
                    {modified && !saving[key] && (
                      <button
                        onClick={() => setDrafts((d) => ({ ...d, [key]: settings[key] ?? PROMPT_SETTING_DEFAULTS[key] }))}
                        className="text-xs text-muted/60 hover:text-muted px-2 py-1.5"
                      >
                        Discard changes
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
