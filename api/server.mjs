/**
 * 班级作品集中存储 API：磁盘目录 + meta.json，供所有浏览器/账号共享列表。
 * 投票：`votes.json` 存 `voterStudentId → votedSubmissionId[]`（每人最多 10 票，不重复），原子写入；读写投票接口须携带 `voterDisplayName` 并与允许名单一致。
 *
 * 环境变量：
 * - `VOTING_DATA_DIR`：数据根目录（默认 `./data`）
 * - `PORT`：监听端口（默认 `3040`）
 * - 反馈邮件（QQ SMTP）：`VOTING_FEEDBACK_SMTP_PASS`（必填，为邮箱 SMTP 授权码，勿提交到仓库）、`VOTING_FEEDBACK_SMTP_USER`（发件账号，默认与收件邮箱一致）、`VOTING_FEEDBACK_TO_EMAIL`（收件，默认 `3978401510@qq.com`）、`VOTING_FEEDBACK_SMTP_HOST`（默认 `smtp.qq.com`）、`VOTING_FEEDBACK_SMTP_PORT`（默认 `465`）
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

/**
 * 与 `number.md`、`web/src/lib/loginRoster.ts` 同步的登录白名单（内联于此，避免线上只拷贝 `server.mjs` 时缺模块导致 API 无法启动）。
 *
 * @type {Readonly<Record<string, string>>}
 */
const LOGIN_ROSTER_BY_STUDENT_ID = Object.freeze({
  '1': '蔡雨何',
  '2': '曾昱棋',
  '3': '陈筱萱',
  '4': '方俊楠',
  '5': '封依',
  '6': '何亚楠',
  '7': '何裕翔',
  '8': '洪晨钦',
  '9': '金禹枭',
  '10': '金智炫',
  '11': '李安',
  '12': '李逸豪',
  '13': '刘嘉乐',
  '14': '陆佳涛',
  '15': '陆艺桐',
  '16': '骆辰娜',
  '17': '马铭阳',
  '18': '毛高默',
  '19': '倪嘉言',
  '20': '彭懿',
  '21': '沈旭东',
  '22': '孙浩淙',
  '23': '孙婧',
  '24': '孙俊哲',
  '25': '孙绮璐',
  '26': '孙晓楠',
  '27': '汤铭宇',
  '28': '唐子成',
  '29': '汪芷奕',
  '30': '吴一涵',
  '31': '吴逸天',
  '32': '谢睿泽',
  '33': '徐朗宁',
  '34': '徐史晨鹤',
  '35': '徐依雯',
  '36': '许佳燊',
  '37': '许鋆涵',
  '39': '杨蒣乐',
  '40': '余晨义',
  '41': '俞美伦',
  '42': '俞雨灵',
  '43': '张博豪',
  '44': '张之钰',
  '45': '张之珏',
  '46': '章程好',
  '47': '章一琳',
  '48': '赵一涵',
  '49': '朱婧妤',
  '50': '朱奕辰',
  '6811': 'yxz',
  '708': 'teacher',
})

/**
 * @param {string} studentId
 * @param {string} displayName
 * @returns {boolean}
 */
function isAllowedLoginPair(studentId, displayName) {
  const sid = String(studentId ?? '').trim()
  const name = String(displayName ?? '').trim()
  const expected = LOGIN_ROSTER_BY_STUDENT_ID[sid]
  return expected != null && expected === name
}

/** 仅允许 UUID 目录名，防止路径穿越 */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const VOTES_FILE = path.join(DATA_ROOT, 'votes.json')

await fs.mkdir(DATA_ROOT, { recursive: true })

const MAX_VOTES_PER_VOTER = 10

/**
 * 将磁盘上的投票表规范为「学号 → UUID 数组」；兼容旧版「学号 → 单个 UUID 字符串」。
 *
 * @param {unknown} raw
 * @returns {Record<string, string[]>}
 */
function normalizeVoteMapShape(raw) {
  /** @type {Record<string, string[]>} */
  const out = {}
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return out
  }
  for (const [k, v] of Object.entries(raw)) {
    const key = typeof k === 'string' ? k.trim() : ''
    if (!key) {
      continue
    }
    if (Array.isArray(v)) {
      const arr = [
        ...new Set(
          v
            .filter((x) => typeof x === 'string' && UUID_RE.test(x.trim()))
            .map((x) => x.trim()),
        ),
      ]
      if (arr.length > 0) {
        out[key] = arr
      }
    } else if (typeof v === 'string') {
      const s = v.trim()
      if (UUID_RE.test(s)) {
        out[key] = [s]
      }
    }
  }
  return out
}

