import type { ClassSubmissionRecord } from '../types/classSubmission'

/**
 * 按票数排行榜规则排序：先得票高到低，同票则较新作品在前，再同则按 `submissionId` 字典序。
 *
 * @param rows 班级作品列表（不会被原地修改）
 * @returns 新数组，已排序
 */
export function sortSubmissionsByVoteLeaderboard(
  rows: ClassSubmissionRecord[],
): ClassSubmissionRecord[] {
  return [...rows].sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount
    }
    const ca = String(a.createdAt)
    const cb = String(b.createdAt)
    if (cb !== ca) {
      return cb.localeCompare(ca)
    }
    return a.submissionId.localeCompare(b.submissionId)
  })
}
