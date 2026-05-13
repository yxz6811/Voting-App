import { useEffect, useState } from 'react'
import type { ClassSubmissionRecord } from '../types/classSubmission'
import { listSubmissionsDesc } from '../lib/submissionsDb'
import { ClassSubmissionsList } from './ClassSubmissionsList'
import { UploadWorkPanel } from './UploadWorkPanel'
import { VoteLeaderboardPanel } from './VoteLeaderboardPanel'

type ClassroomTab = 'upload' | 'list'

/**
 * 已登录后的班级区：上传与列表切换；列表与票数排行榜共用一次拉取。
 */
export function LoggedInClassroom() {
  const [tab, setTab] = useState<ClassroomTab>('upload')
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

  function goListTab() {
    setListLoading(true)
    setListError(null)
    setTab('list')
  }

  return (
    <div className="classroom">
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
      <section className="classroom-body" aria-live="polite">
        {tab === 'upload' ? (
          <UploadWorkPanel
            onSubmitted={() => {
              bumpList()
              goListTab()
            }}
          />
        ) : (
          <div className="classroom-list-with-leaderboard">
            <div className="classroom-list-main">
              <ClassSubmissionsList
                refreshKey={listRefreshKey}
                onListMutated={bumpList}
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
