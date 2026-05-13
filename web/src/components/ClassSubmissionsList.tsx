import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import type {
  ClassSubmissionRecord,
  SubmissionMediaKind,
} from '../types/classSubmission'
import {
  castServerVote,
  deleteClassSubmission,
  fetchServerVoteForVoter,
} from '../lib/submissionsDb'
import {
  persistVote,
  reconcileVoteWithSubmissions,
} from '../lib/voteStorage'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { submissionAuthorDisplayName } from '../lib/submissionAuthorDisplay'
import { isClassSubmissionAdmin } from '../lib/classSubmissionAdmin'
import { VoteChangeModal } from './VoteChangeModal'
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

interface SubmissionRowProps {
  row: ClassSubmissionRecord
  previewUrl: string
  isVoted: boolean
  isOwn: boolean
  /** 管理员在所有条目上显示删除 */
  showAdminDelete: boolean
  /** 正在提交投票，禁用「投票」防重复 */
  voteBusy: boolean
  onVote: () => void
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
  showAdminDelete,
  voteBusy,
  onVote,
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
        <span className="submission-author">{authorShown}</span>
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
                <span className="vote-badge" aria-current="true">
                  已投票
                </span>
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
 * 班级作品列表：新在前、作者信息、预览、投票与改投确认。
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
  const [activeVoteId, setActiveVoteId] = useState<string | null>(null)
  const [changeVoteTarget, setChangeVoteTarget] =
    useState<ClassSubmissionRecord | null>(null)
  const [deleteTarget, setDeleteTarget] =
    useState<ClassSubmissionRecord | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteActionError, setDeleteActionError] = useState<string | null>(null)
  const [voteActionError, setVoteActionError] = useState<string | null>(null)
  const [voteSubmitting, setVoteSubmitting] = useState(false)

  useEffect(() => {
    if (submissionsLoading || submissionsError != null) {
      return
    }
    let alive = true
    const revokeList: string[] = []

    ;(async () => {
      const rows = submissions
      const ids = new Set(rows.map((r) => r.submissionId))
      let nextActive: string | null = null
      if (user != null) {
        try {
          const srv = await fetchServerVoteForVoter(user.studentId)
          if (srv != null && ids.has(srv)) {
            persistVote(user.studentId, srv)
          }
        } catch {
          /* 无法拉取服务端选票时仍以本地为准 */
        }
        nextActive = reconcileVoteWithSubmissions(ids, user.studentId)
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
      setActiveVoteId(nextActive)
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
    if (activeVoteId === row.submissionId) {
      return
    }
    if (voteSubmitting) {
      return
    }
    if (activeVoteId == null) {
      setVoteActionError(null)
      void (async () => {
        setVoteSubmitting(true)
        try {
          await castServerVote(user.studentId, row.submissionId)
          persistVote(user.studentId, row.submissionId)
          setActiveVoteId(row.submissionId)
          onListMutated?.()
        } catch (e) {
          setVoteActionError(
            e instanceof Error ? e.message : '投票失败，请稍后重试。',
          )
        } finally {
          setVoteSubmitting(false)
        }
      })()
      return
    }
    setChangeVoteTarget(row)
  }

  function handleConfirmChangeVote() {
    if (user == null || changeVoteTarget == null || voteSubmitting) {
      return
    }
    setVoteActionError(null)
    void (async () => {
      setVoteSubmitting(true)
      try {
        await castServerVote(user.studentId, changeVoteTarget.submissionId)
        persistVote(user.studentId, changeVoteTarget.submissionId)
        setActiveVoteId(changeVoteTarget.submissionId)
        setChangeVoteTarget(null)
        onListMutated?.()
      } catch (e) {
        setVoteActionError(
          e instanceof Error ? e.message : '改投失败，请稍后重试。',
        )
      } finally {
        setVoteSubmitting(false)
      }
    })()
  }

  function handleCancelChangeVote() {
    setChangeVoteTarget(null)
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
      {changeVoteTarget != null ? (
        <VoteChangeModal
          target={changeVoteTarget}
          submitting={voteSubmitting}
          onCancel={handleCancelChangeVote}
          onConfirm={handleConfirmChangeVote}
        />
      ) : null}
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
      <ul className="submission-list">
        {items.map(({ row, url }) => {
          const isOwnRow =
            user != null && row.uploaderStudentId === user.studentId
          return (
            <li key={row.submissionId}>
              <SubmissionRow
                row={row}
                previewUrl={url}
                isVoted={activeVoteId === row.submissionId}
                isOwn={isOwnRow}
                showAdminDelete={showAdminDelete}
                voteBusy={voteSubmitting}
                onVote={() => handleVoteClick(row)}
                onRequestDelete={() => handleOpenDelete(row)}
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
