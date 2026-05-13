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
    <div className="auth-card">
      <h1 className="auth-title">登录</h1>
      <p className="auth-sub">请输入姓名与学号以继续使用投票小程序</p>
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
            autoComplete="username"
            value={studentId}
            onChange={(ev) => setStudentId(ev.target.value)}
            placeholder="4–20 位字母或数字"
          />
        </label>
        <button type="submit" className="auth-submit">
          登录
        </button>
      </form>
    </div>
  )
}
