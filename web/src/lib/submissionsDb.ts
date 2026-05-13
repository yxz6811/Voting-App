import type { ClassSubmissionRecord } from '../types/classSubmission'
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
    byteSize: m.byteSize,
    mediaKind: m.mediaKind,
    mediaUrl: `${base}/submissions/${m.submissionId}/media`,
  }))
}
