export const CAST_VOTE_STORAGE_KEY = 'vote_app.cast_vote.v1'

/**
 * 持久化在 localStorage 中的选票。
 */
export interface CastVotePayload {
  voterStudentId: string
  votedSubmissionId: string
}

/**
 * 读取原始选票 JSON；损坏或结构不符时返回 `null`。
 */
export function readRawVote(): CastVotePayload | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  try {
    const raw = window.localStorage.getItem(CAST_VOTE_STORAGE_KEY)
    if (raw == null || raw === '') {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }
    const { voterStudentId, votedSubmissionId } = parsed as Record<
      string,
      unknown
    >
    if (typeof voterStudentId !== 'string' || typeof votedSubmissionId !== 'string') {
      return null
    }
    return { voterStudentId, votedSubmissionId }
  } catch {
    return null
  }
}

/**
 * 返回当前登录学号对应的在投作品 ID；学号不匹配或未投票时返回 `null`（不修改存储）。
 *
 * @param currentStudentId 当前用户学号
 */
export function getActiveVotedSubmissionId(
  currentStudentId: string | null | undefined,
): string | null {
  if (currentStudentId == null || currentStudentId === '') {
    return null
  }
  const v = readRawVote()
  if (v == null || v.voterStudentId !== currentStudentId) {
    return null
  }
  return v.votedSubmissionId
}

/**
 * 写入或覆盖选票。
 *
 * @param voterStudentId 投票者学号
 * @param votedSubmissionId 被投作品 ID
 */
export function persistVote(
  voterStudentId: string,
  votedSubmissionId: string,
): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  const payload: CastVotePayload = { voterStudentId, votedSubmissionId }
  window.localStorage.setItem(CAST_VOTE_STORAGE_KEY, JSON.stringify(payload))
}

/**
 * 清除选票存储。
 */
export function clearVote(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  try {
    window.localStorage.removeItem(CAST_VOTE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * 若当前选票的 `votedSubmissionId` 不在提交列表中则清除（孤儿票）；返回清理后的在投 ID。
 *
 * @param submissionIds 当前列表中的 `submissionId` 集合
 * @param currentStudentId 当前用户学号
 */
export function reconcileVoteWithSubmissions(
  submissionIds: Set<string>,
  currentStudentId: string | null | undefined,
): string | null {
  const v = readRawVote()
  if (v == null || currentStudentId == null || v.voterStudentId !== currentStudentId) {
    return null
  }
  if (!submissionIds.has(v.votedSubmissionId)) {
    clearVote()
    return null
  }
  return v.votedSubmissionId
}
