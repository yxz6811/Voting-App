import type { CurrentUser } from '../types/currentUser'
import type { ClassSubmissionRecord } from '../types/classSubmission'
import { classifySubmissionFile } from './mediaValidation'
import { addSubmission } from './submissionsDb'

export type SubmitClassSubmissionResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * 将本地文件保存为一条班级作品提交（需已登录）。
 *
 * @param user 当前用户；未登录时固定失败
 * @param file 用户选择的文件
 */
export async function submitClassSubmission(
  user: CurrentUser | null,
  file: File,
): Promise<SubmitClassSubmissionResult> {
  if (user == null) {
    return { ok: false, message: '请先登录后再上传作品' }
  }

  const classified = classifySubmissionFile(file)
  if (!classified.ok) {
    return { ok: false, message: classified.message }
  }

  const row: ClassSubmissionRecord = {
    submissionId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    uploaderDisplayName: user.displayName,
    uploaderStudentId: user.studentId,
    mimeType: classified.effectiveMime,
    originalFileName: file.name,
    byteSize: file.size,
    mediaKind: classified.mediaKind,
    blob: file,
  }

  try {
    await addSubmission(row)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      return {
        ok: false,
        message:
          '浏览器存储空间不足，请删除部分作品或清理站点数据后重试。',
      }
    }
    return {
      ok: false,
      message: '作品保存失败，请稍后重试。',
    }
  }

  return { ok: true }
}
