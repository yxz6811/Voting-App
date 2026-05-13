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

/**
 * 竞赛制并列名次：同票数显示相同名次，其后名次跳过并列人数（如 1、1、3）。
 *
 * @param sorted 已按 {@link sortSubmissionsByVoteLeaderboard} 排好序的数组
 * @returns 与 `sorted` 等长的名次数组（从 1 起）
 */
export function competitionRanksForSorted(
  sorted: ClassSubmissionRecord[],
): number[] {
  const ranks: number[] = []
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      ranks.push(1)
    } else if (sorted[i].voteCount === sorted[i - 1].voteCount) {
      ranks.push(ranks[i - 1])
    } else {
      ranks.push(i + 1)
    }
  }
  return ranks
}