/**
 * @returns {Promise<Record<string, string[]>>}
 */
async function readVoteMultiMap() {
  try {
    const raw = await fs.readFile(VOTES_FILE, 'utf8')
    const o = JSON.parse(raw)
    return normalizeVoteMapShape(o)
  } catch {
    return {}
  }
}

/**
 * @param {Record<string, string[]>} map
 */
async function writeVoteMultiMapAtomic(map) {
  const tmp = path.join(DATA_ROOT, `votes.${randomUUID()}.tmp.json`)
  await fs.writeFile(tmp, JSON.stringify(map, null, 0), 'utf8')
  await fs.rename(tmp, VOTES_FILE)
}

/**
 * @deprecated 使用 {@link readVoteMultiMap}
 */
async function readVoteMap() {
  return readVoteMultiMap()
}

/**
 * @deprecated 使用 {@link writeVoteMultiMapAtomic}
 */
async function writeVoteMapAtomic(map) {
  return writeVoteMultiMapAtomic(map)
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
 * @param {Record<string, string[]>} map
 * @param {Set<string>} validSubmissionIds
 * @returns {boolean} 是否写回磁盘
 */
function pruneVotesNotInList(map, validSubmissionIds) {
  let changed = false
  for (const [voter, arr] of Object.entries(map)) {
    if (!Array.isArray(arr)) {
      delete map[voter]
      changed = true
      continue
    }
    const next = arr.filter((sid) => validSubmissionIds.has(sid))
    if (next.length !== arr.length) {
      changed = true
    }
    if (next.length === 0) {
      delete map[voter]
    } else {
      map[voter] = next
    }
  }
  return changed
}

/**
 * @param {Record<string, string[]>} map
 * @returns {Map<string, number>}
 */
function tallyVotes(map) {
  const counts = new Map()
  for (const arr of Object.values(map)) {
    if (!Array.isArray(arr)) {
      continue
    }
    for (const sid of arr) {
      counts.set(sid, (counts.get(sid) ?? 0) + 1)
    }
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
  for (const [voter, arr] of Object.entries(map)) {
    if (!Array.isArray(arr)) {
      continue
    }
    const next = arr.filter((sid) => sid !== submissionId)
    if (next.length !== arr.length) {
      changed = true
    }
    if (next.length === 0) {
      delete map[voter]
    } else {
      map[voter] = next
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
app.set('trust proxy', 1)
app.use(cors())
app.use(express.json({ limit: '1mb' }))

/** @type {unknown} */
let feedbackTransporter = null
/** 若 `import('nodemailer')` 已失败，本进程内不再重试（部署修复后需重启服务）。 */
let feedbackNodemailerImportFailed = false

const FEEDBACK_DEFAULT_TO = '3978401510@qq.com'
const FEEDBACK_RATELIMIT_WINDOW_MS = 60 * 60 * 1000
const FEEDBACK_RATELIMIT_MAX = 8
/** @type {Map<string, { count: number; resetAt: number }>} */
const feedbackRateByIp = new Map()

/**
 * @param {string} ip
 * @returns {boolean}
 */
function feedbackRateAllow(ip) {
  const now = Date.now()
  let rec = feedbackRateByIp.get(ip)
  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + FEEDBACK_RATELIMIT_WINDOW_MS }
    feedbackRateByIp.set(ip, rec)
  }
  if (rec.count >= FEEDBACK_RATELIMIT_MAX) {
    return false
  }
  rec.count += 1
  return true
}

/**
 * 懒加载 nodemailer 并创建发信 transport；未配置密码、依赖缺失或加载失败时返回 `null`。
 * 使用动态 import，避免线上未执行 `npm install` 时整条 API 进程无法启动（列表、投票等仍可用）。
 *
 * @returns {Promise<unknown | null>}
 */
async function getFeedbackTransporter() {
  if (feedbackNodemailerImportFailed) {
    return null
  }
  const pass = String(process.env.VOTING_FEEDBACK_SMTP_PASS ?? '').trim()
  if (!pass) {
    return null
  }
  if (feedbackTransporter) {
    return feedbackTransporter
  }
  let nodemailer
  try {
    const mod = await import('nodemailer')
    nodemailer = mod.default
  } catch (e) {
    console.error('nodemailer import failed (run npm install in API directory)', e)
    feedbackNodemailerImportFailed = true
    return null
  }
  const toDefault = (process.env.VOTING_FEEDBACK_TO_EMAIL || FEEDBACK_DEFAULT_TO).trim()
  const user = String(
    process.env.VOTING_FEEDBACK_SMTP_USER?.trim() || toDefault,
  ).trim()
  const host = String(process.env.VOTING_FEEDBACK_SMTP_HOST ?? 'smtp.qq.com').trim()
  const port = Number(process.env.VOTING_FEEDBACK_SMTP_PORT || 465)
  const secureRaw = process.env.VOTING_FEEDBACK_SMTP_SECURE
  const secure =
    secureRaw === undefined || secureRaw === '' || secureRaw === '1' || secureRaw === 'true'
  feedbackTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
  return feedbackTransporter
}

/**
 * @param {import('express').Request} req
 * @returns {string}
 */
function clientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] ?? '')
  const first = xf.split(',')[0].trim()
  if (first) {
    return first
  }
  return String(req.socket.remoteAddress ?? 'unknown')
}

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.post('/feedback', async (req, res) => {
  try {
    const ip = clientIp(req)
    const userStudentId = String(req.body?.userStudentId ?? '').trim()
    const userDisplayName = String(req.body?.userDisplayName ?? '').trim()
    const message = String(req.body?.message ?? '').trim()
    const contact = String(req.body?.contact ?? '').trim()
    if (!userStudentId || !userDisplayName) {
      return res.status(400).json({ error: 'missing_identity' })
    }
    if (!isAllowedLoginPair(userStudentId, userDisplayName)) {
      return res.status(403).json({ error: 'voter_not_allowed' })
    }
    if (message.length < 10 || message.length > 4000) {
      return res.status(400).json({ error: 'invalid_message' })
    }
    if (contact.length > 200) {
      return res.status(400).json({ error: 'contact_too_long' })
    }
    if (!feedbackRateAllow(ip)) {
      return res.status(429).json({ error: 'feedback_rate_limited' })
    }
    const transport = await getFeedbackTransporter()
    if (!transport) {
      return res.status(503).json({
        error: feedbackNodemailerImportFailed
          ? 'feedback_nodemailer_missing'
          : 'feedback_smtp_not_configured',
      })
    }
    const to = (process.env.VOTING_FEEDBACK_TO_EMAIL || FEEDBACK_DEFAULT_TO).trim()
    const fromAddr = String(
      process.env.VOTING_FEEDBACK_SMTP_USER?.trim() || to,
    ).trim()
    const subject = `[投票小程序] 反馈 — ${userDisplayName}（学号 ${userStudentId}）`
    const text = [
      `提交者：${userDisplayName}（学号 ${userStudentId}）`,
      contact ? `其它联系方式：${contact}` : '其它联系方式：（未填）',
      '',
      '--- 留言 ---',
      message,
      '',
      `客户端 IP：${ip}`,
    ].join('\n')
    await transport.sendMail({
      from: `"投票小程序" <${fromAddr}>`,
      to,
      replyTo: fromAddr,
      subject,
      text,
    })
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'feedback_send_failed' })
  }
})

