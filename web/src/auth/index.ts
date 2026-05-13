/**
 * 认证模块入口：请通过 `useAuth` 读取当前用户，勿直接访问 `localStorage`。
 */
export { AuthProvider, useAuth } from './AuthContext'
export type { AuthContextValue } from './AuthContext'
export type { CurrentUser } from '../types/currentUser'
