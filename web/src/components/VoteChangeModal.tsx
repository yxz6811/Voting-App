import { useEffect } from 'react'
import type { ClassSubmissionRecord } from '../types/classSubmission'

interface VoteChangeModalProps {
  target: ClassSubmissionRecord
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 改投确认：阻断式对话框，说明将取消原投票。
 */
export function VoteChangeModal({
  target,
  onCancel,
  onConfirm,
}: VoteChangeModalProps) {
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="vote-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div
        className="vote-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vote-change-title"
      >
        <h2 id="vote-change-title" className="vote-modal-title">
          更改投票
        </h2>
        <p className="vote-modal-body">
          您已投票给其他作品。若继续，将<strong>取消原先的投票</strong>
          ，并改投给「{target.uploaderDisplayName}」的这件作品。是否确认？
        </p>
        <div className="vote-modal-actions">
          <button type="button" className="auth-logout" onClick={onCancel}>
            取消
          </button>
          <button type="button" className="auth-submit" onClick={onConfirm}>
            确认改投
          </button>
        </div>
      </div>
    </div>
  )
}
