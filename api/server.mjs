/**
 * 班级作品集中存储 API：磁盘目录 + meta.json，供所有浏览器/账号共享列表。
 * 投票：`votes.json`（voterStudentId → votedSubmissionId），原子写入。
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

const VOTES_FILE = path.join(DATA_ROOT, 'votes.json')

await fs.mkdir(DATA_ROOT, { recursive: true })

/**
 * @returns {Promise<Record<string, string>>}
 */
async function readVoteMap() {
  try {
    const raw = await fs.readFile(VOTES_FILE, 'utf8')
    const o = JSON.parse(raw)
    if (typeof o !== 'object' || o === null || Array.isArray(o)) {
      return {}
    }
    /** @type {Record<string, string>} */
    const out = {}
    for (const [k, v] of Object.entries(o)) {
      if (typeof k === 'string' && typeof v === 'string' && k.trim() && v.trim()) {
        out[k.trim()] = v.trim()
      }
    }
    return out
  } catch {
    return {}
  }
}

/**
 * @param {Record<string, string>} map
 */
async function writeVoteMapAtomic(map) {
  const tmp = path.join(DATA_ROOT, `votes.${randomUUID()}.tmp.json`)
  await fs.writeFile(tmp, JSON.stringify(map, null, 0), 'utf8')
  await fs.rename(tmp, VOTES_FILE)
}

/**
 * @param {string} submissionId
 */
async function submissionMetaExists(submissionId) {
  if (!UUID_RE.test(submissionId)) {
    return false
  }
  try {
    await fs.access(path.join(DATA_ROOT, submissionId, 'meta.json'))
    return true
  } catch {
    return false
  }
}

/**
 * @param {Record<string, string>} map
 * @param {Set<string>} validSubmissionIds
 * @returns {boolean} 是否写回磁盘
 */
function pruneVotesNotInList(map, validSubmissionIds) {
  let changed = false
  for (const [voter, sid] of Object.entries(map)) {
    if (!validSubmissionIds.has(sid)) {
      delete map[voter]
      changed = true
    }
  }
  return changed
}

/**
 * @param {Record<string, string>} map
 * @returns {Map<string, number>}
 */
function tallyVotes(map) {
  const counts = new Map()
  for (const sid of Object.values(map)) {
    counts.set(sid, (counts.get(sid) ?? 0) + 1)
  }
  return counts
}

/**
 * 删除所有指向某作品的选票。
 *
 * @param {string} submissionId
 */
async function removeVotesForSubmission(submissionId) {
  const map = await readVoteMap()
  let changed = false
  for (const [voter, sid] of Object.entries(map)) {
    if (sid === submissionId) {
      delete map[voter]
      changed = true
    }
  }
  if (changed) {
    await writeVoteMapAtomic(map)
  }
}

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

app.get('/votes/by-voter', async (req, res) => {
  try {
    const voterStudentId = String(req.query.voterStudentId ?? '').trim()
    if (!voterStudentId) {
      return res.status(400).json({ error: 'missing_voter' })
    }
    const map = await readVoteMap()
    const sid = map[voterStudentId]
    if (sid == null || sid === '') {
      return res.json({ votedSubmissionId: null })
    }
    if (!(await submissionMetaExists(sid))) {
      delete map[voterStudentId]
      await writeVoteMapAtomic(map)
      return res.json({ votedSubmissionId: null })
    }
    return res.json({ votedSubmissionId: sid })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'vote_read_failed' })
  }
})

app.put('/votes', async (req, res) => {
  try {
    const voterStudentId = String(req.body?.voterStudentId ?? '').trim()
    const votedSubmissionId = String(req.body?.votedSubmissionId ?? '').trim()
    if (!voterStudentId || !votedSubmissionId) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (!UUID_RE.test(votedSubmissionId)) {
      return res.status(400).json({ error: 'invalid_submission_id' })
    }
    const base = path.join(DATA_ROOT, votedSubmissionId)
    let meta
    try {
      meta = JSON.parse(await fs.readFile(path.join(base, 'meta.json'), 'utf8'))
    } catch {
      return res.status(404).json({ error: 'submission_not_found' })
    }
    if (String(meta.uploaderStudentId ?? '').trim() === voterStudentId) {
      return res.status(403).json({ error: 'cannot_vote_own' })
    }
    const map = await readVoteMap()
    map[voterStudentId] = votedSubmissionId
    await writeVoteMapAtomic(map)
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'vote_write_failed' })
  }
})

