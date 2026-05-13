import type { ClassSubmissionRecord } from '../types/classSubmission'
import { submissionDisplayLabel } from '../lib/submissionDisplayTitle'
import { submissionAuthorDisplayName } from '../lib/submissionAuthorDisplay'
import {
  competitionRanksForSorted,
  sortSubmissionsByVoteLeaderboard,
} from '../lib/voteLeaderboardSort'

interface VoteLeaderboardPanelProps {
  /** 与班级列表同一数据源 */
  rows: ClassSubmissionRecord[]
  /** 父级正在拉取列表 */
  loading?: boolean
  /** 拉取失败时展示 */
  error?: string | null
}

/**
 * 名次展示：第 1–2 名金冠、3–5 银冠、6–10 铜冠；第 11 名起为数字。
 *
 * @param props.rank 竞赛制并列名次（≥1）
 */
function LeaderboardRankOrCrown({ rank }: { rank: number }) {
  if (rank > 10) {
    return <span className="vote-leaderboard-rank-plain">{rank}</span>
  }
  const tier = rank <= 2 ? 'gold' : rank <= 5 ? 'silver' : 'bronze'
  return (
    <span
      className={`vote-leaderboard-crown vote-leaderboard-crown--${tier}`}
      title={`第 ${rank} 名`}
    >
      <svg
        className="vote-leaderboard-crown-svg"
        viewBox="0 0 48 52"
        width="38"
        height="41"
        aria-hidden="true"
      >
        <path
          className="vote-leaderboard-crown-top"
          d="M6 36 L9 16 L17 24 L24 9 L31 24 L39 16 L42 36 Z"
        />
        <rect
          className="vote-leaderboard-crown-band"
          x="5"
          y="36"
          width="38"
          height="9"
          rx="2"
        />
        <text
          className="vote-leaderboard-crown-digit"
          x="24"
          y="32"
          textAnchor="middle"
        >
          {rank}
        </text>
      </svg>
    </span>
  )
}

/**
 * 票数排行榜：按得票降序列出全部作品（侧栏）。
 * 作者名过长时由样式折为至多两行；皇冠、作品名与票数列与该行垂直居中对齐。
 */
export function VoteLeaderboardPanel({
  rows,
  loading = false,
  error = null,
}: VoteLeaderboardPanelProps) {
  const sorted = sortSubmissionsByVoteLeaderboard(rows)
  const ranks = competitionRanksForSorted(sorted)

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
          {sorted.map((row, index) => {
            const rank = ranks[index]
            const title = submissionDisplayLabel(row)
            const author = submissionAuthorDisplayName(row)
            const label = `第 ${rank} 名，${author}，作品「${title}」，${row.voteCount} 票`
            return (
              <li
                key={row.submissionId}
                className="vote-leaderboard-row"
                aria-label={label}
              >
                <div className="vote-leaderboard-row-inner" aria-hidden="true">
                  <div className="vote-leaderboard-cell vote-leaderboard-cell--rank">
                    <LeaderboardRankOrCrown rank={rank} />
                  </div>
                  <span
                    className="vote-leaderboard-cell vote-leaderboard-cell--author"
                    title={author}
                  >
                    {author}
                  </span>
                  <span className="vote-leaderboard-cell vote-leaderboard-cell--title" title={title}>
                    {title}
                  </span>
                  <span className="vote-leaderboard-cell vote-leaderboard-cell--votes">
                    {row.voteCount} 票
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </aside>
  )
}
