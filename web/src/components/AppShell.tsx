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
        <span className="app-brand">投票小程序</span>
        <div className="app-header-user">
          <span className="app-user-name" title={user.studentId}>
            {user.displayName}
          </span>
          <button type="button" className="auth-logout" onClick={logout}>
            登出
          </button>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  )
}
