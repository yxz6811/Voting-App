import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import type {
  ClassSubmissionRecord,
  SubmissionMediaKind,
} from '../types/classSubmission'
import { listSubmissionsDesc } from '../lib/submissionsDb'
import {
  persistVote,
  reconcileVoteWithSubmissions,
} from '../lib/voteStorage'
import { VoteChangeModal } from './VoteChangeModal'

interface ClassSubmissionsListProps {
  /** 父级递增以触发重新加载 */
  refreshKey: number
}

function mediaKindLabel(kind: SubmissionMediaKind): string {
  return kind === 'image' ? '图片' : '视频'
}

interface SubmissionRowProps {
  row: ClassSubmissionRecord
  previewUrl: string
  isVoted: boolean
  isOwn: boolean
  onVote: () => void
}

/**
 * 单条作品：元数据 + 预览 + 投票区。
 */
function SubmissionRow({
  row,
  previewUrl,
  isVoted,
  isOwn,
  onVote,
}: SubmissionRowProps) {
  const [mediaFailed, setMediaFailed] = useState(false)
  const cardClass =
    'submission-card' + (isVoted ? ' submission-card--voted' : '')

  return (
    <article className={cardClass}>
      <header className="submission-card-head">
        <span className="submission-author">{row.uploaderDisplayName}</span>
        <span className="submission-meta">
          {mediaKindLabel(row.mediaKind)} · {row.originalFileName}
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
            alt={row.originalFileName}
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
          <span className="vote-own-label">本人作品，不参与投票</span>
        ) : isVoted ? (
          <span className="vote-badge" aria-current="true">
            已投票
          </span>
        ) : (
          <button type="button" className="vote-button" onClick={onVote}>
            投票
          </button>
        )}
      </footer>
    </article>
  )
}

/**
 * 班级作品列表：新在前、作者信息、预览、投票与改投确认。
 */
export function ClassSubmissionsList({ refreshKey }: ClassSubmissionsListProps) {
  const { user } = useAuth()
  const [items, setItems] = useState<
    { row: ClassSubmissionRecord; url: string }[]
  >([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeVoteId, setActiveVoteId] = useState<string | null>(null)
  const [changeVoteTarget, setChangeVoteTarget] =
    useState<ClassSubmissionRecord | null>(null)

  useEffect(() => {
    let alive = true
    const revokeList: string[] = []

    setLoadError(null)
    setLoading(true)

    ;(async () => {
      try {
        const rows = await listSubmissionsDesc()
        if (!alive) {
          return
        }
        const ids = new Set(rows.map((r) => r.submissionId))
        let nextActive: string | null = null
        if (user != null) {
          nextActive = reconcileVoteWithSubmissions(ids, user.studentId)
        }
        const next = rows.map((row) => {
          const url = URL.createObjectURL(row.blob)
          revokeList.push(url)
          return { row, url }
        })
        setItems(next)
        setActiveVoteId(nextActive)
      } catch {
        if (!alive) {
          return
        }
        setLoadError('加载班级列表失败，请刷新页面重试。')
        setItems([])
        setActiveVoteId(null)
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    })()

    return () => {
      alive = false
      for (const u of revokeList) {
        URL.revokeObjectURL(u)
      }
    }
  }, [refreshKey, user?.studentId])

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
    if (activeVoteId == null) {
      persistVote(user.studentId, row.submissionId)
      setActiveVoteId(row.submissionId)
      return
    }
    setChangeVoteTarget(row)
  }

  function handleConfirmChangeVote() {
    if (user == null || changeVoteTarget == null) {
      return
    }
    persistVote(user.studentId, changeVoteTarget.submissionId)
    setActiveVoteId(changeVoteTarget.submissionId)
    setChangeVoteTarget(null)
  }

  function handleCancelChangeVote() {
    setChangeVoteTarget(null)
  }

  if (loading) {
    return (
      <p className="panel-empty" aria-busy="true">
        正在加载班级列表…
      </p>
    )
  }

  if (loadError != null) {
    return (
      <div className="panel-error" role="alert">
        {loadError}
      </div>
    )
  }

  if (items.length === 0) {
    return <p className="panel-empty">班级列表还是空的，先去上传一件作品吧。</p>
  }

  return (
    <>
      {changeVoteTarget != null ? (
        <VoteChangeModal
          target={changeVoteTarget}
          onCancel={handleCancelChangeVote}
          onConfirm={handleConfirmChangeVote}
        />
      ) : null}
      <ul className="submission-list">
        {items.map(({ row, url }) => (
          <li key={row.submissionId}>
            <SubmissionRow
              row={row}
              previewUrl={url}
              isVoted={activeVoteId === row.submissionId}
              isOwn={user != null && row.uploaderStudentId === user.studentId}
              onVote={() => handleVoteClick(row)}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