app.get('/submissions', async (_req, res) => {
  try {
    const entries = await fs.readdir(DATA_ROOT, { withFileTypes: true })
    const metas = []
    const validIds = new Set()
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
        const m = JSON.parse(raw)
        metas.push(m)
        validIds.add(ent.name)
        if (m.submissionId && typeof m.submissionId === 'string') {
          validIds.add(m.submissionId.trim())
        }
      } catch {
        /* 跳过不完整目录 */
      }
    }
    const map = await readVoteMap()
    if (pruneVotesNotInList(map, validIds)) {
      await writeVoteMapAtomic(map)
    }
    const tallies = tallyVotes(map)
    for (const m of metas) {
      const id = String(m.submissionId ?? '').trim()
      m.voteCount = id ? (tallies.get(id) ?? 0) : 0
    }
    metas.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    res.json(metas)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'list_failed' })
  }
})

const MAX_DISPLAY_TITLE_LEN = 80
/** 管理员上传：与前端 `classSubmissionAdmin.ts` 保持一致 */
const ADMIN_UPLOADER_DISPLAY_NAME = 'yxz'
const ADMIN_UPLOADER_STUDENT_ID = '6811'
const MAX_AUTHOR_DISPLAY_LEN = 40

/**
 * @param {string} displayName
 * @param {string} studentId
 */
function isAdminUploader(displayName, studentId) {
  return (
    displayName === ADMIN_UPLOADER_DISPLAY_NAME &&
    studentId === ADMIN_UPLOADER_STUDENT_ID
  )
}

app.post('/submissions', upload.single('file'), async (req, res) => {
  const id = req._submissionId
  try {
    if (!req.file) {
      if (id) {
        await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      }
      return res.status(400).json({ error: 'missing_file' })
    }
    const operatorDisplayName = String(
      req.body.operatorDisplayName ?? req.body.uploaderDisplayName ?? '',
    ).trim()
    const operatorStudentId = String(
      req.body.operatorStudentId ?? req.body.uploaderStudentId ?? '',
    ).trim()
    const displayTitle = String(req.body.displayTitle ?? '').trim()
    const mediaKind = req.body.mediaKind === 'video' ? 'video' : 'image'
    if (!operatorDisplayName || !operatorStudentId || !displayTitle) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (displayTitle.length > MAX_DISPLAY_TITLE_LEN) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      return res.status(400).json({ error: 'display_title_too_long' })
    }
    if (!isAdminUploader(operatorDisplayName, operatorStudentId)) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      return res.status(403).json({ error: 'upload_forbidden' })
    }
    const authorDisplayName = String(req.body.authorDisplayName ?? '').trim()
    if (!authorDisplayName) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      return res.status(400).json({ error: 'missing_author' })
    }
    if (authorDisplayName.length > MAX_AUTHOR_DISPLAY_LEN) {
      await fs.rm(path.join(DATA_ROOT, id), { recursive: true, force: true })
      return res.status(400).json({ error: 'author_display_too_long' })
    }
    /** 列表/排行榜展示的作者名；学号为实际上传操作者（管理员） */
    const meta = {
      submissionId: id,
      createdAt: new Date().toISOString(),
      uploaderDisplayName: authorDisplayName,
      uploaderStudentId: operatorStudentId,
      authorDisplayName,
      displayTitle,
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

app.delete('/submissions/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (!UUID_RE.test(id)) {
      return res.status(400).json({ error: 'invalid_id' })
    }
    const operatorDisplayName = String(
      req.body?.operatorDisplayName ?? req.body?.uploaderDisplayName ?? '',
    ).trim()
    const operatorStudentId = String(
      req.body?.operatorStudentId ?? req.body?.uploaderStudentId ?? '',
    ).trim()
    if (!operatorDisplayName || !operatorStudentId) {
      return res.status(400).json({ error: 'missing_operator' })
    }
    if (!isAdminUploader(operatorDisplayName, operatorStudentId)) {
      return res.status(403).json({ error: 'forbidden_not_admin' })
    }
    const base = path.join(DATA_ROOT, id)
    try {
      await fs.readFile(path.join(base, 'meta.json'), 'utf8')
    } catch {
      return res.status(404).json({ error: 'not_found' })
    }
    await fs.rm(base, { recursive: true, force: true })
    await removeVotesForSubmission(id)
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'delete_failed' })
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
