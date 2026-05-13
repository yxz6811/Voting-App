import { useRef, useState, type ChangeEvent } from 'react'
import { useAuth } from '../auth'
import { submitClassSubmission } from '../lib/submitClassSubmission'

const FILE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,.jpg,.jpeg,.png,.webp,.gif,.mp4,.webm'

interface UploadWorkPanelProps {
  /** 提交成功后的回调（用于刷新列表） */
  onSubmitted: () => void
}

/**
 * 上传作品：选择文件、校验后提交到班级作品服务器。
 */
export function UploadWorkPanel({ onSubmitted }: UploadWorkPanelProps) {
  const { user } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
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
    const result = await submitClassSubmission(user, file)
    setBusy(false)
    if (!result.ok) {
      setError(result.message)
      return
    }
    onSubmitted()
  }

  return (
    <div className="upload-panel">
      <p className="upload-hint">
        支持 JPEG / PNG / WebP / GIF 图片，或 MP4 / WebM 视频；单个文件不超过 160 MB。
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
