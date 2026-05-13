import { getSubmissionsApiBase } from './submissionsApiBase'

export interface SubmitFeedbackPayload {
  userStudentId: string
  userDisplayName: string
  message: string
  contact: string
}

/**
 * 提交反馈留言，由服务端发邮件至管理员邮箱。
 *
 * @param payload 当前用户身份与留言内容
 * @throws {Error} 网络或业务错误（`message` 为可读文案）
 */
export async function submitFeedback(payload: SubmitFeedbackPayload): Promise<void> {
  const base = getSubmissionsApiBase()
  let res: Response
  try {
    res = await fetch(`${base}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch (e) {
    const err = new Error('网络异常，无法提交反馈。')
    ;(err as Error & { cause?: unknown }).cause = e
    throw err
  }
  if (res.status === 204) {
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
  const err = new Error(mapFeedbackErrorMessage(res.status, errorCode))
  ;(err as Error & { errorCode?: string }).errorCode = errorCode
  throw err
}

/**
 * @param status HTTP 状态码
 * @param errorCode 服务端 `error` 字段
 */
function mapFeedbackErrorMessage(status: number, errorCode: string): string {
  if (errorCode === 'feedback_smtp_not_configured') {
    return '反馈功能尚未在服务器上配置发信，请联系管理员。'
  }
  if (errorCode === 'feedback_rate_limited') {
    return '提交过于频繁，请稍后再试。'
  }
  if (errorCode === 'voter_not_allowed') {
    return '当前登录信息无效，请重新登录后再试。'
  }
  if (errorCode === 'invalid_message') {
    return '留言长度须在 10～4000 字之间。'
  }
  if (errorCode === 'contact_too_long') {
    return '联系方式过长，请缩短至 200 字以内。'
  }
  if (errorCode === 'missing_identity') {
    return '缺少登录信息，请重新登录后再试。'
  }
  if (errorCode === 'feedback_send_failed') {
    return '邮件发送失败，请稍后重试或联系管理员。'
  }
  if (status >= 500) {
    return '服务器繁忙，请稍后重试。'
  }
  return '提交失败，请稍后重试。'
}
