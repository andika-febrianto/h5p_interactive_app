import { useState } from 'react';
import type { Frame, FrameKind } from '../../types/storyboard';
import { randomId, slugify } from '../../lib/idgen';
import { FileUploadField } from './FileUploadField';
import { RichTextEditor } from './RichTextEditor';
import { ScenePlayer } from '../ScenePlayer';
import { ProgressProvider } from '../../context/ProgressContext';

const KIND_OPTIONS: { value: FrameKind; label: string }[] = [
  { value: 'text', label: 'Materi (Teks)' },
  { value: 'quiz', label: 'Kuis' },
  { value: 'dragdrop', label: 'Drag & Drop' },
  { value: 'video', label: 'Interactive Video' },
  { value: 'pdf', label: 'Dokumen PDF' },
  { value: 'shortanswer', label: 'Isian Singkat / Angka' },
];

type QuizQ = { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string };

function emptyQuestion(): QuizQ {
  return { id: randomId('q'), prompt: '', options: ['', ''], correctIndex: 0, explanation: '' };
}

/** Internal draft shape — a superset of every kind's fields, all optional,
 *  so switching `kind` in the dropdown doesn't lose what the teacher already typed. */
interface Draft {
  id: string;
  panel: string;
  title: string;
  note: string;
  kind: FrameKind;
  body: string;
  imageAlt: string;
  imageQuery: string;
  imageUrl: string;
  questions: QuizQ[];
  instructions: string;
  items: { id: string; label: string; zoneId: string }[];
  zones: { id: string; label: string; hint: string }[];
  src: string;
  poster: string;
  markers: { id: string; timeSec: number; question: QuizQ }[];
  description: string;
  saItems: { id: string; prompt: string; acceptedAnswers: string; inputType: 'text' | 'number'; explanation: string }[];
}

function draftFromFrame(frame: Frame | null): Draft {
  const base: Draft = {
    id: frame?.id ?? '',
    panel: frame?.panel ?? '',
    title: frame?.title ?? '',
    note: frame && 'note' in frame ? (frame.note ?? '') : '',
    kind: frame?.kind ?? 'text',
    body: '',
    imageAlt: '',
    imageQuery: '',
    imageUrl: '',
    questions: [emptyQuestion()],
    instructions: '',
    items: [],
    zones: [],
    src: '',
    poster: '',
    markers: [],
    description: '',
    saItems: [],
  };
  if (!frame) return base;

  if (frame.kind === 'text') {
    base.body = frame.body;
    base.imageAlt = frame.imageAlt ?? '';
    base.imageQuery = frame.imageQuery ?? '';
    base.imageUrl = frame.imageUrl ?? '';
  } else if (frame.kind === 'quiz') {
    base.questions = frame.questions;
  } else if (frame.kind === 'dragdrop') {
    base.instructions = frame.instructions;
    base.items = frame.items;
    base.zones = frame.zones.map((z) => ({ ...z, hint: z.hint ?? '' }));
  } else if (frame.kind === 'video') {
    base.src = frame.src;
    base.poster = frame.poster ?? '';
    base.markers = frame.markers;
  } else if (frame.kind === 'pdf') {
    base.src = frame.src;
    base.description = frame.description;
  } else if (frame.kind === 'shortanswer') {
    base.instructions = frame.instructions;
    base.saItems = frame.items.map((it) => ({
      ...it,
      acceptedAnswers: it.acceptedAnswers.join(', '),
      inputType: it.inputType ?? 'text',
    }));
  }
  return base;
}

/** Converts the draft back into the flat payload the API expects
 *  (base fields + kind + kind-specific fields, all in one object). */
function draftToPayload(d: Draft): Record<string, unknown> {
  const base = { id: d.id, panel: d.panel, title: d.title, ...(d.note ? { note: d.note } : {}), kind: d.kind };
  switch (d.kind) {
    case 'text':
      return {
        ...base,
        body: d.body,
        ...(d.imageAlt ? { imageAlt: d.imageAlt } : {}),
        ...(d.imageQuery ? { imageQuery: d.imageQuery } : {}),
        ...(d.imageUrl ? { imageUrl: d.imageUrl } : {}),
      };
    case 'quiz':
      return { ...base, questions: d.questions };
    case 'dragdrop':
      return {
        ...base,
        instructions: d.instructions,
        items: d.items,
        zones: d.zones.map((z) => ({ id: z.id, label: z.label, ...(z.hint ? { hint: z.hint } : {}) })),
      };
    case 'video':
      return { ...base, src: d.src, ...(d.poster ? { poster: d.poster } : {}), markers: d.markers };
    case 'pdf':
      return { ...base, src: d.src, description: d.description };
    case 'shortanswer':
      return {
        ...base,
        instructions: d.instructions,
        items: d.saItems.map((it) => ({
          id: it.id,
          prompt: it.prompt,
          acceptedAnswers: it.acceptedAnswers.split(',').map((s) => s.trim()).filter(Boolean),
          inputType: it.inputType,
          explanation: it.explanation,
        })),
      };
  }
}

