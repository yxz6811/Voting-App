/**
 * 媒体大类：与 OpenSpec 中 image / video 一致。
 */
export type SubmissionMediaKind = 'image' | 'video'

/**
 * 一条班级作品：元数据 + 媒体来源（服务端 URL 或本地 Blob，二选一）。
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
  /** 用户填写的作品展示名（新提交必有；旧数据可无） */
  displayTitle?: string
  /** 字节大小 */
  byteSize: number
  /** 图片或视频 */
  mediaKind: SubmissionMediaKind
  /** 本地 Blob（仅旧版 IndexedDB；当前以服务端为主） */
  blob?: Blob
  /** 同源媒体地址（服务端列表） */
  mediaUrl?: string
  /** 服务端聚合后的得票数（非负整数） */
  voteCount: number
}
