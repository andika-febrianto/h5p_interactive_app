import type { Frame } from '../types/storyboard';
import { TextScene } from './scenes/TextScene';
import { QuizScene } from './scenes/QuizScene';
import { DragDropScene } from './scenes/DragDropScene';
import { VideoScene } from './scenes/VideoScene';
import { PdfScene } from './scenes/PdfScene';
import { ShortAnswerScene } from './scenes/ShortAnswerScene';

export function ScenePlayer({ frame, onDone }: { frame: Frame; onDone: () => void }) {
  switch (frame.kind) {
    case 'text':
      return <TextScene frame={frame} onDone={onDone} />;
    case 'quiz':
      return <QuizScene frame={frame} onDone={onDone} />;
    case 'dragdrop':
      return <DragDropScene frame={frame} onDone={onDone} />;
    case 'video':
      return <VideoScene frame={frame} onDone={onDone} />;
    case 'pdf':
      return <PdfScene frame={frame} onDone={onDone} />;
    case 'shortanswer':
      return <ShortAnswerScene frame={frame} onDone={onDone} />;
    default: {
      const _exhaustive: never = frame;
      return _exhaustive;
    }
  }
}
