import type { ClassSubmissionRecord } from '../types/classSubmission'

/** 管理员填写的「作者名」最大长度（与 `api/server.mjs` 一致） */
export const SUBMISSION_AUTHOR_DISPLAY_MAX_LEN = 40

/**
 * 校验管理员填写的作品作者展示名（trim 后非空、长度上限）。
 *
 * @param raw 用户输入原文
 */
export function validateAuthorDisplayName(
  raw: string,
):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  const value = raw.trim()
  if (value.length === 0) {
    return { ok: false, message: '请填写作者名（将用于排行榜与列表展示）。' }
  }
  if (value.length > SUBMISSION_AUTHOR_DISPLAY_MAX_LEN) {
    return {
      ok: false,
      message: `作者名不能超过 ${SUBMISSION_AUTHOR_DISPLAY_MAX_LEN} 个字。`,
    }
  }
  return { ok: true, value }
}

/**
 * 列表 / 排行榜中展示的作者名：优先管理员填写的 `authorDisplayName`，否则回退为上传者快照姓名。
 *
 * @param row 班级作品记录
 */
export function submissionAuthorDisplayName(row: ClassSubmissionRecord): string {
  const a = row.authorDisplayName?.trim()
  if (a != null && a.length > 0) {
    return a
  }
  return row.uploaderDisplayName
}
