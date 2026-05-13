/**
 * 当前登录用户（客户端会话），供上传/投票等模块读取。
 */
export interface CurrentUser {
  /** 展示用姓名（与表单「姓名」一致） */
  displayName: string
  /** 学号 */
  studentId: string
}
