import { z } from 'zod';

// These mirror src/types/storyboard.ts on the frontend. Keep them in sync —
// this is what stands between a teacher's typo and a broken frontend render.

const baseFrameSchema = z.object({
  id: z.string().trim().min(1, 'id (slug) wajib diisi'),
  panel: z.string().trim().min(1, 'panel wajib diisi'),
  title: z.string().trim().min(1, 'title wajib diisi'),
  note: z.string().optional(),
});

const textDataSchema = z.object({
  kind: z.literal('text'),
  body: z.string().min(1, 'body wajib diisi'),
  imageAlt: z.string().optional(),
  imageQuery: z.string().optional(),
  imageUrl: z.string().optional(),
});

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  options: z.array(z.string().min(1)).min(2, 'minimal 2 opsi'),
  correctIndex: z.number().int().min(0),
  explanation: z.string().min(1),
});

const quizDataSchema = z.object({
  kind: z.literal('quiz'),
  questions: z.array(quizQuestionSchema).min(1, 'minimal 1 pertanyaan'),
});

const dragDropDataSchema = z.object({
  kind: z.literal('dragdrop'),
  instructions: z.string().min(1),
  items: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1), zoneId: z.string().min(1) }))
    .min(1),
  zones: z
    .array(z.object({ id: z.string().min(1), label: z.string().min(1), hint: z.string().optional() }))
    .min(1),
});

const videoDataSchema = z.object({
  kind: z.literal('video'),
  src: z.string().url('src harus berupa URL yang valid'),
  poster: z.string().optional(),
  markers: z.array(
    z.object({
      id: z.string().min(1),
      timeSec: z.number().min(0),
      question: quizQuestionSchema,
    })
  ),
});

const pdfDataSchema = z.object({
  kind: z.literal('pdf'),
  src: z.string().min(1, 'src wajib diisi'),
  description: z.string().min(1),
});

const shortAnswerDataSchema = z.object({
  kind: z.literal('shortanswer'),
  instructions: z.string().min(1),
  items: z
    .array(
      z.object({
        id: z.string().min(1),
        prompt: z.string().min(1),
        acceptedAnswers: z.array(z.string().min(1)).min(1, 'minimal 1 jawaban yang diterima'),
        inputType: z.enum(['text', 'number']).optional(),
        explanation: z.string().min(1),
      })
    )
    .min(1),
});

const frameDataSchema = z.discriminatedUnion('kind', [
  textDataSchema,
  quizDataSchema,
  dragDropDataSchema,
  videoDataSchema,
  pdfDataSchema,
  shortAnswerDataSchema,
]);

/** Full incoming frame payload: base fields + kind + kind-specific data, all in one flat object. */
export const frameInputSchema = z.intersection(baseFrameSchema, frameDataSchema);

export type FrameInput = z.infer<typeof frameInputSchema>;

export const moduleInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id hanya boleh huruf kecil, angka, dan tanda hubung'),
  subjectId: z.string().trim().min(1),
  grade: z.number().int().min(1).max(12),
  semester: z.union([z.literal(1), z.literal(2)]),
  title: z.string().trim().min(1),
  subtitle: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  estimatedMinutes: z.string().trim().min(1),
  accent: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'accent harus kode warna hex, mis. "#5B5FEF"'),
});

export const subjectInputSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'id hanya boleh huruf kecil, angka, dan tanda hubung'),
  name: z.string().trim().min(1),
  shortName: z.string().trim().min(1),
  description: z.string().trim().min(1),
  icon: z.string().trim().min(1),
  accent: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, 'accent harus kode warna hex, mis. "#5B5FEF"'),
});
