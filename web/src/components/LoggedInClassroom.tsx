import { useEffect, useState } from 'react'
import type { ClassSubmissionRecord } from '../types/classSubmission'
import { listSubmissionsDesc } from '../lib/submissionsDb'
import { VOTES_PER_USER } from '../lib/voteStorage'
import { ClassSubmissionsList } from './ClassSubmissionsList'
import { SubmissionPreviewPage } from './SubmissionPreviewPage'
import { UploadWorkPanel } from './UploadWorkPanel'
import { VoteLeaderboardPanel } from './VoteLeaderboardPanel'
import { useAuth } from '../auth'
import { isClassSubmissionAdmin } from '../lib/classSubmissionAdmin'

type ClassroomTab = 'upload' | 'list'

/**
 * 已登录后的班级区：普通用户仅班级列表；管理员可切换上传与列表；列表与票数排行榜共用一次拉取。
 */
export function LoggedInClassroom() {
  const { user } = useAuth()
  const isAdmin = isClassSubmissionAdmin(user)
  const [tab, setTab] = useState<ClassroomTab>('list')
  const [previewSubmissionId, setPreviewSubmissionId] = useState<string | null>(null)
  const [listRefreshKey, setListRefreshKey] = useState(0)
  const [listRows, setListRows] = useState<ClassSubmissionRecord[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  function bumpList() {
    setListRefreshKey((k) => k + 1)
  }

  useEffect(() => {
    if (tab !== 'list') {
      return
    }
    let alive = true
    setListLoading(true)
    setListError(null)
    ;(async () => {
      try {
        const rows = await listSubmissionsDesc()
        if (!alive) {
          return
        }
        setListRows(rows)
      } catch {
        if (!alive) {
          return
        }
        setListRows([])
        setListError('加载班级列表失败，请刷新页面重试。')
      } finally {
        if (alive) {
          setListLoading(false)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [tab, listRefreshKey])

  useEffect(() => {
    if (!isAdmin && tab === 'upload') {
      setTab('list')
    }
  }, [isAdmin, tab])

  const previewRow =
    previewSubmissionId == null
      ? undefined
      : listRows.find((r) => r.submissionId === previewSubmissionId)

  useEffect(() => {
    if (previewSubmissionId == null || listLoading) {
      return
    }
    const exists = listRows.some((r) => r.submissionId === previewSubmissionId)
    if (tab !== 'list' || !exists) {
      setPreviewSubmissionId(null)
    }
  }, [previewSubmissionId, listRows, tab, listLoading])

  function goListTab() {
    setListLoading(true)
    setListError(null)
    setTab('list')
  }

  return (
    <div className="classroom">
      <section className="classroom-hero" aria-label="班级作品区介绍">
        <div>
          <p className="classroom-kicker">Classroom Gallery</p>
          <h1 className="classroom-title">班级作品展示墙</h1>
          <p className="classroom-desc">
            上传优秀作品，给喜欢的内容投票，排行榜将按票数实时更新。
          </p>
        </div>
        <div className="classroom-stats" aria-hidden="true">
          <div className="classroom-stat">
            <span className="classroom-stat-key">当前作品</span>
            <span className="classroom-stat-value">{listRows.length}</span>
          </div>
          <div className="classroom-stat">
            <span className="classroom-stat-key">每人可投</span>
            <span className="classroom-stat-value">{VOTES_PER_USER} 票</span>
          </div>
        </div>
      </section>
      {isAdmin ? (
        <nav className="classroom-nav" aria-label="班级功能">
          <button
            type="button"
            className={tab === 'upload' ? 'tab active' : 'tab'}
            onClick={() => setTab('upload')}
          >
            上传作品
          </button>
          <button
            type="button"
            className={tab === 'list' ? 'tab active' : 'tab'}
            onClick={goListTab}
          >
            班级列表
          </button>
        </nav>
      ) : null}
      <section className="classroom-body" aria-live="polite">
        {tab === 'upload' ? (
          <div className="classroom-pane classroom-pane--upload">
            <UploadWorkPanel
              onSubmitted={() => {
                bumpList()
                goListTab()
              }}
            />
          </div>
        ) : previewSubmissionId != null ? (
          previewRow != null ? (
            <SubmissionPreviewPage
              row={previewRow}
              onBack={() => setPreviewSubmissionId(null)}
            />
          ) : (
            <div className="submission-preview-missing classroom-pane">
              <p className="panel-empty">该作品已不存在或已被删除。</p>
              <button
                type="button"
                className="ux-action-btn ux-action-btn--primary"
                onClick={() => setPreviewSubmissionId(null)}
              >
                返回列表
              </button>
            </div>
          )
        ) : (
          <div className="classroom-list-with-leaderboard">
            <div className="classroom-list-main classroom-pane">
              <ClassSubmissionsList
                refreshKey={listRefreshKey}
                onListMutated={bumpList}
                onOpenPreview={(id) => setPreviewSubmissionId(id)}
                submissions={listRows}
                submissionsLoading={listLoading}
                submissionsError={listError}
              />
            </div>
            <VoteLeaderboardPanel
              rows={listRows}
              loading={listLoading}
              error={listError}
            />
          </div>
        )}
      </section>
    </div>
  )
}
