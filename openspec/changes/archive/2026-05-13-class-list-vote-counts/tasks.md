## 1. 服务端：投票存储与聚合

- [x] 1.1 在 `VOTING_DATA_DIR` 下实现 `votes.json`（或设计稿等价）的读写：结构为 `voterStudentId` → `votedSubmissionId`，写入采用临时文件 + `rename` 保证原子性。
- [x] 1.2 实现 `PUT /votes`（或 `POST /votes`）接口：校验 UUID、目标 `meta.json` 存在、禁止自投；成功则 upsert 映射。
- [x] 1.3 扩展 `GET /submissions`：为每条 meta 增加 `voteCount`（整数，默认 0），由当前 `votes.json` 聚合计算。
- [x] 1.4 在删除作品 `DELETE /submissions/:id` 成功后，从 `votes.json` 中移除所有指向该 `submissionId` 的选票映射（避免脏键）；必要时在文档中说明与孤儿票一致。

## 2. 前端：列表展示与写票

- [x] 2.1 扩展 `ClassSubmissionRecord` / `listSubmissionsDesc` 解析 `voteCount`；在 `SubmissionRow`（或等价）每条卡片上展示「票数」或「N 票」。
- [x] 2.2 用户点击投票或确认改投成功后，调用服务端写票 API，并刷新列表或合并返回的 tallies，使 UI 与 `vote-tally` 一致；保留与现有改投确认弹窗的衔接。
- [x] 2.3 处理 API 错误（自投、目标不存在、网络）：不破坏既有 `class-voting` 的交互，错误文案可读。

## 3. 验收

- [x] 3.1 双浏览器或无痕窗口：A、B 两用户分别投同一作品，两窗刷新后该作品票数均为 2；改投后旧作减、新作加。
- [x] 3.2 删除得票作品后，对应票数从列表消失且 `votes.json` 无指向已删 ID 的映射。
