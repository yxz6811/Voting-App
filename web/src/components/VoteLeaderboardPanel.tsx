import type { ClassSubmissionRecord } from '../types/classSubmission'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { sortSubmissionsByVoteLeaderboard } from '../lib/voteLeaderboardSort'

interface VoteLeaderboardPanelProps {
  /** 与班级列表同一数据源 */
  rows: ClassSubmissionRecord[]
  /** 父级正在拉取列表 */
  loading?: boolean
  /** 拉取失败时展示 */
  error?: string | null
}

/**
 * 票数排行榜：按得票降序列出全部作品（侧栏）。
 */
export function VoteLeaderboardPanel({
  rows,
  loading = false,
  error = null,
}: VoteLeaderboardPanelProps) {
  const sorted = sortSubmissionsByVoteLeaderboard(rows)

  return (
    <aside
      className="vote-leaderboard"
      aria-labelledby="vote-leaderboard-title"
    >
      <h2 id="vote-leaderboard-title" className="vote-leaderboard-title">
        票数排行榜
      </h2>
      {loading ? (
        <p className="panel-empty vote-leaderboard-status" aria-busy="true">
          正在加载排行榜…
        </p>
      ) : error != null ? (
        <div className="panel-error vote-leaderboard-status" role="alert">
          {error}
        </div>
      ) : sorted.length === 0 ? (
        <p className="panel-empty vote-leaderboard-status">暂无作品</p>
      ) : (
        <ol className="vote-leaderboard-list">
          {sorted.map((row, index) => (
            <li key={row.submissionId} className="vote-leaderboard-row">
              <span className="vote-leaderboard-rank" aria-label={`第 ${index + 1} 名`}>
                {index + 1}
              </span>
              <span className="vote-leaderboard-name" title={submissionDisplayLabel(row)}>
                {submissionDisplayLabel(row)}
              </span>
              <span className="vote-leaderboard-count">{row.voteCount} 票</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
