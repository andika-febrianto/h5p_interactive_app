// Core data model: every activity in the module is a "Frame" in the storyboard.
// This mirrors how an instructional designer would lay out a storyboard document,
// so content authors can map rows/panels 1:1 into this JSON.

export type FrameKind = 'text' | 'quiz' | 'dragdrop' | 'video' | 'pdf' | 'shortanswer';

interface BaseFrame {
  id: string;
  kind: FrameKind;
  /** Frame number as it appears on the physical storyboard (e.g. "1.2") */
  panel: string;
  title: string;
  /** Director's / narration note carried over from the storyboard doc */
  note?: string;
}

export interface TextFrame extends BaseFrame {
  kind: 'text';
  body: string;
  imageAlt?: string;
  imageQuery?: string; // legacy: decorative gradient placeholder keyword
  imageUrl?: string; // real uploaded/linked image, rendered directly
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizFrame extends BaseFrame {
  kind: 'quiz';
  questions: QuizQuestion[];
}

export interface DragDropItem {
  id: string;
  label: string;
  zoneId: string; // correct zone
}

export interface DragDropZone {
  id: string;
  label: string;
  hint?: string;
}

export interface DragDropFrame extends BaseFrame {
  kind: 'dragdrop';
  instructions: string;
  items: DragDropItem[];
  zones: DragDropZone[];
}

export interface VideoMarker {
  id: string;
  timeSec: number;
  question: QuizQuestion;
}

export interface VideoFrame extends BaseFrame {
  kind: 'video';
  src: string;
  poster?: string;
  markers: VideoMarker[];
}

export interface PdfFrame extends BaseFrame {
  kind: 'pdf';
  /** Path or URL to the PDF file (e.g. a file placed in /public) */
  src: string;
  /** Short description of what this document contains */
  description: string;
}

export interface ShortAnswerItem {
  id: string;
  prompt: string;
  /** Any of these count as correct. Compared case/whitespace-insensitively;
   *  for inputType 'number' the comparison is numeric (so "8", "8.0", " 8 " all match). */
  acceptedAnswers: string[];
  /** Default 'text'. 'number' shows a numeric keypad on mobile and compares as a number. */
  inputType?: 'text' | 'number';
  explanation: string;
}

export interface ShortAnswerFrame extends BaseFrame {
  kind: 'shortanswer';
  instructions: string;
  items: ShortAnswerItem[];
}

export type Frame = TextFrame | QuizFrame | DragDropFrame | VideoFrame | PdfFrame | ShortAnswerFrame;

export interface Subject {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  accent: string;
}

export interface Module {
  id: string;
  /** References Subject.id — which mata pelajaran this module belongs to */
  subjectId: string;
  /** School grade level, e.g. 1-6 for SD */
  grade: number;
  /** Semester within that grade year */
  semester: 1 | 2;
  title: string;
  subtitle: string;
  /** One-line description shown on the module selection card */
  summary: string;
  /** Rough completion time shown on the module card, e.g. "10-15 menit" */
  estimatedMinutes: string;
  /** Accent hex color used for this module's card + icon tint */
  accent: string;
  frames: Frame[];
}

export interface FrameResult {
  frameId: string;
  completed: boolean;
  correct: number;
  total: number;
}

export type UserRole = 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: number;
  semester?: number;
}
