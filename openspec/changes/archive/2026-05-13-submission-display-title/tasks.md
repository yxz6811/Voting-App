## 1. 服务端

- [x] 1.1 在 `POST /submissions` 中读取表单字段 `displayTitle`（trim）；若缺失或为空则 **400** 并清理已建目录（与现有 `missing_fields` 行为一致）；合法则写入 `meta.json` 的 `displayTitle`。
- [x] 1.2 `GET /submissions` 返回的 JSON 中保留/包含 `displayTitle`（旧 meta 无该键时省略或由前端回退）。

## 2. 前端

- [x] 2.1 `UploadWorkPanel`：增加「作品名」输入框（标签清晰）、与选文件/上传流程衔接；提交前校验非空与长度。
- [x] 2.2 `submitClassSubmission`：`FormData.append('displayTitle', ...)`；服务端错误映射可读中文。
- [x] 2.3 扩展 `ClassSubmissionRecord` 与 `listSubmissionsDesc` 解析可选 `displayTitle`；`ClassSubmissionsList` / `SubmissionRow` 主展示行使用 `displayTitle ?? originalFileName`；`img` 的 `alt` 优先使用展示名。

## 3. 验收

- [x] 3.1 上传含中文文件名 + 自定义作品名，列表主行显示作品名而非乱码文件名。
- [x] 3.2 旧条目（无 `displayTitle`）列表仍显示 `originalFileName`，无崩溃。
