import { useEffect, useState } from 'react'
import type { ClassSubmissionRecord } from '../types/classSubmission'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { submissionAuthorDisplayName } from '../lib/submissionAuthorDisplay'

interface SubmissionPreviewPageProps {
  /** 要预览的作品 */
  row: ClassSubmissionRecord
  /** 返回列表 */
  onBack: () => void
}

/**
 * 作品独立预览页：大图 / 视频与返回入口，风格与班级区一致。
 */
export function SubmissionPreviewPage({ row, onBack }: SubmissionPreviewPageProps) {
  const [mediaUrl, setMediaUrl] = useState<string>('')
  const [mediaFailed, setMediaFailed] = useState(false)
  const titleShown = submissionDisplayLabel(row)
  const authorShown = submissionAuthorDisplayName(row)

  useEffect(() => {
    setMediaFailed(false)
    if (row.blob != null) {
      const u = URL.createObjectURL(row.blob)
      setMediaUrl(u)
      return () => {
        URL.revokeObjectURL(u)
      }
    }
    setMediaUrl(row.mediaUrl ?? '')
    return undefined
  }, [row])

  return (
    <div className="submission-preview-page">
      <div className="submission-preview-page-toolbar classroom-pane">
        <button
          type="button"
          className="ux-action-btn ux-action-btn--ghost"
          onClick={onBack}
        >
          ← 返回
        </button>
        <div className="submission-preview-page-heading">
          <h2 className="submission-preview-page-title">{titleShown}</h2>
          <p className="submission-preview-page-sub">{authorShown}</p>
        </div>
      </div>
      <div className="submission-preview-page-card classroom-pane">
        {mediaUrl === '' ? (
          <p className="panel-empty">暂无可用预览地址。</p>
        ) : mediaFailed ? (
          <div className="submission-preview-error" role="alert">
            {row.mediaKind === 'video'
              ? '无法播放此视频，可尝试使用 H.264 + AAC 编码的 MP4。'
              : '无法显示此图片，文件可能已损坏。'}
          </div>
        ) : row.mediaKind === 'image' ? (
          <img
            className="submission-preview-page-media"
            src={mediaUrl}
            alt={titleShown}
            onError={() => setMediaFailed(true)}
          />
        ) : (
          <video
            className="submission-preview-page-media"
            src={mediaUrl}
            controls
            playsInline
            onError={() => setMediaFailed(true)}
          >
            您的浏览器不支持视频播放。
          </video>
        )}
        <div className="submission-preview-page-footer">
          <button
            type="button"
            className="ux-action-btn ux-action-btn--primary"
            onClick={onBack}
          >
            返回列表
          </button>
        </div>
      </div>
    </div>
  )
}
