## Context

- 班级作品列表来自集中式 `GET /submissions`；投票 UI 与「在投」状态依赖 `voteStorage`（localStorage，键 `vote_app.cast_vote.v1`），**仅本浏览器**可见，无法汇总全班。
- 生产环境通过 Nginx 将 `/voting-app-api/` 反代到 Node `server.mjs`；数据根 `VOTING_DATA_DIR` 下按 UUID 目录存作品与 `meta.json`。
- 删除作品已有 `DELETE /submissions/:id`；`reconcileVoteWithSubmissions` 在列表不含被投 ID 时会清本地票。

## Goals / Non-Goals

**Goals:**

- 每条作品在列表中展示**全班聚合**得票数（整数 ≥ 0）。
- 投票、改投后计数正确变化；删除作品后票数不再计入已删作品。
- 首版沿用与上传/删除相同的**学号自声明**信任模型（不作新鉴权体系）。

**Non-Goals:**

- WebSocket 实时推送、防协同刷票、区块链审计。
- 历史投票时间线、按用户导出明细。

## Decisions

1. **权威数据源**：在 `VOTING_DATA_DIR` 下增加**单一 JSON 文件**（例如 `votes.json`）存储 `voterStudentId → votedSubmissionId` 映射；聚合时扫描映射按 `votedSubmissionId` 计数。备选：每 submission 目录内 `votes.txt`——拒绝，因改投需跨条目更新一处映射更简单。
2. **API 形状**（与现有 Express 风格一致）：
   - `PUT /votes`（或 `POST /votes/cast`）body：`{ voterStudentId, votedSubmissionId }`，服务端校验目标作品存在且 `uploaderStudentId !== voterStudentId`，然后 upsert 映射并返回 `{ ok: true }` 或可选 `{ tallies: { [id]: number } }`。
   - `GET /votes/tallies` 返回 `{ tallies: { "<submissionId>": number, ... } }`（仅含票数 >0 的 id，或显式含 0——见实现约定）；列表接口亦可扩展为 `GET /submissions` 每条 meta 带 `voteCount`——**推荐扩展 `GET /submissions` 响应**，减少前端往返，在 `listSubmissionsDesc` 映射到 `voteCount` 字段。
3. **前端迁移**：投票成功后除更新本地 UI 状态外，**调用服务端写入**；`GET /submissions` 已带 `voteCount` 时，卡片直接渲染；本地 `persistVote` 可保留作乐观 UI 与离线降级，或简化为「仅服务端」——首版推荐 **写服务端 + 刷新列表或合并 tallies**，本地仍可用于「当前用户投给谁」的高亮，直至完全以服务端返回「当前用户一票」为准（若不在首版返回 `myVoteSubmissionId`，可继续用 localStorage 仅作本机高亮，以服务端为计数权威）。
4. **并发**：`votes.json` 读写使用「读-改-写」+ 简单文件锁或 `fs.writeFile` 原子替换（先写临时文件再 `rename`），避免并发撕裂；低并发场景可接受。

## Risks / Trade-offs

- **[Risk] 并发写 votes.json** → 临时文件 + `rename`、重试有限次；极端冲突时返回 409 由前端重试。
- **[Trade-off] 信任学号** → 与现有一致；缓解仅限演示/内网。
- **[Risk] 与纯本地旧数据不一致** → 部署后首次打开以服务端为准；可选一次性提示用户「票数已汇总到服务器」。

## Migration Plan

1. 部署带 `votes.json` 与扩展列表/投票 API 的新 `server.mjs`。
2. 部署新前端：依赖新字段；旧前端忽略 `voteCount` 仍可运行但无数显示。
3. 回滚：回退 API 与前端；`votes.json` 可保留以免丢数据。

## Open Questions

- `GET /submissions` 是否在 meta 中内联 `voteCount`（推荐） versus 独立 `GET /votes/tallies`：实现阶段二选一，默认内联以减少请求。