app.get('/votes/by-voter', async (req, res) => {
  try {
    const voterStudentId = String(req.query.voterStudentId ?? '').trim()
    const voterDisplayName = String(req.query.voterDisplayName ?? '').trim()
    if (!voterStudentId) {
      return res.status(400).json({ error: 'missing_voter' })
    }
    if (!voterDisplayName) {
      return res.status(400).json({ error: 'missing_voter_display_name' })
    }
    if (!isAllowedLoginPair(voterStudentId, voterDisplayName)) {
      return res.status(403).json({ error: 'voter_not_allowed' })
    }
    const map = await readVoteMap()
    let list = map[voterStudentId] ?? []
    if (!Array.isArray(list)) {
      list = []
    }
    const next = []
    for (const sid of list) {
      if (await submissionMetaExists(sid)) {
        next.push(sid)
      }
    }
    if (next.length !== list.length) {
      if (next.length === 0) {
        delete map[voterStudentId]
      } else {
        map[voterStudentId] = next
      }
      await writeVoteMapAtomic(map)
    }
    return res.json({ votedSubmissionIds: next })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'vote_read_failed' })
  }
})

app.put('/votes', async (req, res) => {
  try {
    const voterStudentId = String(req.body?.voterStudentId ?? '').trim()
    const voterDisplayName = String(req.body?.voterDisplayName ?? '').trim()
    const votedSubmissionId = String(req.body?.votedSubmissionId ?? '').trim()
    if (!voterStudentId || !votedSubmissionId) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (!voterDisplayName) {
      return res.status(400).json({ error: 'missing_voter_display_name' })
    }
    if (!isAllowedLoginPair(voterStudentId, voterDisplayName)) {
      return res.status(403).json({ error: 'voter_not_allowed' })
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
    const map = await readVoteMap()
    const cur = Array.isArray(map[voterStudentId])
      ? [...map[voterStudentId]]
      : []
    if (cur.includes(votedSubmissionId)) {
      return res.status(204).send()
    }
    if (cur.length >= MAX_VOTES_PER_VOTER) {
      return res.status(403).json({ error: 'vote_limit_exceeded' })
    }
    cur.push(votedSubmissionId)
    map[voterStudentId] = cur
    await writeVoteMapAtomic(map)
    return res.status(204).send()
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'vote_write_failed' })
  }
})

