import type { ReactNode } from 'react'
import { useAuth } from '../auth'

interface AppShellProps {
  children: ReactNode
}

/**
 * 已登录布局：顶栏展示姓名与登出。
 */
export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth()
  if (user == null) {
    return null
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-brand-wrap">
          <span className="app-brand-dot" aria-hidden="true" />
          <div className="app-brand-copy">
            <span className="app-brand">投票小程序</span>
            <span className="app-brand-sub">Class Gallery Voting</span>
          </div>
        </div>
        <div className="app-header-user">
          <div className="app-user-chip" title={user.studentId}>
            <span className="app-user-label">当前用户</span>
            <span className="app-user-name">{user.displayName}</span>
          </div>
          <button type="button" className="auth-logout" onClick={logout}>
            登出
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
