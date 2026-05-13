import type { ClassSubmissionRecord } from '../types/classSubmission'

const DB_NAME = 'vote_app.submissions.v1'
const DB_VERSION = 1
const STORE = 'submissions'

/**
 * 打开班级作品 IndexedDB；升级时创建 object store。
 */
function openSubmissionsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'submissionId' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

/**
 * 写入一条提交记录（含 Blob）。
 *
 * @param row 完整记录
 */
export async function addSubmission(
  row: ClassSubmissionRecord,
): Promise<void> {
  const db = await openSubmissionsDb()
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'))
      tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'))
      tx.objectStore(STORE).add(row)
    })
  } finally {
    db.close()
  }
}

/**
 * 列出全部提交并按 `createdAt` 降序（新在前）。
 */
export async function listSubmissionsDesc(): Promise<ClassSubmissionRecord[]> {
  const db = await openSubmissionsDb()
  try {
    const rows = await new Promise<ClassSubmissionRecord[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const req = store.getAll()
      req.onsuccess = () => {
        const all = (req.result ?? []) as ClassSubmissionRecord[]
        all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        resolve(all)
      }
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'))
    })
    return rows
  } finally {
    db.close()
  }
}
