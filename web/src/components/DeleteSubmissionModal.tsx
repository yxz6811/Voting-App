import { useEffect } from 'react'
import type { ClassSubmissionRecord } from '../types/classSubmission'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { submissionAuthorDisplayName } from '../lib/submissionAuthorDisplay'

interface DeleteSubmissionModalProps {
  target: ClassSubmissionRecord
  /** 是否正在请求删除（禁用按钮防重复） */
  submitting: boolean
  onCancel: () => void
  onConfirm: () => void
}

/**
 * 删除作品前的确认对话框（当前仅管理员可发起删除）。
 */
export function DeleteSubmissionModal({
  target,
  submitting,
  onCancel,
  onConfirm,
}: DeleteSubmissionModalProps) {
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
        aria-labelledby="delete-submission-title"
      >
        <h2 id="delete-submission-title" className="vote-modal-title">
          删除作品
        </h2>
        <p className="vote-modal-body">
          {`确定要删除「${submissionAuthorDisplayName(target)}」的「${submissionDisplayLabel(
            target,
          )}」吗？此操作不可恢复；若其他同学曾投票给该作品，相关选票将失效。`}
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
            className="submission-delete-confirm"
            disabled={submitting}
            onClick={onConfirm}
          >
            {submitting ? '删除中…' : '确认删除'}
          </button>
        </div>
      </div>
    </div>
  )
}
