import { useSyncExternalStore } from 'react'

function subscribeHash(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

function getHashRoute(): 'classroom' | 'feedback' {
  return window.location.hash === '#/feedback' ? 'feedback' : 'classroom'
}

/**
 * 已登录区内基于 `location.hash` 的简单路由：`#/feedback` 为反馈页，否则为班级区。
 */
export function useHashRoute(): 'classroom' | 'feedback' {
  return useSyncExternalStore(subscribeHash, getHashRoute, () => 'classroom')
}
