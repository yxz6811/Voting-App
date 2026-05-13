## 1. 数据与排序

- [x] 1.1 实现纯函数 `sortSubmissionsByVoteLeaderboard(rows: ClassSubmissionRecord[]): ClassSubmissionRecord[]`（或等价），规则：`voteCount` 降序 → `createdAt` 降序 → `submissionId` 升序；附 JSDoc。
- [x] 1.2 在 `LoggedInClassroom`（或抽出的 hook）于「班级列表」tab、`listRefreshKey` 变化时**单次** `listSubmissionsDesc()`，将结果传给列表与排行榜子组件。

## 2. UI 与布局

- [x] 2.1 新增 `VoteLeaderboardPanel`（或等价）：标题、有序列表/表格、每行名次 + `submissionDisplayLabel(row)` + 票数；侧栏 `max-height` + 内部滚动（作品多时）。
- [x] 2.2 `LoggedInClassroom` 在 `tab === 'list'` 时使用两列布局（CSS：`grid`/`flex` + 断点堆叠）；左侧保留现有 `ClassSubmissionsList`，右侧为排行榜。
- [x] 2.3 调整 `ClassSubmissionsList`：改为接收父级传入的作品数组与加载/错误状态（或共享 hook），行为与现有一致（投票、删除、`refreshKey`）。

## 3. 验收

- [x] 3.1 多作品不同票数：排行榜顺序与规则一致；改投后刷新两侧一致。
- [x] 3.2 窄屏：排行榜仍可见且可滚动，无横向布局死锁。