app.delete('/votes', async (req, res) => {
  try {
    const voterStudentId = String(req.body?.voterStudentId ?? '').trim()
    const voterDisplayName = String(req.body?.voterDisplayName ?? '').trim()
    const votedSubmissionId = String(req.body?.votedSubmissionId ?? '').trim()
    if (!voterStudentId || !votedSubmissionId) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (!voterDisplayName) {
      return res.status(400).json({ error: 'missing_voter_display_name' })
    }
    if (!isAllowedLoginPair(voterStudentId, voterDisplayName)) {
      return res.status(403).json({ error: 'voter_not_allowed' })
    }
    if (!UUID_RE.test(votedSubmissionId)) {
      return res.status(400).json({ error: 'invalid_submission_id' })
    }
    const map = await readVoteMap()
    const cur = Array.isArray(map[voterStudentId]) ? [...map[voterStudentId]] : []
    const idx = cur.indexOf(votedSubmissionId)
    if (idx === -1) {
      return res.status(404).json({ error: 'vote_not_found' })
    }
    cur.splice(idx, 1)
    if (cur.length === 0) {
      delete map[voterStudentId]
    } else {
      map[voterStudentId] = cur
    }
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

/**
 * 无媒体登记：仅写入 `meta.json`（投票用，可不传图片/视频）。
 */
app.post('/submissions/text', async (req, res) => {
  try {
    const operatorDisplayName = String(
      req.body?.operatorDisplayName ?? req.body?.uploaderDisplayName ?? '',
    ).trim()
    const operatorStudentId = String(
      req.body?.operatorStudentId ?? req.body?.uploaderStudentId ?? '',
    ).trim()
    let displayTitle = String(req.body?.displayTitle ?? '').trim()
    let authorDisplayName = String(req.body?.authorDisplayName ?? '').trim()
    if (!operatorDisplayName || !operatorStudentId) {
      return res.status(400).json({ error: 'missing_fields' })
    }
    if (!isAdminUploader(operatorDisplayName, operatorStudentId)) {
      return res.status(403).json({ error: 'upload_forbidden' })
    }
    if (!displayTitle && !authorDisplayName) {
      displayTitle = '未命名作品'
      authorDisplayName = '未署名'
    } else if (!displayTitle) {
      /** 仅填作者名时作品名留空，由前端在无媒体条目上展示为「/」 */
      displayTitle = ''
    } else if (!authorDisplayName) {
      authorDisplayName = displayTitle
    }
    if (displayTitle.length > MAX_DISPLAY_TITLE_LEN) {
      return res.status(400).json({ error: 'display_title_too_long' })
    }
    if (authorDisplayName.length > MAX_AUTHOR_DISPLAY_LEN) {
      return res.status(400).json({ error: 'author_display_too_long' })
    }
    const id = randomUUID()
    const dir = path.join(DATA_ROOT, id)
    await fs.mkdir(dir, { recursive: true })
    const meta = {
      submissionId: id,
      createdAt: new Date().toISOString(),
      uploaderDisplayName: authorDisplayName,
      uploaderStudentId: operatorStudentId,
      authorDisplayName,
      displayTitle,
      mimeType: 'application/x-no-media',
      originalFileName: '(无媒体)',
      byteSize: 0,
      mediaKind: 'image',
      hasMedia: false,
    }
    await fs.writeFile(
      path.join(dir, 'meta.json'),
      JSON.stringify(meta),
      'utf8',
    )
    return res.json({ ok: true, submissionId: id })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'save_failed' })
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
      hasMedia: true,
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
    const storageFile = meta.storageFile
    if (
      meta.hasMedia === false ||
      Number(meta.byteSize) === 0 ||
      storageFile == null ||
      typeof storageFile !== 'string' ||
      storageFile.trim() === ''
    ) {
      return res.status(404).end()
    }
    const filePath = path.join(base, storageFile)
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
