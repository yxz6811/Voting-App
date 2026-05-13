import type { CurrentUser } from '../types/currentUser'
import { validateDisplayName, validateStudentId } from './validateUser'

/** localStorage 键名（版本化，便于日后迁移） */
export const CURRENT_USER_STORAGE_KEY = 'vote_app.current_user.v1'

interface PersistedShape {
  displayName: unknown
  studentId: unknown
}

/**
 * 从 localStorage 读取并校验当前用户；损坏或不符合规则时返回 `null`，不抛异常。
 *
 * @returns 合法用户或 `null`
 */
export function readStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    if (raw == null || raw === '') {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    const { displayName, studentId } = parsed as PersistedShape
    if (typeof displayName !== 'string' || typeof studentId !== 'string') {
      return null
    }
    const nameResult = validateDisplayName(displayName)
    const idResult = validateStudentId(studentId)
    if (!nameResult.ok || !idResult.ok) {
      return null
    }
    return {
      displayName: nameResult.value,
      studentId: idResult.value,
    }
  } catch {
    return null
  }
}

/**
 * 将当前用户写入 localStorage。
 *
 * @param user 已通过校验的用户信息
 */
export function writeStoredUser(user: CurrentUser): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  window.localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify({
      displayName: user.displayName,
      studentId: user.studentId,
    }),
  )
}

/**
 * 清除 localStorage 中的当前用户。
 */
export function clearStoredUser(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  try {
    window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
  } catch {
    /* 忽略配额等异常，登出仍应完成内存态清理 */
  }
}
