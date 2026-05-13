import type { ClassSubmissionRecord } from '../types/classSubmission'
import type { CurrentUser } from '../types/currentUser'
import { getSubmissionsApiBase } from './submissionsApiBase'

interface SubmissionMetaJson {
  submissionId: string
  createdAt: string
  uploaderDisplayName: string
  uploaderStudentId: string
  mimeType: string
  originalFileName: string
  byteSize: number
  mediaKind: 'image' | 'video'
  displayTitle?: string
  authorDisplayName?: string
  voteCount?: number
}

/**
 * 从服务端拉取全班作品列表（按 `createdAt` 降序）。
 *
 * @throws 网络或 HTTP 错误时抛出，由调用方展示错误
 */
export async function listSubmissionsDesc(): Promise<ClassSubmissionRecord[]> {
  const base = getSubmissionsApiBase()
  const res = await fetch(`${base}/submissions`, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`list_failed:${res.status}`)
  }
  const data = (await res.json()) as SubmissionMetaJson[]
  return data.map((m) => ({
    submissionId: m.submissionId,
    createdAt: m.createdAt,
    uploaderDisplayName: m.uploaderDisplayName,
    uploaderStudentId: m.uploaderStudentId,
    mimeType: m.mimeType,
    originalFileName: m.originalFileName,
    displayTitle:
      typeof m.displayTitle === 'string' && m.displayTitle.trim() !== ''
        ? m.displayTitle.trim()
        : undefined,
    authorDisplayName:
      typeof m.authorDisplayName === 'string' && m.authorDisplayName.trim() !== ''
        ? m.authorDisplayName.trim()
        : undefined,
    byteSize: m.byteSize,
    mediaKind: m.mediaKind,
    mediaUrl: `${base}/submissions/${m.submissionId}/media`,
    voteCount:
      typeof m.voteCount === 'number' && Number.isFinite(m.voteCount) && m.voteCount >= 0
        ? Math.floor(m.voteCount)
        : 0,
  }))
}

/**
 * 读取服务端当前学号已投的作品 ID 列表（去重、有序无关）。
 *
 * @param voterStudentId 投票者学号
 * @throws {Error} HTTP 非 2xx 或网络失败
 */
export async function fetchServerVotesForVoter(
  voterStudentId: string,
): Promise<string[]> {
  const base = getSubmissionsApiBase()
  const url = `${base}/votes/by-voter?voterStudentId=${encodeURIComponent(voterStudentId)}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`vote_read_failed:${res.status}`)
  }
  const data = (await res.json()) as {
    votedSubmissionIds?: unknown
    votedSubmissionId?: string | null
  }
  if (Array.isArray(data.votedSubmissionIds)) {
    const ids = data.votedSubmissionIds.filter(
      (x): x is string => typeof x === 'string' && x.trim() !== '',
    )
    return [...new Set(ids)]
  }
  const sid = data.votedSubmissionId
  if (typeof sid === 'string' && sid.trim() !== '') {
    return [sid.trim()]
  }
  return []
}

/**
 * 向服务端追加一票（同一作品不重复计数；满 10 票时服务端拒绝）。
 *
 * @param voterStudentId 投票者学号
 * @param votedSubmissionId 被投作品 ID
 * @throws {Error} 校验失败、网络错误等，见 `message`
 */
export async function castServerVote(
  voterStudentId: string,
  votedSubmissionId: string,
): Promise<void> {
  const base = getSubmissionsApiBase()
  let res: Response
  try {
    res = await fetch(`${base}/votes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterStudentId, votedSubmissionId }),
    })
  } catch (e) {
    const err = new Error('网络异常，无法提交投票。')
    ;(err as Error & { cause?: unknown }).cause = e
    throw err
  }
  if (res.ok) {
    return
  }
  let errorCode = `http_${res.status}`
  try {
    const body: unknown = await res.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      errorCode = (body as { error: string }).error
    }
  } catch {
    /* ignore */
  }
  const err = new Error(mapCastVoteMessage(res.status, errorCode))
  ;(err as Error & { errorCode?: string }).errorCode = errorCode
  throw err
}

/**
 * @param status HTTP 状态码
 * @param errorCode 服务端 `error` 字段
 */
