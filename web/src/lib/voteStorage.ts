/** 每个账号最多可投的不同作品数 */
export const VOTES_PER_USER = 10

/** 多票存储 */
export const CAST_VOTES_STORAGE_KEY = 'vote_app.cast_votes.v2'

/** 旧版单票存储键，读取时自动迁移 */
const LEGACY_CAST_VOTE_STORAGE_KEY = 'vote_app.cast_vote.v1'

/**
 * 持久化在 localStorage 中的选票列表。
 */
export interface CastVotesPayload {
  voterStudentId: string
  votedSubmissionIds: string[]
}

/**
 * 读取多票 JSON；损坏或结构不符时返回 `null`。
 */
export function readRawVotes(): CastVotesPayload | null {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }
  try {
    const rawV2 = window.localStorage.getItem(CAST_VOTES_STORAGE_KEY)
    if (rawV2 != null && rawV2 !== '') {
      const parsed: unknown = JSON.parse(rawV2)
      if (typeof parsed !== 'object' || parsed === null) {
        return null
      }
      const { voterStudentId, votedSubmissionIds } = parsed as Record<
        string,
        unknown
      >
      if (typeof voterStudentId !== 'string' || !Array.isArray(votedSubmissionIds)) {
        return null
      }
      const ids = votedSubmissionIds.filter(
        (x): x is string => typeof x === 'string' && x.trim() !== '',
      )
      return { voterStudentId, votedSubmissionIds: [...new Set(ids)] }
    }
    const rawLegacy = window.localStorage.getItem(LEGACY_CAST_VOTE_STORAGE_KEY)
    if (rawLegacy != null && rawLegacy !== '') {
      const parsed: unknown = JSON.parse(rawLegacy)
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
      if (votedSubmissionId.trim() === '') {
        return null
      }
      return {
        voterStudentId,
        votedSubmissionIds: [votedSubmissionId.trim()],
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * 返回当前登录学号对应的已投作品 ID 列表（去重）；学号不匹配时返回 `[]`。
 *
 * @param currentStudentId 当前用户学号
 */
export function getActiveVotedSubmissionIds(
  currentStudentId: string | null | undefined,
): string[] {
  if (currentStudentId == null || currentStudentId === '') {
    return []
  }
  const v = readRawVotes()
  if (v == null || v.voterStudentId !== currentStudentId) {
    return []
  }
  return [...v.votedSubmissionIds]
}

/**
 * 写入或覆盖当前用户的已投票作品 ID 列表。
 *
 * @param voterStudentId 投票者学号
 * @param votedSubmissionIds 已投作品 ID（会去重）
 */
export function persistVotes(
  voterStudentId: string,
  votedSubmissionIds: string[],
): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  const unique = [...new Set(votedSubmissionIds.filter((s) => s.trim() !== ''))]
  const payload: CastVotesPayload = { voterStudentId, votedSubmissionIds: unique }
  window.localStorage.setItem(CAST_VOTES_STORAGE_KEY, JSON.stringify(payload))
  try {
    window.localStorage.removeItem(LEGACY_CAST_VOTE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * 清除选票存储（新旧键均删）。
 */
export function clearVotes(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return
  }
  try {
    window.localStorage.removeItem(CAST_VOTES_STORAGE_KEY)
    window.localStorage.removeItem(LEGACY_CAST_VOTE_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * 过滤掉已不在列表中的作品 ID，并写回存储；返回过滤后的列表。
 *
 * @param submissionIds 当前列表中的 `submissionId` 集合
 * @param currentStudentId 当前用户学号
 */
export function reconcileVotesWithSubmissions(
  submissionIds: Set<string>,
  currentStudentId: string | null | undefined,
): string[] {
  const v = readRawVotes()
  if (v == null || currentStudentId == null || v.voterStudentId !== currentStudentId) {
    return []
  }
  const next = v.votedSubmissionIds.filter((id) => submissionIds.has(id))
  if (next.length !== v.votedSubmissionIds.length) {
    if (next.length === 0) {
      clearVotes()
      return []
    }
    persistVotes(currentStudentId, next)
  }
  return next
}
