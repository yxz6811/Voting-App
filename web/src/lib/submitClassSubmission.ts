import type { CurrentUser } from '../types/currentUser'
import { classifySubmissionFile } from './mediaValidation'
import { getSubmissionsApiBase } from './submissionsApiBase'
import { validateSubmissionDisplayTitle } from './submissionDisplayTitle'
import { validateAuthorDisplayName } from './submissionAuthorDisplay'

export type SubmitClassSubmissionResult =
  | { ok: true }
  | { ok: false; message: string }

function mapUploadError(status: number, body: string): string {
  try {
    const j = JSON.parse(body) as { error?: string }
    if (j.error === 'file_too_large') {
      return '文件过大，服务器拒绝保存。'
    }
    if (j.error === 'missing_file' || j.error === 'missing_fields') {
      return '提交数据不完整，请重试。'
    }
    if (j.error === 'display_title_too_long') {
      return '作品名超出长度限制，请缩短后重试。'
    }
    if (j.error === 'upload_forbidden') {
      return '当前账号无权上传作品（仅管理员可传）。'
    }
    if (j.error === 'missing_author') {
      return '请填写作者名后再上传。'
    }
    if (j.error === 'author_display_too_long') {
      return '作者名超出长度限制，请缩短后重试。'
    }
  } catch {
    /* ignore */
  }
  if (status === 413) {
    return '文件过大，服务器拒绝保存。'
  }
  return '作品保存失败，请稍后重试。'
}

/**
 * 将本地文件上传到班级作品服务器（全班共享列表）。
 *
 * @param user 当前用户；未登录时固定失败
 * @param file 用户选择的文件
 * @param displayTitleRaw 作品展示名（用户输入，会 trim 并校验）
 * @param authorDisplayNameRaw 管理员填写的作者展示名（排行榜与列表优先使用）
 */
export async function submitClassSubmission(
  user: CurrentUser | null,
  file: File,
  displayTitleRaw: string,
  authorDisplayNameRaw: string,
): Promise<SubmitClassSubmissionResult> {
  if (user == null) {
    return { ok: false, message: '请先登录后再上传作品' }
  }

  const titleRes = validateSubmissionDisplayTitle(displayTitleRaw)
  if (!titleRes.ok) {
    return { ok: false, message: titleRes.message }
  }

  const authorRes = validateAuthorDisplayName(authorDisplayNameRaw)
  if (!authorRes.ok) {
    return { ok: false, message: authorRes.message }
  }

  const classified = classifySubmissionFile(file)
  if (!classified.ok) {
    return { ok: false, message: classified.message }
  }

  const base = getSubmissionsApiBase()
  const fd = new FormData()
  fd.append('file', file)
  fd.append('operatorDisplayName', user.displayName)
  fd.append('operatorStudentId', user.studentId)
  fd.append('mediaKind', classified.mediaKind)
  fd.append('displayTitle', titleRes.value)
  fd.append('authorDisplayName', authorRes.value)

  try {
    const res = await fetch(`${base}/submissions`, {
      method: 'POST',
      body: fd,
    })
    const text = await res.text()
    if (!res.ok) {
      return { ok: false, message: mapUploadError(res.status, text) }
    }
    return { ok: true }
  } catch {
    return {
      ok: false,
      message: '无法连接作品服务器，请检查网络或稍后再试。',
    }
  }
}
