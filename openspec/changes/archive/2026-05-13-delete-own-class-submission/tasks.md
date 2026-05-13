## 1. API：删除本人作品

- [x] 1.1 在 `api/server.mjs` 增加 `DELETE /submissions/:id`：校验 UUID，读取 `meta.json`，比对请求体中的 `uploaderStudentId` 与 meta 中字段；一致则 `fs.rm` 整个提交目录并返回 204 或 `{ ok: true }`；不一致返回 403；目录不存在返回 404。
- [x] 1.2 为删除路由补充与上传一致的 CORS/JSON 解析（若使用 `express.json()` 读取 body），并在本地用 curl 或脚本验证成功、非作者、不存在三种情况。

## 2. 前端：调用与状态

- [x] 2.1 在 `web/src/lib/submissionsDb.ts`（或同级合适模块）新增 `deleteClassSubmission(submissionId, uploaderStudentId)`，对 `${base}/submissions/:id` 发 `DELETE` 并携带 body/query，解析非 2xx 时抛出带语义的 `Error` 供 UI 展示。
- [x] 2.2 在 `ClassSubmissionsList`（含内联 `SubmissionRow`）为 `isOwn` 条目增加删除入口与确认对话框；确认后调用删除函数，成功后递增 `refreshKey` 或等价方式触发 `listSubmissionsDesc` 重载，并确保 `URL.createObjectURL` 在重载前按现有逻辑 revoke（若仍适用）。

## 3. 验收与规格对齐

- [x] 3.1 手动验证：`proposal.md` / `specs/class-submissions/spec.md` 中列出的场景（本人删除、取消、非本人无入口、未登录、错误提示、刷新后不再出现）。
- [x] 3.2 若存在他人对该作品的投票：删除后刷新列表，确认在投状态与 `reconcileVoteWithSubmissions` 行为符合 `design.md`（孤儿票清除）。
