import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { randomUUID } from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
//ini buat selaindeploy di vercel
// export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

//buat vercel
export const UPLOADS_DIR = '/tmp/uploads'

fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'application/pdf': '.pdf',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext =
      ALLOWED_MIME_TYPES[file.mimetype] ?? path.extname(file.originalname) ?? ''
    cb(null, `${randomUUID()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      cb(
        new Error(
          `Tipe file "${file.mimetype}" tidak didukung. Gunakan PDF, PNG, JPG, WEBP, atau GIF.`,
        ),
      )
      return
    }
    cb(null, true)
  },
})
