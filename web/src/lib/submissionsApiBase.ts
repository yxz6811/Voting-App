/**
 * 班级作品 API 根路径（无尾部斜杠）。
 * - 生产默认 `/voting-app-api`，由 Nginx 反代到本机 Node。
 * - 开发默认 `http://127.0.0.1:3040`。
 * - 可通过 `VITE_SUBMISSIONS_API_BASE` 覆盖。
 */
export function getSubmissionsApiBase(): string {
  const raw = import.meta.env.VITE_SUBMISSIONS_API_BASE as string | undefined
  const trimmed = raw?.trim()
  if (trimmed) {
    return trimmed.replace(/\/+$/, '')
  }
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:3040'
  }
  return '/voting-app-api'
}
