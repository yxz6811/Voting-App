import type { ClassSubmissionRecord } from '../types/classSubmission'

/** 作品展示名最大长度（与 OpenSpec / 服务端一致） */
export const SUBMISSION_DISPLAY_TITLE_MAX_LEN = 80

/**
 * 校验用户填写的作品展示名（trim 后非空、长度上限）。
 *
 * @param raw 用户输入原文
 */
export function validateSubmissionDisplayTitle(
  raw: string,
):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  const value = raw.trim()
  if (value.length === 0) {
    return { ok: false, message: '请填写作品名。' }
  }
  if (value.length > SUBMISSION_DISPLAY_TITLE_MAX_LEN) {
    return {
      ok: false,
      message: `作品名不能超过 ${SUBMISSION_DISPLAY_TITLE_MAX_LEN} 个字。`,
    }
  }
  return { ok: true, value }
}

/**
 * 列表/弹窗中用于展示的作品标题：优先 `displayTitle`，否则回退为原始文件名。
 *
 * @param row 班级作品记录
 */
export function submissionDisplayLabel(row: ClassSubmissionRecord): string {
  const t = row.displayTitle?.trim()
  if (t != null && t.length > 0) {
    return t
  }
  return row.originalFileName
}
