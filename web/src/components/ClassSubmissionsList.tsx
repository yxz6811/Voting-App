import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import type {
  ClassSubmissionRecord,
  SubmissionMediaKind,
} from '../types/classSubmission'
import {
  castServerVote,
  deleteClassSubmission,
  fetchServerVotesForVoter,
  withdrawServerVote,
} from '../lib/submissionsDb'
import {
  persistVotes,
  reconcileVotesWithSubmissions,
  VOTES_PER_USER,
} from '../lib/voteStorage'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { submissionAuthorDisplayName } from '../lib/submissionAuthorDisplay'
import { isClassSubmissionAdmin } from '../lib/classSubmissionAdmin'
import { VoteLimitModal } from './VoteLimitModal'
import { DeleteSubmissionModal } from './DeleteSubmissionModal'

export interface ClassSubmissionsListProps {
  /** 父级递增以触发投票同步与列表重建 */
  refreshKey: number
  /** 删除等变更成功后通知父级抬高 `refreshKey` */
  onListMutated?: () => void
  /** 父级 `listSubmissionsDesc` 结果 */
  submissions: ClassSubmissionRecord[]
  submissionsLoading: boolean
  submissionsError: string | null
}

function mediaKindLabel(kind: SubmissionMediaKind): string {
  return kind === 'image' ? '图片' : '视频'
}

type SubmissionTierTone = 's' | 'a' | 'b' | 'c'

interface SubmissionTier {
  label: string
  tone: SubmissionTierTone
  tip: string
}

function submissionTierByVotes(voteCount: number, maxVoteCount: number): SubmissionTier {
  if (maxVoteCount <= 0) {
    return { label: '新秀 C 档', tone: 'c', tip: '刚上榜，欢迎第一票支持。' }
  }
  const ratio = voteCount / maxVoteCount
  if (ratio >= 0.85) {
    return { label: '爆款 S 档', tone: 's', tip: '当前是头部作品，热度很高。' }
  }
  if (ratio >= 0.6) {
    return { label: '热门 A 档', tone: 'a', tip: '表现稳定，继续冲榜很有机会。' }
  }
  if (ratio >= 0.35) {
    return { label: '潜力 B 档', tone: 'b', tip: '上升势头不错，再加几票更容易进前列。' }
  }
  return { label: '新秀 C 档', tone: 'c', tip: '还在起步阶段，欢迎多多支持。' }
}

interface SubmissionRowProps {
  row: ClassSubmissionRecord
  previewUrl: string
  isVoted: boolean
  isOwn: boolean
  tier: SubmissionTier
  /** 管理员在所有条目上显示删除 */
  showAdminDelete: boolean
  /** 正在提交投票，禁用「投票」防重复 */
  voteBusy: boolean
  onVote: () => void
  /** 取消对该作品的投票 */
  onCancelVote: () => void
  /** 点击「删除」时调用；仅管理员会渲染该按钮 */
  onRequestDelete: () => void
}

/**
 * 单条作品：元数据 + 预览 + 投票区。
 */
