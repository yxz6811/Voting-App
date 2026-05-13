import { useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../auth'
import { submitClassSubmission } from '../lib/submitClassSubmission'
import { SUBMISSION_DISPLAY_TITLE_MAX_LEN } from '../lib/submissionDisplayTitle'
import {
  SUBMISSION_AUTHOR_DISPLAY_MAX_LEN,
} from '../lib/submissionAuthorDisplay'

const FILE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm'

interface UploadWorkPanelProps {
  /** 提交成功后的回调（用于刷新列表） */
  onSubmitted: () => void
}

/**
 * 管理员上传作品：填写作品名、作者名，选择文件后提交到班级作品服务器。
 */
export function UploadWorkPanel({ onSubmitted }: UploadWorkPanelProps) {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [displayTitle, setDisplayTitle] = useState('')
  const [authorDisplayName, setAuthorDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const canUpload = user != null

  async function handleFileChange(ev: ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (file == null) {
      return
    }
    if (!canUpload) {
      setError('请先登录后再上传作品')
      return
    }
    setError(null)
    setBusy(true)
    const result = await submitClassSubmission(
      user,
      file,
      displayTitle,
      authorDisplayName,
    )
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    setDisplayTitle('')
    setAuthorDisplayName('')
    onSubmitted()
  }

  return (
    <div className="upload-panel">
      <p className="upload-hint">
        支持 JPEG / PNG / WebP / GIF 图片，或 MP4 / WebM 视频；单个文件不超过 160 MB。
      </p>
      <div className="auth-field upload-title-field">
        <label htmlFor="submission-display-title">作品名</label>
        <input
          id="submission-display-title"
          type="text"
          maxLength={SUBMISSION_DISPLAY_TITLE_MAX_LEN}
          autoComplete="off"
          placeholder="在班级列表中展示的名称"
          value={displayTitle}
          disabled={!canUpload || busy}
          onChange={(e) => setDisplayTitle(e.target.value)}
        />
      </div>
      <p className="panel-note">
        作品名最多 {SUBMISSION_DISPLAY_TITLE_MAX_LEN} 字；将显示在列表中「图片 / 视频 · …」的位置，避免文件名乱码。
      </p>
      <div className="auth-field upload-title-field">
        <label htmlFor="submission-author-display-name">作者名</label>
        <input
          id="submission-author-display-name"
          type="text"
          maxLength={SUBMISSION_AUTHOR_DISPLAY_MAX_LEN}
          autoComplete="off"
          placeholder="排行榜与列表中展示的作者名"
          value={authorDisplayName}
          disabled={!canUpload || busy}
          onChange={(e) => setAuthorDisplayName(e.target.value)}
        />
      </div>
      <p className="panel-note">
        作者名最多 {SUBMISSION_AUTHOR_DISPLAY_MAX_LEN}
        字；列表与排行榜中的作者均以此为准；学号在后台记录为管理员账号，仅管理员可删除作品。
      </p>
      <input
        ref={inputRef}
        type="file"
        className="upload-input-hidden"
        accept={FILE_ACCEPT}
        disabled={!canUpload || busy}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="auth-submit"
        disabled={!canUpload || busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? '正在保存…' : '选择文件并上传'}
      </button>
      {!canUpload ? (
        <p className="panel-note" role="status">
          未登录，无法上传作品。
        </p>
      ) : null}
      {error != null ? (
        <div className="panel-error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  )
}
