import type { SubmissionMediaKind } from '../types/classSubmission'

/** 单文件大小上限：160 MiB（与 spec 一致） */
export const MAX_SUBMISSION_BYTES = 160 * 1024 * 1024

const ALLOWED_IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm'])

const EXT_TO_MIME = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.gif', 'image/gif'],
  ['.mp4', 'video/mp4'],
  ['.webm', 'video/webm'],
])

/**
 * 从文件名解析扩展名（含点、小写），无扩展名时返回空串。
 *
 * @param fileName 文件名
 */
function fileExtensionLower(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot === -1) {
    return ''
  }
  return fileName.slice(dot).toLowerCase()
}

/**
 * 根据 MIME 判断媒体种类。
 *
 * @param mime 小写 MIME
 */
function kindFromMime(mime: string): SubmissionMediaKind | null {
  if (ALLOWED_IMAGE_MIMES.has(mime)) {
    return 'image'
  }
  if (ALLOWED_VIDEO_MIMES.has(mime)) {
    return 'video'
  }
  return null
}

export type ClassifyFileResult =
  | { ok: true; mediaKind: SubmissionMediaKind; effectiveMime: string }
  | { ok: false; message: string }

/**
 * 校验文件大小、MIME 或扩展名白名单，返回归一化 MIME 与媒体种类。
 *
 * @param file 用户选择的文件
 */
export function classifySubmissionFile(file: File): ClassifyFileResult {
  if (file.size > MAX_SUBMISSION_BYTES) {
    return {
      ok: false,
      message: '文件不能超过 160 MB',
    }
  }

  const rawType = file.type.trim().toLowerCase()
  if (rawType !== '') {
    const kind = kindFromMime(rawType)
    if (kind == null) {
      return {
        ok: false,
        message: '仅支持图片（JPEG/PNG/WebP/GIF）或视频（MP4/WebM）',
      }
    }
    return { ok: true, mediaKind: kind, effectiveMime: rawType }
  }

  const ext = fileExtensionLower(file.name)
  const inferred = EXT_TO_MIME.get(ext)
  if (inferred == null) {
    return {
      ok: false,
      message: '无法识别文件类型，请使用 jpg/png/webp/gif/mp4/webm',
    }
  }
  const kind = kindFromMime(inferred)
  if (kind == null) {
    return { ok: false, message: '不支持的文件类型' }
  }
  return { ok: true, mediaKind: kind, effectiveMime: inferred }
}