function SubmissionRow({
  row,
  previewUrl,
  isVoted,
  isOwn,
  tier,
  showAdminDelete,
  voteBusy,
  onVote,
  onCancelVote,
  onRequestDelete,
}: SubmissionRowProps) {
  const [mediaFailed, setMediaFailed] = useState(false)
  const cardClass =
    'submission-card' + (isVoted ? ' submission-card--voted' : '')
  const titleShown = submissionDisplayLabel(row)
  const authorShown = submissionAuthorDisplayName(row)

  return (
    <article className={cardClass}>
      <header className="submission-card-head">
        <div className="submission-author-row">
          <span className="submission-author">{authorShown}</span>
          <span
            className={`submission-tier submission-tier--${tier.tone}`}
            title={tier.tip}
          >
            {tier.label}
          </span>
        </div>
        <span className="submission-meta">
          {mediaKindLabel(row.mediaKind)} · {titleShown}
          <span className="submission-vote-count" aria-label={`得票 ${row.voteCount} 票`}>
            {' '}
            · {row.voteCount} 票
          </span>
        </span>
      </header>
      <div className="submission-preview">
        {mediaFailed ? (
          <div className="submission-preview-error" role="alert">
            {row.mediaKind === 'video'
              ? '无法播放此视频，可尝试使用 H.264 + AAC 编码的 MP4。'
              : '无法显示此图片，文件可能已损坏。'}
          </div>
        ) : row.mediaKind === 'image' ? (
          <img
            src={previewUrl}
            alt={titleShown}
            loading="lazy"
            onError={() => setMediaFailed(true)}
          />
        ) : (
          <video
            src={previewUrl}
            controls
            muted
            playsInline
            onError={() => setMediaFailed(true)}
          />
        )}
      </div>
      <footer className="submission-vote-row">
        {isOwn ? (
          <div className="submission-own-row">
            <span className="vote-own-label">本人作品，不参与投票</span>
            {showAdminDelete ? (
              <button
                type="button"
                className="submission-delete-btn"
                onClick={onRequestDelete}
              >
                删除作品
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="submission-vote-actions">
              {isVoted ? (
                <>
                  <span className="vote-badge" aria-current="true">
                    已投票
                  </span>
                  <button
                    type="button"
                    className="vote-cancel-btn"
                    disabled={voteBusy}
                    onClick={onCancelVote}
                  >
                    取消
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="vote-button"
                  disabled={voteBusy}
                  onClick={onVote}
                >
                  投票
                </button>
              )}
            </div>
            <p className="submission-ux-tip">
              {isVoted
                ? '已支持该作品，可在排行榜关注名次变化。'
                : '喜欢就投一票，票数会实时计入排行榜。'}
            </p>
            {showAdminDelete ? (
              <button
                type="button"
                className="submission-delete-btn submission-delete-btn--admin-row"
                onClick={onRequestDelete}
              >
                删除作品
              </button>
            ) : null}
          </>
        )}
      </footer>
    </article>
  )
}

/**
 * 班级作品列表：新在前、作者信息、预览、投票（每人最多 10 票）与删除。
 *
 * 列表数据由父级拉取并传入，与排行榜共用同一请求结果。
 */
export function ClassSubmissionsList({
  refreshKey,
  onListMutated,
  submissions,
  submissionsLoading,
  submissionsError,
}: ClassSubmissionsListProps) {
  const { user } = useAuth()
  const showAdminDelete = isClassSubmissionAdmin(user)
  const [items, setItems] = useState<
    { row: ClassSubmissionRecord; url: string }[]
  >([])
  const [votedSubmissionIds, setVotedSubmissionIds] = useState<string[]>([])
  const [voteLimitOpen, setVoteLimitOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] =
    useState<ClassSubmissionRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteActionError, setDeleteActionError] = useState<string | null>(null)
  const [voteActionError, setVoteActionError] = useState<string | null>(null)
  const [voteSubmitting, setVoteSubmitting] = useState(false)
  const maxVoteCount = submissions.reduce(
    (max, row) => Math.max(max, row.voteCount),
    0,
  )
  const remainingVotes = Math.max(VOTES_PER_USER - votedSubmissionIds.length, 0)

  useEffect(() => {
    if (submissionsLoading || submissionsError != null) {
      return
    }
    let alive = true
    const revokeList: string[] = []

    ;(async () => {
      const rows = submissions
      const ids = new Set(rows.map((r) => r.submissionId))
      let nextIds: string[] = []
      if (user != null) {
        try {
          const srv = await fetchServerVotesForVoter(user.studentId)
          const filtered = srv.filter((id) => ids.has(id))
          persistVotes(user.studentId, filtered)
          nextIds = filtered
        } catch {
          nextIds = reconcileVotesWithSubmissions(ids, user.studentId)
        }
      }
      const next = rows.map((row) => {
        if (row.mediaUrl != null && row.mediaUrl !== '') {
          return { row, url: row.mediaUrl }
        }
        if (row.blob != null) {
          const url = URL.createObjectURL(row.blob)
          revokeList.push(url)
          return { row, url }
        }
        return { row, url: '' }
      })
      if (!alive) {
        for (const u of revokeList) {
          URL.revokeObjectURL(u)
        }
        return
      }
      setItems(next)
      setVotedSubmissionIds(nextIds)
    })()

    return () => {
      alive = false
      for (const u of revokeList) {
        URL.revokeObjectURL(u)
      }
    }
  }, [
    submissions,
    submissionsLoading,
    submissionsError,
    user?.studentId,
    refreshKey,
  ])

  function handleVoteClick(row: ClassSubmissionRecord) {
    if (user == null) {
      return
    }
    if (row.uploaderStudentId === user.studentId) {
      return
    }
    if (votedSubmissionIds.includes(row.submissionId)) {
      return
    }
    if (voteSubmitting) {
      return
    }
    if (votedSubmissionIds.length >= VOTES_PER_USER) {
      setVoteLimitOpen(true)
      return
    }
    setVoteActionError(null)
    void (async () => {
      setVoteSubmitting(true)
      try {
        await castServerVote(user.studentId, row.submissionId)
        const next = [...votedSubmissionIds, row.submissionId]
        persistVotes(user.studentId, next)
        setVotedSubmissionIds(next)
        onListMutated?.()
      } catch (e) {
        const code =
          typeof e === 'object' &&
          e !== null &&
          'errorCode' in e &&
          typeof (e as { errorCode: unknown }).errorCode === 'string'
            ? (e as { errorCode: string }).errorCode
            : ''
        if (code === 'vote_limit_exceeded') {
          setVoteLimitOpen(true)
        } else {
          setVoteActionError(
            e instanceof Error ? e.message : '投票失败，请稍后重试。',
          )
        }
      } finally {
        setVoteSubmitting(false)
      }
    })()
  }

  function handleCancelVote(row: ClassSubmissionRecord) {
    if (user == null || voteSubmitting) {
      return
    }
    setVoteActionError(null)
    void (async () => {
      setVoteSubmitting(true)
      try {
        await withdrawServerVote(user.studentId, row.submissionId)
        const next = votedSubmissionIds.filter((id) => id !== row.submissionId)
        persistVotes(user.studentId, next)
        setVotedSubmissionIds(next)
        onListMutated?.()
      } catch (e) {
        setVoteActionError(
          e instanceof Error ? e.message : '取消投票失败，请稍后重试。',
        )
      } finally {
        setVoteSubmitting(false)
      }
    })()
  }

  function handleOpenDelete(row: ClassSubmissionRecord) {
    setDeleteActionError(null)
    setDeleteTarget(row)
  }

  function handleCancelDelete() {
    if (deleteSubmitting) {
      return
    }
    setDeleteTarget(null)
    setDeleteActionError(null)
  }

  async function handleConfirmDelete() {
    if (user == null || deleteTarget == null) {
      return
    }
    setDeleteSubmitting(true)
    setDeleteActionError(null)
    try {
      await deleteClassSubmission(deleteTarget.submissionId, user)
      setDeleteTarget(null)
      onListMutated?.()
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : '删除失败，请稍后重试。'
      setDeleteActionError(msg)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (submissionsLoading) {
    return (
      <p className="panel-empty" aria-busy="true">
        正在加载班级列表…
      </p>
    )
  }

  if (submissionsError != null) {
    return (
      <div className="panel-error" role="alert">
        {submissionsError}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="panel-empty">
        班级列表还是空的，请联系管理员上传作品。
      </p>
    )
  }

  return (
    <>
      {voteLimitOpen ? <VoteLimitModal onClose={() => setVoteLimitOpen(false)} /> : null}
      {deleteTarget != null ? (
        <DeleteSubmissionModal
          target={deleteTarget}
          submitting={deleteSubmitting}
          onCancel={handleCancelDelete}
          onConfirm={handleConfirmDelete}
        />
      ) : null}
      {deleteActionError != null ? (
        <div className="panel-error submission-delete-banner" role="alert">
          {deleteActionError}
        </div>
      ) : null}
      {voteActionError != null ? (
        <div className="panel-error submission-delete-banner" role="alert">
          {voteActionError}
        </div>
      ) : null}
      <p className="vote-progress-note" aria-live="polite">
        你还可以投 <strong>{remainingVotes}</strong> / {VOTES_PER_USER} 票
      </p>
      <ul className="submission-list">
        {items.map(({ row, url }) => {
          const isOwnRow =
            user != null && row.uploaderStudentId === user.studentId
          return (
            <li key={row.submissionId}>
              <SubmissionRow
                row={row}
                previewUrl={url}
                isVoted={votedSubmissionIds.includes(row.submissionId)}
                isOwn={isOwnRow}
                tier={submissionTierByVotes(row.voteCount, maxVoteCount)}
                showAdminDelete={showAdminDelete}
                voteBusy={voteSubmitting}
                onVote={() => handleVoteClick(row)}
                onCancelVote={() => handleCancelVote(row)}
                onRequestDelete={() => handleOpenDelete(row)}
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
