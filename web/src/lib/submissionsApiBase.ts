/**
 * 班级作品 API 根路径（无尾部斜杠）。
 * - 生产默认路径为 `/voting-app-api`；在浏览器内会解析为 `https://当前域名/voting-app-api`，
 *   避免与 Vite 子路径部署的 `<base href="/voting-app/">` 叠加后，个别环境对「根相对 URL」解析异常。
 * - 开发默认 `http://127.0.0.1:3040`。
 * - 可通过 `VITE_SUBMISSIONS_API_BASE` 覆盖（支持 `https://...` 或 `/voting-app-api`）。
 */
function stripEndSlashes(s: string): string {
  return s.replace(/\/+$/, '')
}

export function getSubmissionsApiBase(): string {
  const raw = import.meta.env.VITE_SUBMISSIONS_API_BASE as string | undefined
  const trimmed = raw?.trim()
  let base: string
  if (trimmed) {
    base = stripEndSlashes(trimmed)
  } else if (import.meta.env.DEV) {
    base = 'http://127.0.0.1:3040'
  } else {
    base = '/voting-app-api'
  }

  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    const path = base.startsWith('/') ? base : `/${base}`
    return stripEndSlashes(`${window.location.origin}${path}`)
  }

  return stripEndSlashes(base)
}