/** Same as draftToPayload but guarantees a non-empty id/panel/title so the
 *  preview never crashes while the teacher is still filling in the basics. */
function draftToFrame(d: Draft): Frame {
  const payload = draftToPayload(d);
  return {
    ...payload,
    id: d.id || 'preview',
    panel: d.panel || '—',
    title: d.title || '(Judul belum diisi)',
  } as unknown as Frame;
}

export function FrameForm({
  frame,
  isNew,
  onSave,
  onCancel,
}: {
  frame: Frame | null;
  isNew: boolean;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [d, setD] = useState<Draft>(() => draftFromFrame(frame));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSave(draftToPayload(d));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan panel.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="frame-form-with-preview">
      <form className="frame-form" onSubmit={handleSubmit}>
      <div className="frame-form-grid">
        <label className="auth-field">
          <span>id panel (slug)</span>
          <input
            value={d.id}
            onChange={(e) => update('id', slugify(e.target.value))}
            disabled={!isNew}
            required
          />
        </label>
        <label className="auth-field">
          <span>Nomor panel</span>
          <input value={d.panel} onChange={(e) => update('panel', e.target.value)} placeholder="1.1" required />
        </label>
        <label className="auth-field">
          <span>Tipe panel</span>
          <select value={d.kind} onChange={(e) => update('kind', e.target.value as FrameKind)}>
            {KIND_OPTIONS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="auth-field">
        <span>Judul panel</span>
        <input value={d.title} onChange={(e) => update('title', e.target.value)} required />
      </label>
      <label className="auth-field">
        <span>Catatan storyboard (opsional)</span>
        <input value={d.note} onChange={(e) => update('note', e.target.value)} placeholder="Catatan internal, tidak tampil ke murid" />
      </label>

      {d.kind === 'text' && (
        <>
          <label className="auth-field">
            <span>Isi materi</span>
            <RichTextEditor value={d.body} onChange={(v) => update('body', v)} placeholder="Tulis isi materi di sini..." />
          </label>
          <FileUploadField
            label="Gambar materi (opsional)"
            accept="image/png,image/jpeg,image/webp,image/gif"
            value={d.imageUrl}
            onChange={(url) => update('imageUrl', url)}
          />
          {d.imageUrl && (
            <label className="auth-field">
              <span>Deskripsi gambar (untuk aksesibilitas)</span>
              <input value={d.imageAlt} onChange={(e) => update('imageAlt', e.target.value)} />
            </label>
          )}
        </>
      )}

      {d.kind === 'quiz' && (
        <QuestionListEditor
          label="Pertanyaan"
          questions={d.questions}
          onChange={(qs) => update('questions', qs)}
        />
      )}

      {d.kind === 'dragdrop' && (
        <DragDropEditor
          instructions={d.instructions}
          items={d.items}
          zones={d.zones}
          onInstructions={(v) => update('instructions', v)}
          onItems={(v) => update('items', v)}
          onZones={(v) => update('zones', v)}
        />
      )}

      {d.kind === 'video' && (
        <>
          <label className="auth-field">
            <span>URL video (mp4/webm)</span>
            <input value={d.src} onChange={(e) => update('src', e.target.value)} required placeholder="https://..." />
          </label>
          <p className="frame-form-hint">
            Video tidak diunggah lewat form ini (ukurannya besar) — tempel URL video yang sudah
            di-hosting (mis. link .mp4 langsung, bukan halaman YouTube).
          </p>
          <FileUploadField
            label="Gambar poster (opsional)"
            accept="image/png,image/jpeg,image/webp,image/gif"
            value={d.poster}
            onChange={(url) => update('poster', url)}
          />
          <MarkerListEditor markers={d.markers} onChange={(m) => update('markers', m)} />
        </>
      )}

      {d.kind === 'pdf' && (
        <>
          <FileUploadField
            label="Dokumen PDF"
            accept="application/pdf"
            value={d.src}
            onChange={(url) => update('src', url)}
            urlPlaceholder="https://... atau unggah PDF"
          />
          <label className="auth-field">
            <span>Deskripsi dokumen</span>
            <textarea value={d.description} onChange={(e) => update('description', e.target.value)} rows={3} required />
          </label>
        </>
      )}

      {d.kind === 'shortanswer' && (
        <ShortAnswerEditor
          instructions={d.instructions}
          items={d.saItems}
          onInstructions={(v) => update('instructions', v)}
          onItems={(v) => update('saItems', v)}
        />
      )}

      {error && <p className="auth-error">{error}</p>}

      <div className="frame-form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Panel'}
        </button>
      </div>
      </form>

      <div className="frame-preview-pane">
        <p className="frame-preview-label">👁 Pratinjau langsung (persis tampilan murid)</p>
        <div className="frame-preview-frame">
          <ProgressProvider
            key={`${d.kind}-${d.questions.length}-${d.items.length}-${d.zones.length}-${d.markers.length}-${d.saItems.length}`}
            moduleId="preview"
            totalFrames={1}
            disableApi
          >
            <ScenePlayer frame={draftToFrame(d)} onDone={() => {}} />
          </ProgressProvider>
        </div>
      </div>
    </div>
  );
}

// ---------- Sub-editors ----------

function QuestionListEditor({
  label,
  questions,
  onChange,
}: {
  label: string;
  questions: QuizQ[];
  onChange: (qs: QuizQ[]) => void;
}) {
  const updateQ = (i: number, patch: Partial<QuizQ>) => {
    const next = questions.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const updateOption = (qi: number, oi: number, value: string) => {
    const next = questions.slice();
    const options = next[qi].options.slice();
    options[oi] = value;
    next[qi] = { ...next[qi], options };
    onChange(next);
  };

  return (
    <div className="repeat-block">
      <p className="repeat-block-label">{label}</p>
      {questions.map((q, qi) => (
        <div className="repeat-item" key={q.id}>
          <label className="auth-field">
            <span>Pertanyaan {qi + 1}</span>
            <input value={q.prompt} onChange={(e) => updateQ(qi, { prompt: e.target.value })} required />
          </label>
          {q.options.map((opt, oi) => (
            <div key={oi} className="option-row">
              <input
                type="radio"
                name={`correct-${q.id}`}
                checked={q.correctIndex === oi}
                onChange={() => updateQ(qi, { correctIndex: oi })}
                title="Tandai sebagai jawaban benar"
              />
              <input
                value={opt}
                onChange={(e) => updateOption(qi, oi, e.target.value)}
                placeholder={`Opsi ${oi + 1}`}
                required
              />
              {q.options.length > 2 && (
                <button
                  type="button"
                  className="repeat-remove"
                  onClick={() => updateQ(qi, { options: q.options.filter((_, x) => x !== oi) })}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-secondary btn-small"
            onClick={() => updateQ(qi, { options: [...q.options, ''] })}
          >
            + Opsi
          </button>
          <label className="auth-field">
            <span>Penjelasan jawaban</span>
            <input value={q.explanation} onChange={(e) => updateQ(qi, { explanation: e.target.value })} required />
          </label>
          {questions.length > 1 && (
            <button
              type="button"
              className="btn-secondary btn-small"
              onClick={() => onChange(questions.filter((_, x) => x !== qi))}
            >
              Hapus pertanyaan ini
            </button>
          )}
          <hr className="repeat-divider" />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={() => onChange([...questions, emptyQuestion()])}>
        + Tambah Pertanyaan
      </button>
    </div>
  );
}

function DragDropEditor({
  instructions,
  items,
  zones,
  onInstructions,
  onItems,
  onZones,
}: {
  instructions: string;
  items: { id: string; label: string; zoneId: string }[];
  zones: { id: string; label: string; hint: string }[];
  onInstructions: (v: string) => void;
  onItems: (v: { id: string; label: string; zoneId: string }[]) => void;
  onZones: (v: { id: string; label: string; hint: string }[]) => void;
}) {
  const addZone = () => onZones([...zones, { id: randomId('zone'), label: '', hint: '' }]);
  const addItem = () =>
    onItems([...items, { id: randomId('item'), label: '', zoneId: zones[0]?.id ?? '' }]);

  return (
    <div className="repeat-block">
      <label className="auth-field">
        <span>Instruksi</span>
        <input value={instructions} onChange={(e) => onInstructions(e.target.value)} required />
      </label>

      <p className="repeat-block-label">Zona (target seret)</p>
      {zones.map((z, i) => (
        <div className="option-row" key={z.id}>
          <input
            value={z.label}
            onChange={(e) => {
              const next = zones.slice();
              next[i] = { ...next[i], label: e.target.value };
              onZones(next);
            }}
            placeholder="Nama zona"
            required
          />
          <input
            value={z.hint}
            onChange={(e) => {
              const next = zones.slice();
              next[i] = { ...next[i], hint: e.target.value };
              onZones(next);
            }}
            placeholder="Keterangan (opsional)"
          />
          <button
            type="button"
            className="repeat-remove"
            onClick={() => onZones(zones.filter((_, x) => x !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary btn-small" onClick={addZone}>
        + Zona
      </button>

      <p className="repeat-block-label" style={{ marginTop: 16 }}>Item (yang diseret)</p>
      {items.map((it, i) => (
        <div className="option-row" key={it.id}>
          <input
            value={it.label}
            onChange={(e) => {
              const next = items.slice();
              next[i] = { ...next[i], label: e.target.value };
              onItems(next);
            }}
            placeholder="Nama item"
            required
          />
          <select
            value={it.zoneId}
            onChange={(e) => {
              const next = items.slice();
              next[i] = { ...next[i], zoneId: e.target.value };
              onItems(next);
            }}
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.label || '(zona belum diberi nama)'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="repeat-remove"
            onClick={() => onItems(items.filter((_, x) => x !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn-secondary btn-small" onClick={addItem} disabled={zones.length === 0}>
        + Item
      </button>
      {zones.length === 0 && <p className="frame-form-hint">Tambahkan minimal 1 zona dulu.</p>}
    </div>
  );
}

function MarkerListEditor({
  markers,
  onChange,
}: {
  markers: { id: string; timeSec: number; question: QuizQ }[];
  onChange: (m: { id: string; timeSec: number; question: QuizQ }[]) => void;
}) {
  const add = () => onChange([...markers, { id: randomId('marker'), timeSec: 0, question: emptyQuestion() }]);

  return (
    <div className="repeat-block">
      <p className="repeat-block-label">Penanda jeda video (pertanyaan)</p>
      {markers.map((m, i) => (
        <div className="repeat-item" key={m.id}>
          <label className="auth-field">
            <span>Jeda pada detik ke-</span>
            <input
              type="number"
              min={0}
              value={m.timeSec}
              onChange={(e) => {
                const next = markers.slice();
                next[i] = { ...next[i], timeSec: Number(e.target.value) };
                onChange(next);
              }}
              required
            />
          </label>
          <QuestionListEditor
            label="Pertanyaan saat jeda"
            questions={[m.question]}
            onChange={(qs) => {
              const next = markers.slice();
              next[i] = { ...next[i], question: qs[0] };
              onChange(next);
            }}
          />
          <button type="button" className="btn-secondary btn-small" onClick={() => onChange(markers.filter((_, x) => x !== i))}>
            Hapus penanda ini
          </button>
          <hr className="repeat-divider" />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Tambah Penanda
      </button>
    </div>
  );
}

function ShortAnswerEditor({
  instructions,
  items,
  onInstructions,
  onItems,
}: {
  instructions: string;
  items: { id: string; prompt: string; acceptedAnswers: string; inputType: 'text' | 'number'; explanation: string }[];
  onInstructions: (v: string) => void;
  onItems: (
    v: { id: string; prompt: string; acceptedAnswers: string; inputType: 'text' | 'number'; explanation: string }[]
  ) => void;
}) {
  const add = () =>
    onItems([...items, { id: randomId('sa'), prompt: '', acceptedAnswers: '', inputType: 'number', explanation: '' }]);

  return (
    <div className="repeat-block">
      <label className="auth-field">
        <span>Instruksi</span>
        <input value={instructions} onChange={(e) => onInstructions(e.target.value)} required />
      </label>

      {items.map((it, i) => (
        <div className="repeat-item" key={it.id}>
          <label className="auth-field">
            <span>Pertanyaan</span>
            <input
              value={it.prompt}
              onChange={(e) => {
                const next = items.slice();
                next[i] = { ...next[i], prompt: e.target.value };
                onItems(next);
              }}
              required
            />
          </label>
          <label className="auth-field">
            <span>Jawaban yang diterima (pisahkan dengan koma jika lebih dari satu)</span>
            <input
              value={it.acceptedAnswers}
              onChange={(e) => {
                const next = items.slice();
                next[i] = { ...next[i], acceptedAnswers: e.target.value };
                onItems(next);
              }}
              placeholder="8, delapan"
              required
            />
          </label>
          <label className="auth-field">
            <span>Tipe jawaban</span>
            <select
              value={it.inputType}
              onChange={(e) => {
                const next = items.slice();
                next[i] = { ...next[i], inputType: e.target.value as 'text' | 'number' };
                onItems(next);
              }}
            >
              <option value="number">Angka</option>
              <option value="text">Teks</option>
            </select>
          </label>
          <label className="auth-field">
            <span>Penjelasan</span>
            <input
              value={it.explanation}
              onChange={(e) => {
                const next = items.slice();
                next[i] = { ...next[i], explanation: e.target.value };
                onItems(next);
              }}
              required
            />
          </label>
          <button type="button" className="btn-secondary btn-small" onClick={() => onItems(items.filter((_, x) => x !== i))}>
            Hapus isian ini
          </button>
          <hr className="repeat-divider" />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Tambah Isian
      </button>
    </div>
  );
}
