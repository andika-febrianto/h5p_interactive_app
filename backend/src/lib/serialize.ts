// import type { Frame as FrameRow, Module as ModuleRow } from '@prisma/client'

import type {
  Frame as FrameRow,
  Module as ModuleRow,
} from '../generated/prisma/client.js'

/** DB Frame -> frontend Frame JSON: merge the `data` JSON blob back onto the row,
 *  and rename `slug` back to `id` (frame ids are only unique within a module in
 *  the DB, but the frontend just expects a per-module unique `id`). */
export function serializeFrame(row: FrameRow) {
  const { moduleId: _moduleId, slug, note, order: _order, data, ...rest } = row
  return {
    id: slug,
    ...rest,
    ...(note !== null ? { note } : {}),
    ...(typeof data === 'object' && data !== null ? data : {}),
  }
}

export function serializeModule(row: ModuleRow & { frames?: FrameRow[] }) {
  const { frames, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = row
  return {
    ...rest,
    ...(frames ? { frames: frames.map(serializeFrame) } : {}),
  }
}
