import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { submitFeedback } from '../lib/feedbackApi'

/**
 * 反馈留言页：填写问题后由服务端发邮件（须配置 SMTP）。
 */
export function FeedbackPage() {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function goClassroom() {
    window.location.hash = ''
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (user == null) {
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await submitFeedback({
        userStudentId: user.studentId,
        userDisplayName: user.displayName,
        message: message.trim(),
        contact: contact.trim(),
      })
      setDone(true)
      setMessage('')
      setContact('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请稍后重试。')
    } finally {
      setSubmitting(false)
    }
  }

  if (user == null) {
    return null
  }

  return (
    <div className="feedback-page">
      <div className="feedback-page__card classroom-pane">
        <header className="feedback-page__head">
          <p className="classroom-kicker">Feedback</p>
          <h1 className="classroom-title">问题留言板</h1>
          <p className="feedback-page__intro">
            描述你遇到的问题或建议。提交后将发送至管理员邮箱，我们会尽快查看。
          </p>
        </header>
        <p className="feedback-page__identity" aria-live="polite">
          当前身份：<strong>{user.displayName}</strong>（学号 {user.studentId}）
        </p>
        {done ? (
          <div className="feedback-page__success" role="status">
            <p>已提交，感谢你的反馈。</p>
            <button
              type="button"
              className="ux-action-btn ux-action-btn--primary"
              onClick={() => {
                setDone(false)
                goClassroom()
              }}
            >
              返回班级
            </button>
          </div>
        ) : (
          <form className="feedback-page__form" onSubmit={handleSubmit}>
            {error != null ? (
              <div className="panel-error feedback-page__error" role="alert">
                {error}
              </div>
            ) : null}
            <label className="feedback-page__field">
              <span>问题或建议（10～4000 字）</span>
              <textarea
                name="message"
                required
                minLength={10}
                maxLength={4000}
                rows={8}
                value={message}
                onChange={(ev) => setMessage(ev.target.value)}
                placeholder="请尽量写清操作步骤、页面提示或截图说明等。"
              />
            </label>
            <label className="feedback-page__field">
              <span>其它联系方式（选填，便于回复）</span>
              <input
                name="contact"
                type="text"
                maxLength={200}
                value={contact}
                onChange={(ev) => setContact(ev.target.value)}
                placeholder="如 QQ、微信号、手机号等"
              />
            </label>
            <div className="feedback-page__actions">
              <button
                type="button"
                className="ux-action-btn"
                disabled={submitting}
                onClick={goClassroom}
              >
                返回班级
              </button>
              <button
                type="submit"
                className="ux-action-btn ux-action-btn--primary"
                disabled={submitting}
              >
                {submitting ? '发送中…' : '发送到管理员邮箱'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
