'use client';

import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import { Recipe, MealSlot, BufferSlot, MealType, SelectedProteinBuffer } from '@/types';
import { HONEST_GREENS } from '@/lib/glovoConstants';

const DAILY_KCAL = 1750;
const DAILY_PROTEIN = 160;

const TODAY_DAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function DroppableCell({ id, isToday, children }: { id: string; isToday?: boolean; children?: React.ReactNode }) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[52px] rounded-lg border p-1.5 transition-colors ${
        isOver
          ? 'border-accent bg-accent/10'
          : isToday
          ? 'border-accent/40 bg-accent/5'
          : 'border-border bg-surface-2/40'
      }`}
    >
      {children}
    </div>
  );
}

function DraggableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`cursor-grab select-none rounded-lg border border-border bg-surface-2 p-2 text-xs hover:border-accent/40 transition-colors touch-none ${
        isDragging ? 'opacity-40 z-50' : ''
      }`}
    >
      {children}
    </div>
  );
}

// ─── Colour helpers ────────────────────────────────────────────────────────────

function getMacroColor(actual: number, target: number): string {
  if (actual === 0) return 'text-muted';
  const r = actual / target;
  if (r >= 0.9 && r <= 1.1) return 'text-green-400';
  if (r >= 0.75 && r <= 1.25) return 'text-amber-400';
  return 'text-red-400';
}

// ─── Main component ────────────────────────────────────────────────────────────

interface WeeklyTimetableProps {
  days: string[];
  mealSlots: MealSlot[];
  bufferSlots: BufferSlot[];
  availableRecipes: Recipe[];
  availableBuffers: SelectedProteinBuffer[];
  onMealSlotsUpdate: (
    mealSlots: MealSlot[],
    dinnerSlots: Array<{ day: string; recipeId: string; confirmed: boolean }>
  ) => void;
  onBufferSlotsUpdate: (bufferSlots: BufferSlot[]) => void;
  onConfirm: (derivedBuffers: SelectedProteinBuffer[]) => void;
}

export default function WeeklyTimetable({
  days,
  mealSlots: initialMealSlots,
  bufferSlots: initialBufferSlots,
  availableRecipes,
  availableBuffers,
  onMealSlotsUpdate,
  onBufferSlotsUpdate,
  onConfirm,
}: WeeklyTimetableProps) {
  const [mealSlots, setMealSlots] = useState<MealSlot[]>(initialMealSlots);
  const [bufferSlots, setBufferSlots] = useState<BufferSlot[]>(initialBufferSlots);
  const [activeId, setActiveId] = useState<string | null>(null);

  // All recipes available for lookup (includes Honest Greens)
  const allLookupRecipes = [HONEST_GREENS, ...availableRecipes];

  // ── Slot lookups ────────────────────────────────────────────────────────────

  const getRecipeForSlot = (day: string, mealType: MealType): { recipe: Recipe; isAuto: boolean } | null => {
    const explicit = mealSlots.find((s) => s.day === day && s.mealType === mealType);
    // Explicit empty slot (recipeId: undefined) suppresses auto-fill
    if (explicit) {
      if (!explicit.recipeId) return null;
      const r = allLookupRecipes.find((r) => r.id === explicit.recipeId);
      return r ? { recipe: r, isAuto: false } : null;
    }
    // Auto-fill lunch from previous day's dinner
    if (mealType === 'lunch') {
      const idx = days.indexOf(day);
      if (idx > 0) {
        const prevDay = days[idx - 1];
        const prevDinner = mealSlots.find((s) => s.day === prevDay && s.mealType === 'dinner');
        if (prevDinner?.recipeId) {
          const r = allLookupRecipes.find((r) => r.id === prevDinner.recipeId);
          return r ? { recipe: r, isAuto: true } : null;
        }
      }
    }
    return null;
  };

  const getBufferForSlot = (day: string, mealTime: MealType): SelectedProteinBuffer | null => {
    const slot = bufferSlots.find((s) => s.day === day && s.mealTime === mealTime);
    if (slot?.bufferName) {
      return availableBuffers.find((b) => b.name === slot.bufferName) ?? null;
    }
    return null;
  };

  const getDayMacros = (day: string) => {
    const lunchEntry = getRecipeForSlot(day, 'lunch');
    const dinnerEntry = getRecipeForSlot(day, 'dinner');
    const bufL = getBufferForSlot(day, 'lunch');
    const bufD = getBufferForSlot(day, 'dinner');
    return {
      kcal:
        (lunchEntry?.recipe.macrosPerServing.kcal ?? 0) +
        (dinnerEntry?.recipe.macrosPerServing.kcal ?? 0) +
        (bufL?.kcal ?? 0) +
        (bufD?.kcal ?? 0),
      proteinG:
        (lunchEntry?.recipe.macrosPerServing.proteinG ?? 0) +
        (dinnerEntry?.recipe.macrosPerServing.proteinG ?? 0) +
        (bufL?.proteinG ?? 0) +
        (bufD?.proteinG ?? 0),
    };
  };

  const todayMacros = getDayMacros(TODAY_DAY);

  // ── Clear cell ──────────────────────────────────────────────────────────────

  const clearCell = (rowType: string, day: string) => {
    if (rowType === 'dinner' || rowType === 'lunch') {
      const mealType = rowType as MealType;
      // For lunch: store explicit empty to suppress auto-fill
      // For dinner: just remove
      let updated: MealSlot[];
      if (mealType === 'lunch') {
        updated = [
          ...mealSlots.filter((s) => !(s.day === day && s.mealType === mealType)),
          { day, mealType, recipeId: undefined },
        ];
      } else {
        updated = mealSlots.filter((s) => !(s.day === day && s.mealType === mealType));
      }
      setMealSlots(updated);
      onMealSlotsUpdate(
        updated,
        updated
          .filter((s) => s.mealType === 'dinner' && s.recipeId)
          .map((s) => ({ day: s.day, recipeId: s.recipeId!, confirmed: false }))
      );
    } else if (rowType === 'pb-lunch' || rowType === 'pb-dinner') {
      const mealTime: MealType = rowType === 'pb-lunch' ? 'lunch' : 'dinner';
      const updated = bufferSlots.filter((s) => !(s.day === day && s.mealTime === mealTime));
      setBufferSlots(updated);
      onBufferSlotsUpdate(updated);
    }
  };

  // ── DnD handlers ────────────────────────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const dragId = String(active.id);
    const dropId = String(over.id);
    const sepDrag = dragId.indexOf('::');
    const sepDrop = dropId.indexOf('::');
    if (sepDrag < 0 || sepDrop < 0) return;

    const dragType = dragId.slice(0, sepDrag);
    const dragValue = dragId.slice(sepDrag + 2);
    const dropType = dropId.slice(0, sepDrop);
    const dropDay = dropId.slice(sepDrop + 2);

    if (dragType === 'recipe' && (dropType === 'dinner' || dropType === 'lunch')) {
      const mealType = dropType as MealType;
      const updated = [
        ...mealSlots.filter((s) => !(s.day === dropDay && s.mealType === mealType)),
        { day: dropDay, mealType, recipeId: dragValue },
      ];
      setMealSlots(updated);
      onMealSlotsUpdate(
        updated,
        updated
          .filter((s) => s.mealType === 'dinner' && s.recipeId)
          .map((s) => ({ day: s.day, recipeId: s.recipeId!, confirmed: false }))
      );
    } else if (dragType === 'buffer' && (dropType === 'pb-lunch' || dropType === 'pb-dinner')) {
      const mealTime: MealType = dropType === 'pb-lunch' ? 'lunch' : 'dinner';
      const updated = [
        ...bufferSlots.filter((s) => !(s.day === dropDay && s.mealTime === mealTime)),
        { day: dropDay, mealTime, bufferName: dragValue },
      ];
      setBufferSlots(updated);
      onBufferSlotsUpdate(updated);
    }
  };

  // ── Confirm ─────────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    const bufferCounts = new Map<string, number>();
    for (const slot of bufferSlots) {
      if (slot.bufferName) {
        bufferCounts.set(slot.bufferName, (bufferCounts.get(slot.bufferName) ?? 0) + 1);
      }
    }
    const derived = availableBuffers
      .filter((b) => bufferCounts.has(b.name))
      .map((b) => ({ ...b, servings: bufferCounts.get(b.name)! }));
    onConfirm(derived);
  };

  // ── Overlay content ─────────────────────────────────────────────────────────

  const getOverlayContent = () => {
    if (!activeId) return null;
    const sep = activeId.indexOf('::');
    if (sep < 0) return null;
    const type = activeId.slice(0, sep);
    const value = activeId.slice(sep + 2);
    if (type === 'recipe') {
      const r = allLookupRecipes.find((r) => r.id === value);
      const isGlovo = value.startsWith('glovo::');
      return r ? (
        <div className={`rounded-lg border p-2 text-xs shadow-xl opacity-90 w-44 bg-surface-2 ${isGlovo ? 'border-green-500/50' : 'border-accent'}`}>
          <p className={`font-medium truncate ${isGlovo ? 'text-green-300' : 'text-foreground'}`}>{r.name}</p>
          <p className="text-muted mt-0.5">{r.macrosPerServing.kcal} kcal</p>
        </div>
      ) : null;
    }
    if (type === 'buffer') {
      const b = availableBuffers.find((b) => b.name === value);
      return b ? (
        <div className="rounded-lg border border-amber-500/50 bg-surface-2 p-2 text-xs shadow-xl opacity-90 w-40">
          <p className="font-medium text-amber-300 truncate">{b.name}</p>
          <p className="text-muted mt-0.5">{b.kcal} kcal</p>
        </div>
      ) : null;
    }
    return null;
  };

  const rows = [
    { label: '🍱 Lunch', rowType: 'lunch' },
    { label: '🌅 PB(L)', rowType: 'pb-lunch' },
    { label: '🍽 Dinner', rowType: 'dinner' },
    { label: '🌅 PB(D)', rowType: 'pb-dinner' },
  ];

  const colStyle = { gridTemplateColumns: `80px repeat(${days.length}, minmax(100px, 1fr))` };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">

        {/* ── Timetable grid ── */}
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-2 p-3">
          <div style={{ minWidth: `${days.length * 110 + 90}px` }}>

            {/* Header */}
            <div className="grid gap-1 mb-1" style={colStyle}>
              <div />
              {days.map((day) => {
                const isToday = day === TODAY_DAY;
                return (
                  <div
                    key={day}
                    className={`text-center text-[11px] font-mono uppercase tracking-widest py-1 rounded ${
                      isToday ? 'text-accent font-bold' : 'text-muted'
                    }`}
                  >
                    {DAY_LABELS[day] ?? day}
                    {isToday && <div className="text-[8px] font-mono normal-case tracking-normal text-accent/60">today</div>}
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            {rows.map(({ label, rowType }) => (
              <div key={rowType} className="grid gap-1 mb-1" style={colStyle}>
                <div className="flex items-center text-[11px] text-muted font-medium pr-1 leading-tight">
                  {label}
                </div>
                {days.map((day) => {
                  const isPB = rowType === 'pb-lunch' || rowType === 'pb-dinner';
                  const isMeal = rowType === 'lunch' || rowType === 'dinner';
                  const isToday = day === TODAY_DAY;
                  const cellId = `${rowType}::${day}`;

                  if (isMeal) {
                    const mealType = rowType as MealType;
                    const entry = getRecipeForSlot(day, mealType);
                    const isGlovo = entry?.recipe.id.startsWith('glovo::');
                    return (
                      <DroppableCell key={day} id={cellId} isToday={isToday}>
                        {entry ? (
                          <div className={`flex items-start gap-1 ${entry.isAuto ? 'opacity-60' : ''}`}>
                            <div className="flex-1 min-w-0">
                              {entry.isAuto && (
                                <div className="text-[8px] text-amber-400/70 font-mono mb-0.5 uppercase tracking-wider">
                                  Leftovers
                                </div>
                              )}
                              {isGlovo && (
                                <div className="text-[8px] text-green-400/70 font-mono mb-0.5 uppercase tracking-wider">
                                  Glovo
                                </div>
                              )}
                              <p className={`text-[10px] font-semibold leading-tight truncate ${isGlovo ? 'text-green-300' : 'text-foreground'}`}>
                                {entry.recipe.name}
                              </p>
                              <p className="text-[9px] text-muted mt-0.5 font-mono">
                                {entry.recipe.macrosPerServing.kcal} kcal · {entry.recipe.macrosPerServing.proteinG}g
                              </p>
                            </div>
                            <button
                              onClick={() => clearCell(rowType, day)}
                              className="text-muted/50 hover:text-red-400 text-sm flex-shrink-0 leading-none -mt-0.5"
                              title="Clear"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[36px]">
                            <span className="text-[9px] text-muted/30">drag here</span>
                          </div>
                        )}
                      </DroppableCell>
                    );
                  }

                  if (isPB) {
                    const mealTime: MealType = rowType === 'pb-lunch' ? 'lunch' : 'dinner';
                    const buf = getBufferForSlot(day, mealTime);
                    return (
                      <DroppableCell key={day} id={cellId} isToday={isToday}>
                        {buf ? (
                          <div className="flex items-start gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-semibold text-amber-300 leading-tight truncate">
                                {buf.name}
                              </p>
                              <p className="text-[9px] text-muted mt-0.5 font-mono">
                                {buf.kcal} kcal · {buf.proteinG}g
                              </p>
                            </div>
                            <button
                              onClick={() => clearCell(rowType, day)}
                              className="text-muted/50 hover:text-red-400 text-sm flex-shrink-0 leading-none -mt-0.5"
                              title="Clear"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[36px]">
                            <span className="text-[9px] text-muted/30">drag PB</span>
                          </div>
                        )}
                      </DroppableCell>
                    );
                  }

                  return null;
                })}
              </div>
            ))}

            {/* Totals */}
            <div className="grid gap-1 mt-2 pt-2 border-t border-border/50" style={colStyle}>
              <div className="text-[10px] leading-tight">
                <div className="text-accent font-semibold">Today</div>
                <div className={getMacroColor(todayMacros.kcal, DAILY_KCAL)}>
                  {todayMacros.kcal > 0 ? `${todayMacros.kcal}` : '–'}
                </div>
                <div className={getMacroColor(todayMacros.proteinG, DAILY_PROTEIN)}>
                  {todayMacros.proteinG > 0 ? `${todayMacros.proteinG}g` : '–'}
                </div>
              </div>
              {days.map((day) => {
                const { kcal, proteinG } = getDayMacros(day);
                return (
                  <div key={day} className="text-center">
                    <p className={`text-[10px] font-mono font-semibold ${getMacroColor(kcal, DAILY_KCAL)}`}>
                      {kcal > 0 ? `${kcal}` : '–'}
                    </p>
                    <p className={`text-[10px] font-mono ${getMacroColor(proteinG, DAILY_PROTEIN)}`}>
                      {proteinG > 0 ? `${proteinG}g` : '–'}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="grid gap-1" style={colStyle}>
              <div className="text-[9px] text-muted/40">Target</div>
              {days.map((day) => (
                <div key={day} className="text-center">
                  <p className="text-[9px] text-muted/40 font-mono">{DAILY_KCAL}</p>
                  <p className="text-[9px] text-muted/40 font-mono">{DAILY_PROTEIN}g</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Pools ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

          {/* Recipe Pool */}
          <div className="bg-surface-2 border border-border rounded-xl p-3">
            <p className="text-xs font-semibold text-muted mb-2">🍽 Recipes — drag to Lunch or Dinner</p>
            <div className="flex flex-col gap-2">
              {availableRecipes.map((recipe) => (
                <DraggableItem key={recipe.id} id={`recipe::${recipe.id}`}>
                  <p className="font-semibold text-foreground truncate">{recipe.name}</p>
                  <p className="text-muted mt-0.5 font-mono">
                    {recipe.macrosPerServing.kcal} kcal · {recipe.macrosPerServing.proteinG}g
                  </p>
                </DraggableItem>
              ))}
            </div>
          </div>

          {/* Buffer Pool */}
          {availableBuffers.length > 0 && (
            <div className="bg-surface-2 border border-amber-500/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-400 mb-2">🌅 Protein Buffers — drag to PB rows</p>
              <div className="flex flex-col gap-2">
                {availableBuffers.map((buffer) => (
                  <DraggableItem key={buffer.name} id={`buffer::${buffer.name}`}>
                    <p className="font-semibold text-amber-300 truncate">{buffer.name}</p>
                    <p className="text-muted mt-0.5 font-mono">
                      {buffer.kcal} kcal · {buffer.proteinG}g
                    </p>
                  </DraggableItem>
                ))}
              </div>
            </div>
          )}

          {/* Glovo Pool */}
          <div className="bg-surface-2 border border-green-500/30 rounded-xl p-3">
            <p className="text-xs font-semibold text-green-400 mb-2">🛵 Glovo — drag to any meal slot</p>
            <DraggableItem id={`recipe::${HONEST_GREENS.id}`}>
              <p className="font-semibold text-green-300 truncate">{HONEST_GREENS.name}</p>
              <p className="text-muted mt-0.5 font-mono">
                {HONEST_GREENS.macrosPerServing.kcal} kcal · {HONEST_GREENS.macrosPerServing.proteinG}g
              </p>
            </DraggableItem>
          </div>
        </div>

        {/* ── Confirm button ── */}
        <button
          onClick={handleConfirm}
          className="w-full py-3 bg-accent text-black font-semibold rounded-xl hover:bg-amber-500 transition-colors"
        >
          Confirm Timetable →
        </button>
      </div>

      {/* Drag overlay */}
      <DragOverlay>{getOverlayContent()}</DragOverlay>
    </DndContext>
  );
}
