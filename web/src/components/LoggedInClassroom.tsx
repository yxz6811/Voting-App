import { useState } from 'react'
import { ClassSubmissionsList } from './ClassSubmissionsList'
import { UploadWorkPanel } from './UploadWorkPanel'

type ClassroomTab = 'upload' | 'list'

/**
 * 已登录后的班级区：上传与列表切换。
 */
export function LoggedInClassroom() {
  const [tab, setTab] = useState<ClassroomTab>('upload')
  const [listRefreshKey, setListRefreshKey] = useState(0)

  function bumpList() {
    setListRefreshKey((k) => k + 1)
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
          onClick={() => setTab('list')}
        >
          班级列表
        </button>
      </nav>
      <section className="classroom-body" aria-live="polite">
        {tab === 'upload' ? (
          <UploadWorkPanel
            onSubmitted={() => {
              bumpList()
              setTab('list')
            }}
          />
        ) : (
          <ClassSubmissionsList
            refreshKey={listRefreshKey}
            onListMutated={bumpList}
          />
        )}
      </section>
    </div>
  )
}
