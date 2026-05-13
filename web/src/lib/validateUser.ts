const STUDENT_ID_PATTERN = /^[0-9A-Za-z]{4,20}$/

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
 * 校验学号：trim 后须匹配 `^[0-9A-Za-z]{4,20}$`。
 *
 * @param raw 用户输入
 * @returns 成功时返回 trim 后的学号；失败时返回错误文案
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
  if (!STUDENT_ID_PATTERN.test(value)) {
    return {
      ok: false,
      message: '学号须为 4–20 位字母或数字',
    }
  }
  return { ok: true, value }
}
