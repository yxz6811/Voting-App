## Context

- 班级作品由 `api/server.mjs` 以「每提交一个 UUID 目录 + `meta.json` + 媒体文件」形式落在磁盘；前端通过 `listSubmissionsDesc()` 拉列表、`submitClassSubmission` 上传。
- 列表组件 `ClassSubmissionsList` 已能识别本人条目（`isOwn`：`uploaderStudentId === user.studentId`），投票态由 `voteStorage.reconcileVoteWithSubmissions` 在加载列表时清理「指向已不存在作品的选票」。
- 当前 API **无**删除路由；信任模型与上传一致：客户端随请求携带学号/身份字段，服务端以 `meta.json` 中的 `uploaderStudentId` 比对（非强身份认证）。

## Goals / Non-Goals

**Goals:**

- 本人条目在 UI 上可发起删除，经确认后调用服务端删除对应目录，列表立即更新且刷新后不再出现。
- 服务端仅当 `meta.json` 中的 `uploaderStudentId` 与请求声明的学号一致时执行删除，否则返回 403（或 404，见决策）。
- 删除成功后释放对象 URL 等资源；若他人选票曾指向该作品，依赖既有 `reconcileVoteWithSubmissions` 在下次加载时清除孤儿票（无需在本变更中改选票 spec，除非验收要求显式文案）。

**Non-Goals:**

- 服务端会话/JWT、防伪造学号的强鉴权。
- 软删除、审计日志、管理员删除他人作品。

## Decisions

1. **HTTP 接口**：新增 `DELETE /submissions/:id`，请求体 JSON 或 query 携带 `uploaderStudentId`（与上传字段命名一致）。服务端读取 `meta.json`，比对一致则 `fs.rm` 整个提交目录；UUID 校验沿用现有 `UUID_RE`。
2. **错误语义**：目录不存在 → 404；存在但学号不匹配 → **403** `forbidden_not_owner`；便于前端区分「已删」与「无权」。
3. **前端**：在 `SubmissionRow`（或等价）对 `isOwn` 展示删除按钮 → 确认对话框 → 调用 `deleteSubmission(submissionId, studentId)` → 成功则触发与上传后相同的列表刷新（如提高 `refreshKey` 或局部 refetch）。
4. **与投票交互**：不新增选票 API；列表重载后 `reconcileVoteWithSubmissions` 自动清除指向已删作品的票。

## Risks / Trade-offs

- **[Risk] 学号可伪造** → 与当前上传模型一致；缓解仅限内网/演示场景，强安全需后续鉴权变更。
- **[Risk] 删除进行中重复点击** → 前端删除中禁用按钮或忽略重复提交。
- **[Trade-off] 物理删除** → 无法恢复；与 proposal 中非目标一致。

## Migration Plan

- 部署顺序：先部署带 `DELETE` 的 API，再部署依赖该路由的前端；旧前端无删除按钮，无破坏。
- 回滚：回退 API 路由与前端控件即可；已删除数据不可恢复。

## Open Questions

- 是否在删除确认文案中提示「若有人投过该作品，其选票将失效」：产品可选，默认可从简。
