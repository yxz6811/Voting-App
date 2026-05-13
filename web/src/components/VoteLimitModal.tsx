import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface VoteLimitModalProps {
  /** 关闭对话框 */
  onClose: () => void
}

/**
 * 已达每人 10 票上限时的提示弹窗。
 */
export function VoteLimitModal({ onClose }: VoteLimitModalProps) {
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="vote-modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className="vote-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="vote-limit-title"
      >
        <h2 id="vote-limit-title" className="vote-modal-title">
          投票上限
        </h2>
        <p className="vote-modal-body">你已经投过十票了！</p>
        <div className="vote-modal-actions">
          <button type="button" className="auth-submit" onClick={onClose}>
            知道了
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