function mapCastVoteMessage(status: number, errorCode: string): string {
  if (errorCode === 'cannot_vote_own') {
    return '不能给自己的作品投票。'
  }
  if (errorCode === 'vote_limit_exceeded') {
    return '你已经投过十票了！'
  }
  if (errorCode === 'submission_not_found') {
    return '该作品已不存在，无法投票。'
  }
  if (errorCode === 'missing_fields' || errorCode === 'invalid_submission_id') {
    return '投票数据无效，请刷新页面后重试。'
  }
  if (status >= 500) {
    return '服务器繁忙，投票未保存，请稍后重试。'
  }
  return '投票失败，请稍后重试。'
}

/**
 * 取消对某一作品的投票（服务端从该用户的已投列表中移除）。
 *
 * @param voterStudentId 投票者学号
 * @param votedSubmissionId 要取消的作品 ID
 * @throws {Error} 非 2xx 或网络失败
 */
export async function withdrawServerVote(
  voterStudentId: string,
  votedSubmissionId: string,
): Promise<void> {
  const base = getSubmissionsApiBase()
  let res: Response
  try {
    res = await fetch(`${base}/votes`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voterStudentId, votedSubmissionId }),
    })
  } catch (e) {
    const err = new Error('网络异常，无法取消投票。')
    ;(err as Error & { cause?: unknown }).cause = e
    throw err
  }
  if (res.ok) {
    return
  }
  let errorCode = `http_${res.status}`
  try {
    const body: unknown = await res.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      errorCode = (body as { error: string }).error
    }
  } catch {
    /* ignore */
  }
  const err = new Error(mapWithdrawVoteMessage(res.status, errorCode))
  ;(err as Error & { errorCode?: string }).errorCode = errorCode
  throw err
}

/**
 * @param status HTTP 状态码
 * @param errorCode 服务端 `error` 字段
 */
function mapWithdrawVoteMessage(status: number, errorCode: string): string {
  if (errorCode === 'vote_not_found') {
    return '当前未投票给该作品，无需取消。'
  }
  if (errorCode === 'missing_fields' || errorCode === 'invalid_submission_id') {
    return '取消投票请求无效，请刷新页面后重试。'
  }
  if (status >= 500) {
    return '服务器繁忙，请稍后重试。'
  }
  return '取消投票失败，请稍后重试。'
}

/**
 * 删除服务端一条班级作品（仅管理员可删任意条目；请求体须携带操作者姓名与学号）。
 *
 * @param submissionId 作品 `submissionId`（UUID）
 * @param actor 当前登录用户，须为管理员账号
 * @throws {Error} 非 2xx 或网络失败时抛出；HTTP 错误对象可附带 `status`、`errorCode` 字符串字段
 */
export async function deleteClassSubmission(
  submissionId: string,
  actor: CurrentUser,
): Promise<void> {
  const base = getSubmissionsApiBase()
  let res: Response
  try {
    res = await fetch(`${base}/submissions/${encodeURIComponent(submissionId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorDisplayName: actor.displayName,
        operatorStudentId: actor.studentId,
      }),
    })
  } catch (e) {
    const err = new Error('网络异常，无法连接服务器。')
    ;(err as Error & { cause?: unknown }).cause = e
    throw err
  }
  if (res.ok) {
    return
  }
  let errorCode = `http_${res.status}`
  try {
    const body: unknown = await res.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: unknown }).error === 'string'
    ) {
      errorCode = (body as { error: string }).error
    }
  } catch {
    /* ignore */
  }
  const err = new Error(mapDeleteSubmissionMessage(res.status, errorCode))
  ;(err as Error & { status?: string; errorCode?: string }).status = String(res.status)
  ;(err as Error & { errorCode?: string }).errorCode = errorCode
  throw err
}

/**
 * @param status HTTP 状态码
 * @param errorCode 服务端 `error` 字段或回退码
 */
function mapDeleteSubmissionMessage(status: number, errorCode: string): string {
  if (errorCode === 'forbidden_not_admin') {
    return '无权删除该作品（仅管理员可删）。'
  }
  if (errorCode === 'forbidden_not_owner') {
    return '无权删除该作品（仅作者本人可删）。'
  }
  if (errorCode === 'not_found') {
    return '该作品不存在或已被删除。'
  }
  if (
    errorCode === 'missing_operator' ||
    errorCode === 'missing_uploader_student_id' ||
    errorCode === 'invalid_id'
  ) {
    return '删除请求无效，请重新登录后重试。'
  }
  if (status >= 500) {
    return '服务器删除失败，请稍后重试。'
  }
  return '删除失败，请稍后重试。'
}
