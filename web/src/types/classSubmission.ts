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
  /** 列表/排行榜展示的作者名（管理员上传时与 `authorDisplayName` 一致，为表单所填） */
  uploaderDisplayName: string
  /**
   * 管理员上传时填写的作者展示名；有值时 {@link submissionAuthorDisplayName} 优先用此字段。
   * 新提交与 `uploaderDisplayName` 通常相同。
   */
  authorDisplayName?: string
  /** 实际上传操作者学号快照（管理员上传时为管理员学号） */
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
  /** 同源媒体地址（服务端列表）；无媒体登记时为 `undefined` */
  mediaUrl?: string
  /** 服务端 `meta.hasMedia === false` 时表示仅有文字登记、无可预览文件 */
  hasMedia?: boolean
  /** 服务端聚合后的得票数（非负整数） */
  voteCount: number
}
