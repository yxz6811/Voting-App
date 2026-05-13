/**
 * 班级作品集中存储 API：磁盘目录 + meta.json，供所有浏览器/账号共享列表。
 *
 * 环境变量：
 * - `VOTING_DATA_DIR`：数据根目录（默认 `./data`）
 * - `PORT`：监听端口（默认 `3040`）
 */
import cors from 'cors'
import express from 'express'
import multer from 'multer'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_ROOT = process.env.VOTING_DATA_DIR || path.join(__dirname, 'data')
const PORT = Number(process.env.PORT || 3040)
const MAX_BYTES = 170 * 1024 * 1024

/** 仅允许 UUID 目录名，防止路径穿越 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

await fs.mkdir(DATA_ROOT, { recursive: true })

const storage = multer.diskStorage({
  destination: async (req, _file, cb) => {
    try {
      const id = randomUUID()
      req._submissionId = id
      const dir = path.join(DATA_ROOT, id)
      await fs.mkdir(dir, { recursive: true })
      cb(null, dir)
    } catch (e) {
      cb(e)
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin'
    cb(null, `media${ext}`)
  },
})

const upload = multer({ storage, limits: { fileSize: MAX_BYTES } })

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/submissions', async (_req, res) => {
  try {
    const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true })
    const metas = []
    for (const ent of entries) {
      if (!ent.isDirectory()) {
        continue
      }
      if (!UUID_RE.test(ent.name)) {
        continue
      }
      try {
        const raw = await fs.readFile(
          path.join(DATA_ROOT, ent.name, 'meta.json'),
          'utf8',
        )
        metas.push(JSON.parse(raw))
      } catch {
        /* 跳过不完整目录 */
      }
    }
    metas.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    res.json(metas)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'list_failed' })
  }
})

app.post('/submissions', upload.single('file'), async (req, res) => {
  const id = req._submissionId
  try {
    if (!req.file) {
      if (id) {
        await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      }
      return res.status(400).json({ error: 'missing_file' })
    }
    const uploaderDisplayName = String(req.body.uploaderDisplayName ?? '').trim()
    const uploaderStudentId = String(req.body.uploaderStudentId ?? '').trim()
    const mediaKind = req.body.mediaKind === 'video' ? 'video' : 'image'
    if (!uploaderDisplayName || !uploaderStudentId) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      return res.status(400).json({ error: 'missing_fields' })
    }
    const meta = {
      submissionId: id,
      createdAt: new Date().toISOString(),
      uploaderDisplayName,
      uploaderStudentId,
      mimeType: req.file.mimetype || 'application/octet-stream',
      originalFileName: req.file.originalname || 'upload',
      byteSize: req.file.size,
      mediaKind,
      storageFile: req.file.filename,
    }
    await fs.writeFile(
      path.join(DATA_ROOT, id, 'meta.json'),
      JSON.stringify(meta),
      'utf8',
    )
    res.json({ ok: true, submissionId: id })
  } catch (e) {
    console.error(e)
    if (id) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
    }
    res.status(500).json({ error: 'save_failed' })
  }
})

app.get('/submissions/:id/media', async (req, res) => {
  try {
    const id = req.params.id
    if (!UUID_RE.test(id)) {
      return res.status(400).end()
    }
    const base = path.join(DATA_ROOT, id)
    const meta = JSON.parse(
      await fs.readFile(path.join(base, 'meta.json'), 'utf8'),
    )
    const filePath = path.join(base, meta.storageFile || 'media')
    res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.sendFile(path.resolve(filePath))
  } catch {
    res.status(404).end()
  }
})

app.use((err, _req, res, next) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file_too_large' })
  }
  if (err) {
    console.error(err)
    return res.status(500).json({ error: 'server_error' })
  }
  next()
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`voting-submissions-api DATA_ROOT=${DATA_ROOT} PORT=${PORT}`)
})
