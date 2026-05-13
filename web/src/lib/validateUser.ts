import { ADMIN_STUDENT_ID } from './classSubmissionAdmin'

/**
 * 学号：本班固定为十进制数字 **1–50**，不允许前导零（如 `01`）、字母或超出范围；
 * 另允许管理员专用学号 **6811**（与 {@link ADMIN_STUDENT_ID} 一致）。
 */
const STUDENT_ID_PATTERN = /^(?:[1-9]|[1-4][0-9]|50)$/

/**
 * 计算字符串的 Unicode 码点数量（与 OpenSpec 中「≤32 码点」一致）。
 *
 * @param value 原始字符串
 * @returns 码点个数
 */
function countUnicodeCodePoints(value: string): number {
  return [...value].length
}

/**
 * 校验姓名：trim 后非空，且码点长度不超过 32。
 *
 * @param raw 用户输入
 * @returns 成功时返回 trim 后的姓名；失败时返回错误文案
 */
export function validateDisplayName(
  raw: string,
):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  const value = raw.trim()
  if (value.length === 0) {
    return { ok: false, message: '姓名不能为空' }
  }
  if (countUnicodeCodePoints(value) > 32) {
    return { ok: false, message: '姓名长度不能超过 32 个字符' }
  }
  return { ok: true, value }
}

/**
 * 校验学号：trim 后须为 **1–50** 的正整数（无前导零），或管理员学号 **6811**。
 *
 * @param raw 用户输入
 * @returns 成功时返回 trim 后的学号；失败时返回错误文案（对非法输入仍为 1–50 提示）
 */
export function validateStudentId(
  raw: string,
):
  | { ok: true; value: string }
  | { ok: false; message: string } {
  const value = raw.trim()
  if (value.length === 0) {
    return { ok: false, message: '学号不能为空' }
  }
  if (value === ADMIN_STUDENT_ID) {
    return { ok: true, value }
  }
  if (!STUDENT_ID_PATTERN.test(value)) {
    return {
      ok: false,
      message: '学号须为 1 到 50 之间的数字（不含前导零）',
    }
  }
  return { ok: true, value }
}
