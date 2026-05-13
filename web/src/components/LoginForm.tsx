import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'

/**
 * 登录表单：收集姓名与学号，非法输入时展示错误且不进入已登录态。
 */
export function LoginForm() {
  const { login } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const message = login(displayName, studentId)
    if (message != null) {
      setError(message)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-kicker">Class Vote Studio</p>
        <h1 className="auth-title">班级作品投票</h1>
        <p className="auth-sub">
          请输入名单中的姓名与学号（须完全一致）；本班无 38 号。管理员 6811 / 教师 708 账号见通知。
        </p>
        <form className="auth-form" onSubmit={handleSubmit}>
          {error != null ? (
            <div className="auth-error" role="alert">
              {error}
            </div>
          ) : null}
          <label className="auth-field">
            <span>姓名</span>
            <input
              name="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(ev) => setDisplayName(ev.target.value)}
              placeholder="例如：张三"
            />
          </label>
          <label className="auth-field">
            <span>学号</span>
            <input
              name="studentId"
              inputMode="numeric"
              autoComplete="username"
              value={studentId}
              onChange={(ev) => setStudentId(ev.target.value)}
              placeholder="如 7、39、6811、708"
            />
          </label>
          <button type="submit" className="auth-submit">
            进入班级
          </button>
        </form>
      </div>
      <aside className="auth-glance" aria-hidden="true">
        <p className="auth-glance-title">今天做什么</p>
        <ol className="auth-glance-list">
          <li>浏览班级作品</li>
          <li>支持你喜欢的同学</li>
          <li>关注实时排行榜</li>
        </ol>
      </aside>
    </div>
  )
}
