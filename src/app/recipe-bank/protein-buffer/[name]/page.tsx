'use client';

import { useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import Link from 'next/link';
import Spinner from '@/components/ui/Spinner';
import { Recipe } from '@/types';

export default function ProteinBufferDetailPage() {
  const params = useParams();
  const bufferName = decodeURIComponent(params.name as string);

  const rawRecipes = useQuery(api.recipes.getAll);
  const recipes = (rawRecipes as unknown as Recipe[] | undefined);

  if (recipes === undefined) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const pairedRecipes = recipes.filter((r) => r.proteinBuffer?.name === bufferName);
  const buffer = pairedRecipes[0]?.proteinBuffer;

  if (!buffer) {
    return (
      <div className="flex flex-col gap-4">
        <Link href="/recipe-bank" className="text-muted text-sm hover:text-foreground">← Back</Link>
        <p className="text-muted">Protein buffer not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/recipe-bank" className="text-muted text-sm hover:text-foreground">← Back</Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-amber-300">🌅 {buffer.name}</h1>
        <p className="text-muted text-sm mt-1">{buffer.description}</p>
      </div>

      <div className="bg-surface-2 border border-amber-500/20 rounded-xl p-4 flex gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{buffer.kcal}</p>
          <p className="text-xs text-muted mt-0.5">kcal</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{buffer.proteinG}g</p>
          <p className="text-xs text-muted mt-0.5">protein</p>
        </div>
      </div>

      {pairedRecipes.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Paired with</h2>
          <div className="flex flex-col gap-2">
            {pairedRecipes.map((r) => (
              <Link
                key={r.id}
                href={`/cook/${r.slug}`}
                className="bg-surface-2 border border-border rounded-xl p-4 hover:border-accent/50 transition-colors flex items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-foreground">{r.name}</p>
                  <p className="text-xs text-muted mt-0.5">{r.macrosPerServing.kcal} kcal · {r.macrosPerServing.proteinG}g protein</p>
                </div>
                <span className="text-muted text-sm">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
