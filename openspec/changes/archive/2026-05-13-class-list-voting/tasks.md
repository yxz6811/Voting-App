## 1. 选票存储与一致性

- [x] 1.1 定义 `localStorage` 键与 JSON 结构（`voterStudentId`、`votedSubmissionId`），实现读取/写入/清除
- [x] 1.2 恢复选票时校验 `voterStudentId` 与当前登录 `studentId` 一致，否则忽略存储
- [x] 1.3 在班级列表加载完成后执行孤儿票清理：若 `votedSubmissionId` 不在当前提交列表中则清除持久化

## 2. 投票规则与 API

- [x] 2.1 封装「尝试投票」逻辑：未登录拒绝；本人作品（`uploaderStudentId === user.studentId`）拒绝
- [x] 2.2 无在投记录时直接写入选票；已有在投且目标不同则进入改投确认流（取消不改、确认切换）
- [x] 2.3 同目标重复触发不产生改投确认且不改变存储（幂等）

## 3. UI 与列表集成

- [x] 3.1 在 `ClassSubmissionsList`（或等价列表）每条他人作品上增加投票入口；本人作品展示不可投状态
- [x] 3.2 实现阻断式确认弹窗（`confirm` 或自定义 Modal），中文文案说明将取消原投票并改投新作品
- [x] 3.3 当前在投作品在列表中高亮或标签展示「已投票」

## 4. 验收

- [x] 4.1 按 `specs/class-voting/spec.md` 自测：未登录、自投、首投、改投取消/确认、同票重复、换账号隔离、孤儿票、刷新后保持
- [x] 4.2 `npm run build` 通过
