import { useEffect } from 'react'
import type { ClassSubmissionRecord } from '../types/classSubmission'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { submissionAuthorDisplayName } from '../lib/submissionAuthorDisplay'

interface VoteChangeModalProps {
  target: ClassSubmissionRecord
  /** 正在请求改投 */
  submitting?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 改投确认：阻断式对话框，说明将取消原投票。
 */
export function VoteChangeModal({
  target,
  submitting = false,
  onCancel,
  onConfirm,
}: VoteChangeModalProps) {
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape' && !submitting) {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, submitting])

  return (
    <div
      className="vote-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (!submitting && e.target === e.currentTarget) {
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
          ，并改投给「{submissionAuthorDisplayName(target)}」的作品「{submissionDisplayLabel(target)}」。是否确认？
        </p>
        <div className="vote-modal-actions">
          <button
            type="button"
            className="auth-logout"
            disabled={submitting}
            onClick={onCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="auth-submit"
            disabled={submitting}
            onClick={onConfirm}
          >
            {submitting ? '提交中…' : '确认改投'}
          </button>
        </div>
      </div>
    </div>
  )
}
