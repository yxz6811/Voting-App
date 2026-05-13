## Context

- 作品列表与 `voteCount` 已由 `listSubmissionsDesc()` 提供；投票写入服务端后 `refreshKey` 会触发重载。
- 「班级列表」标签内容由 `LoggedInClassroom` + `ClassSubmissionsList` 渲染。

## Goals / Non-Goals

**Goals:**

- 桌面视窗下「列表在左、排行榜在右」；排行榜与列表**同一数据源**的排序视图（票数降序 + 稳定 tie-break）。
- 排行榜与主列表在**同一次加载周期**内数据一致（同一 `refreshKey` 触发下，不出现一个已更新另一个仍旧的状态）。

**Non-Goals:**

- 新 REST 资源；服务端聚合变更；仅展示 Top 3。

## Decisions

1. **排序规则**：主键 `voteCount` 降序；若相等，则按 `createdAt` **降序**（较新作品靠前）；若仍相等（极少），再按 `submissionId` 字典序升序作为最终稳定键。
2. **数据获取**：首版在父组件 `LoggedInClassroom` 于 `tab === 'list'` 时拉取一次 `listSubmissionsDesc()`，将结果以 props 传给 `ClassSubmissionsList` 与 `VoteLeaderboardSidePanel`（或等价命名），避免双请求与状态漂移；`ClassSubmissionsList` 内原有 `useEffect` 拉取改为**可选**「由父注入 `initialRows` / `rows`」或拆出 `useClassSubmissionsRows(refreshKey)` 共享——实现阶段二选一，以**单请求**为准绳。
3. **窄屏**：在 CSS `max-width` 断点以下改为**纵向**：上为原列表、下为排行榜（或反之），仍保持同一数据源。
4. **文案**：区域标题「票数排行榜」或「排行榜」；行内票数与列表用语一致（如「N 票」）。

## Risks / Trade-offs

- **[Risk] 父级提升状态导致 `ClassSubmissionsList` 改动面较大** → 用自定义 hook 或 context 封装拉取逻辑，保持组件可测。
- **[Trade-off] 作品很多时侧栏变长** → 侧栏 `max-height` + 内部滚动，避免挤压主列表视口（首版可接受）。

## Migration Plan

1. 仅部署前端；无 API 迁移。
2. 回滚：移除侧栏组件与布局样式即可。

## Open Questions

- 是否在排行榜行展示缩略图：首版不做以控范围。
