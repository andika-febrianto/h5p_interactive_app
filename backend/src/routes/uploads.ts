import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { upload } from '../lib/upload.js'

export const uploadsRouter = Router()

// POST /api/uploads — guru only. Multipart form field name: "file".
// Returns { url, filename, mimetype, size } where `url` is a path like
// "/uploads/<uuid>.pdf" that the frontend can use directly as a frame's
// `src` (pdf/video poster) — the file is served statically at that path.
uploadsRouter.post('/', requireAuth, requireRole('TEACHER'), (req, res) => {
  upload.single('file')(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'Upload gagal.'
      const isTooLarge = message.toLowerCase().includes('file too large')
      res.status(isTooLarge ? 413 : 400).json({
        error: isTooLarge ? 'File terlalu besar (maksimum 20MB).' : message,
      })
      return
    }
    if (!req.file) {
      res
        .status(400)
        .json({ error: 'Tidak ada file yang diunggah (field "file" kosong).' })
      return
    }
    res.status(201).json({
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
    })
  })
})
