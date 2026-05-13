import type { CurrentUser } from '../types/currentUser'

/**
 * 可上传班级作品的管理员账号（与 `api/server.mjs`、`validateStudentId` 校验保持一致）。
 */
export const ADMIN_DISPLAY_NAME = 'yxz'
export const ADMIN_STUDENT_ID = '6811'

/**
 * 判断当前用户是否为班级作品上传管理员。
 *
 * @param user 当前登录用户；未登录视为非管理员
 */
export function isClassSubmissionAdmin(user: CurrentUser | null): boolean {
  if (user == null) {
    return false
  }
  return (
    user.displayName.trim() === ADMIN_DISPLAY_NAME &&
    user.studentId.trim() === ADMIN_STUDENT_ID
  )
}
