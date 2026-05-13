/**
 * 媒体大类：与 OpenSpec 中 image / video 一致。
 */
export type SubmissionMediaKind = 'image' | 'video'

/**
 * 持久化在 IndexedDB 中的一条班级作品提交（含二进制）。
 */
export interface ClassSubmissionRecord {
  /** 唯一提交 ID */
  submissionId: string
  /** ISO-8601 创建时间，用于排序 */
  createdAt: string
  /** 提交时的展示姓名快照 */
  uploaderDisplayName: string
  /** 提交时的学号快照 */
  uploaderStudentId: string
  /** 归一化后的 MIME（`File.type` 或扩展名推断） */
  mimeType: string
  /** 原始文件名 */
  originalFileName: string
  /** 字节大小 */
  byteSize: number
  /** 图片或视频 */
  mediaKind: SubmissionMediaKind
  /** 作品二进制 */
  blob: Blob
}
