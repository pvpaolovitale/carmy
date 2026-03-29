'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import RecipeBankCard from '@/components/recipe-bank/RecipeBankCard';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import { Recipe } from '@/types';
import { useRouter } from 'next/navigation';

export default function RecipeBankPage() {
  const router = useRouter();
  const rawRecipes = useQuery(api.recipes.getAll);
  const standaloneBuffers = useQuery(api.proteinBuffers.getAll);
  const updateRecipe = useMutation(api.recipes.update);
  const deleteRecipe = useMutation(api.recipes.remove);
  const removeProteinBuffer = useMutation(api.recipes.removeProteinBuffer);
  const addStandaloneBuffer = useMutation(api.proteinBuffers.add);
  const removeStandaloneBuffer = useMutation(api.proteinBuffers.remove);

  const [pendingDeleteSlug, setPendingDeleteSlug] = useState<string | null>(null);
  const [pendingDeleteBuffer, setPendingDeleteBuffer] = useState<string | null>(null);
  const [showAddBuffer, setShowAddBuffer] = useState(false);
  const [bufferDescription, setBufferDescription] = useState('');
  const [isFormattingBuffer, setIsFormattingBuffer] = useState(false);
  const [bufferError, setBufferError] = useState('');

  const recipes = (rawRecipes as unknown as Recipe[] | undefined);
  const favorites = recipes?.filter((r) => r.favorite) ?? [];
  const rest = recipes?.filter((r) => !r.favorite) ?? [];

  // Combine recipe-embedded buffers with standalone ones (deduped by name)
  const allBuffers = (() => {
    const seen = new Set<string>();
    const result: Array<{ name: string; kcal: number; proteinG: number; description: string; standalone?: boolean }> = [];
    for (const r of recipes ?? []) {
      if (r.proteinBuffer && !seen.has(r.proteinBuffer.name)) {
        seen.add(r.proteinBuffer.name);
        result.push(r.proteinBuffer);
      }
    }
    for (const b of standaloneBuffers ?? []) {
      if (!seen.has(b.name)) {
        seen.add(b.name);
        result.push({ name: b.name, kcal: b.kcal, proteinG: b.proteinG, description: b.description, standalone: true });
      }
    }
    return result;
  })();

  const handleToggleFavorite = async (recipe: Recipe) => {
    await updateRecipe({ slug: recipe.slug, patch: { favorite: !recipe.favorite } });
  };

  const handleDeleteRequest = (recipe: Recipe) => {
    setPendingDeleteSlug(recipe.slug);
  };

  const handleConfirmDelete = async (recipe: Recipe) => {
    await deleteRecipe({ slug: recipe.slug });
    setPendingDeleteSlug(null);
  };

  const handleCancelDelete = () => {
    setPendingDeleteSlug(null);
  };

  const handleAddBuffer = async () => {
    if (!bufferDescription.trim()) return;
    setIsFormattingBuffer(true);
    setBufferError('');
    try {
      const res = await fetch('/api/format-buffer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawDescription: bufferDescription }),
      });
      if (!res.ok) throw new Error('Failed to format protein buffer');
      const data = await res.json();
      const { buffer } = data as {
        buffer: { name: string; kcal: number; proteinG: number; description: string };
      };
      await addStandaloneBuffer({ ...buffer, createdAt: new Date().toISOString() });
      setBufferDescription('');
      setShowAddBuffer(false);
    } catch {
      setBufferError('Could not generate protein buffer. Try again.');
    } finally {
      setIsFormattingBuffer(false);
    }
  };

  if (recipes === undefined) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📖 Recipe Bank</h1>
        </div>
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">📖 Recipe Bank</h1>
          <p className="text-muted text-sm mt-1">{recipes.length} recipe{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAddBuffer(!showAddBuffer); setBufferError(''); }}
            className="bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-500/30 transition-colors"
          >
            + Add Protein Buffer
          </button>
          <Link
            href="/recipe-bank/add"
            className="bg-accent text-black font-semibold text-sm px-4 py-2 rounded-lg hover:bg-amber-500 transition-colors"
          >
            + Add Recipe
          </Link>
        </div>
      </div>

      {/* ── Add Protein Buffer inline form ── */}
      {showAddBuffer && (
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-1">💪 Describe your protein buffer</p>
            <p className="text-xs text-muted">e.g. "Greek yogurt with granola and honey" or "Protein shake with oat milk and banana"</p>
          </div>
          <textarea
            value={bufferDescription}
            onChange={(e) => setBufferDescription(e.target.value)}
            placeholder="Describe the protein buffer snack…"
            rows={3}
            className="w-full text-sm bg-surface-2 border border-border rounded-lg px-3 py-2 text-foreground placeholder:text-muted/50 focus:outline-none focus:border-amber-500/60 resize-none"
          />
          {bufferError && <p className="text-red-400 text-xs">{bufferError}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleAddBuffer}
              disabled={isFormattingBuffer || !bufferDescription.trim()}
              className="text-sm font-semibold bg-amber-500 text-black px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isFormattingBuffer ? 'Generating…' : 'Generate & Save'}
            </button>
            <button
              onClick={() => { setShowAddBuffer(false); setBufferDescription(''); setBufferError(''); }}
              className="text-sm text-muted hover:text-foreground px-4 py-2 rounded-lg border border-border transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📭</p>
          <p className="text-muted mb-4">Your recipe bank is empty.</p>
          <Link href="/recipe-bank/add" className="text-accent hover:underline text-sm">
            Add your first recipe →
          </Link>
        </div>
      ) : (
        <>
          {favorites.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">⭐ Favorites</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {favorites.map((r) => (
                  <RecipeBankCard
                    key={r.id}
                    recipe={r}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteRequest}
                    pendingDelete={pendingDeleteSlug === r.slug}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              {favorites.length > 0 && (
                <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">All Recipes</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rest.map((r) => (
                  <RecipeBankCard
                    key={r.id}
                    recipe={r}
                    onToggleFavorite={handleToggleFavorite}
                    onDelete={handleDeleteRequest}
                    pendingDelete={pendingDeleteSlug === r.slug}
                    onConfirmDelete={handleConfirmDelete}
                    onCancelDelete={handleCancelDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Protein Buffers ── */}
      {allBuffers.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">🌅 Protein Buffers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allBuffers.map((b) => (
              <div key={b.name} className="bg-surface-2 border border-amber-500/20 rounded-xl p-4">
                {pendingDeleteBuffer === b.name ? (
                  <div>
                    <p className="text-sm text-foreground mb-3">Remove <span className="font-semibold">{b.name}</span>?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (b.standalone) {
                            await removeStandaloneBuffer({ name: b.name });
                          } else {
                            await removeProteinBuffer({ bufferName: b.name });
                          }
                          setPendingDeleteBuffer(null);
                        }}
                        className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setPendingDeleteBuffer(null)}
                        className="text-xs text-muted hover:text-foreground px-3 py-1 rounded-lg border border-border"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <button
                        onClick={() => !b.standalone && router.push(`/recipe-bank/protein-buffer/${encodeURIComponent(b.name)}`)}
                        className={`font-semibold text-amber-300 text-left ${!b.standalone ? 'hover:underline' : 'cursor-default'}`}
                      >
                        {b.name}
                        {b.standalone && <span className="ml-2 text-[9px] font-mono text-amber-400/50 uppercase tracking-wider">standalone</span>}
                      </button>
                      <button
                        onClick={() => setPendingDeleteBuffer(b.name)}
                        className="text-muted hover:text-red-400 text-xs flex-shrink-0"
                        title="Remove buffer"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-muted text-xs mb-2">{b.description}</p>
                    <div className="flex gap-3 text-xs font-mono text-muted">
                      <span>🔥 {b.kcal} kcal</span>
                      <span>💪 {b.proteinG}g protein</span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
