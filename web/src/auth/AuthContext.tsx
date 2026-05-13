import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CurrentUser } from '../types/currentUser'
import {
  clearStoredUser,
  readStoredUser,
  writeStoredUser,
} from '../lib/userStorage'
import { validateDisplayName, validateStudentId } from '../lib/validateUser'

export interface AuthContextValue {
  /** 是否已完成从 localStorage 的首次恢复（避免登录页闪烁） */
  hydrated: boolean
  /** 当前用户；未登录为 `null` */
  user: CurrentUser | null
  /**
   * 尝试登录：校验通过后写入存储并更新状态。
   *
   * @param displayName 姓名
   * @param studentId 学号
   * @returns 失败时返回错误信息（可展示在表单顶部）
   */
  login: (displayName: string, studentId: string) => string | null
  /** 登出：清除存储与内存态 */
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * 提供全局登录态，供页面通过 {@link useAuth} 读取。
 *
 * @param props.children 子组件
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    setUser(readStoredUser())
    setHydrated(true)
  }, [])

  const login = useCallback((displayName: string, studentId: string) => {
    const nameRes = validateDisplayName(displayName)
    const idRes = validateStudentId(studentId)
    if (!nameRes.ok || !idRes.ok) {
      const parts: string[] = []
      if (!nameRes.ok) {
        parts.push(nameRes.message)
      }
      if (!idRes.ok) {
        parts.push(idRes.message)
      }
      return parts.join('；')
    }
    const next: CurrentUser = {
      displayName: nameRes.value,
      studentId: idRes.value,
    }
    writeStoredUser(next)
    setUser(next)
    return null
  }, [])

  const logout = useCallback(() => {
    clearStoredUser()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      hydrated,
      user,
      login,
      logout,
    }),
    [hydrated, user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 读取当前认证上下文；必须在 {@link AuthProvider} 内使用。
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (ctx == null) {
    throw new Error('useAuth 必须在 AuthProvider 内使用')
  }
  return ctx
}
