import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
  KeyboardSensor,
} from '@dnd-kit/core';
import type { DragDropFrame } from '../../types/storyboard';
import { useProgress } from '../../context/ProgressContext';

function DraggableItem({ id, label, placed }: { id: string; label: string; placed: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  if (placed) return null;

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`dnd-item ${isDragging ? 'is-dragging' : ''}`}
      type="button"
    >
      {label}
    </button>
  );
}

function DropZone({
  id,
  label,
  hint,
  filledItems,
  status,
}: {
  id: string;
  label: string;
  hint?: string;
  filledItems: { id: string; label: string; correct: boolean }[];
  status?: 'idle' | 'checked';
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`dnd-zone ${isOver ? 'is-over' : ''}`}>
      <p className="dnd-zone-label">{label}</p>
      {hint && <p className="dnd-zone-hint">{hint}</p>}
      <div className="dnd-zone-slot">
        {filledItems.map((it) => (
          <span
            key={it.id}
            className={`dnd-chip ${status === 'checked' ? (it.correct ? 'chip-correct' : 'chip-wrong') : ''}`}
          >
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DragDropScene({ frame, onDone }: { frame: DragDropFrame; onDone: () => void }) {
  const { setResult } = useProgress();
  const [placement, setPlacement] = useState<Record<string, string>>({}); // itemId -> zoneId
  const [activeId, setActiveId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
    // Lets keyboard-only and screen-reader users drag: Tab to an item, Enter/Space
    // to pick it up, Arrow keys to move, Enter/Space to drop, Escape to cancel.
    useSensor(KeyboardSensor)
  );

  const itemsById = useMemo(
    () => Object.fromEntries(frame.items.map((it) => [it.id, it])),
    [frame.items]
  );

  const handleDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;
    setPlacement((prev) => ({ ...prev, [String(active.id)]: String(over.id) }));
  };

  const allPlaced = frame.items.every((it) => placement[it.id]);
  const correctCount = frame.items.filter((it) => placement[it.id] === it.zoneId).length;

  const handleCheck = () => {
    setChecked(true);
    setResult({
      frameId: frame.id,
      completed: true,
      correct: correctCount,
      total: frame.items.length,
    });
  };

  const handleReset = () => {
    setPlacement({});
    setChecked(false);
  };

  return (
    <div className="scene dnd-scene">
      <header className="scene-header">
        <span className="panel-tag">Panel {frame.panel} · Drag &amp; Drop</span>
        <h2>{frame.title}</h2>
        <p className="scene-instructions">{frame.instructions}</p>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="dnd-tray">
          {frame.items.map((it) => (
            <DraggableItem key={it.id} id={it.id} label={it.label} placed={!!placement[it.id]} />
          ))}
          {frame.items.every((it) => placement[it.id]) && (
            <p className="dnd-tray-empty">Semua item sudah ditempatkan.</p>
          )}
        </div>

        <div className="dnd-zones">
          {frame.zones.map((zone) => {
            const filled = frame.items
              .filter((it) => placement[it.id] === zone.id)
              .map((it) => ({ id: it.id, label: it.label, correct: it.zoneId === zone.id }));
            return (
              <DropZone
                key={zone.id}
                id={zone.id}
                label={zone.label}
                hint={zone.hint}
                filledItems={filled}
                status={checked ? 'checked' : 'idle'}
              />
            );
          })}
        </div>

        <DragOverlay>
          {activeId ? <div className="dnd-item dnd-item-overlay">{itemsById[activeId]?.label}</div> : null}
        </DragOverlay>
      </DndContext>

      <div className="quiz-result-bar">
        {!checked ? (
          <button className="btn-primary" disabled={!allPlaced} onClick={handleCheck}>
            Periksa Penempatan
          </button>
        ) : (
          <>
            <p>
              Tepat: <strong>{correctCount}</strong> / {frame.items.length}
            </p>
            <button className="btn-secondary" onClick={handleReset}>
              Coba Lagi
            </button>
            <button className="btn-primary" onClick={onDone}>
              Lanjutkan →
            </button>
          </>
        )}
      </div>
    </div>
  );
}
