## Context

- 上传使用 `multipart/form-data`：`file`、`uploaderDisplayName`、`uploaderStudentId`、`mediaKind`；`meta.json` 含 `originalFileName`（来自 `File.name`）。
- 列表 `SubmissionRow` 在「图片 / 视频 · {originalFileName} · N 票」中展示文件名，中文文件名在链路上易出现乱码。
- 班级作品 API 为单进程 Express，磁盘存储。

## Goals / Non-Goals

**Goals:**

- 上传前用户填写**作品展示名**（下称 `displayTitle`），校验后写入 `meta.json` 并随列表返回。
- 列表主标题行对用户展示 **`displayTitle`**，不再把 `originalFileName` 放在该主展示位（可保留为次要信息或仅用于 `alt`/调试，见实现）。
- 旧数据无 `displayTitle` 时列表**回退**为 `originalFileName`，行为与现网兼容。

**Non-Goals:**

- 上传后编辑作品名、管理员批量改名。
- 自动从 EXIF/文件名猜测标题。

## Decisions

1. **字段名**：使用 `displayTitle`（UTF-8 字符串），与 `originalFileName` 并存；`originalFileName` 仍写入，不改变既有投票/删除逻辑对 `submissionId` 的依赖。
2. **传输**：`POST /submissions` 增加表单字段 `displayTitle`（与现有 body 字段并列）；服务端 `trim` 后拒绝空字符串。
3. **长度与字符**：上限例如 **80 字符**（按 JS 字符串长度或 Unicode 码点二选一并写入 spec）；禁止仅空白；不强制 ASCII。
4. **上传 UI**：在「选择文件」前或同屏展示受控 `<input type="text">` 标签「作品名」；**选择文件后、提交前**若作品名为空则提示错误且不发起请求（或要求先填再选文件——实现选一种，默认：选文件后校验，提交前合并一步）。
5. **列表展示**：主行 `媒体类型 · {displayTitle ?? originalFileName} · 票数`；`<img alt>` 可用 `displayTitle` 优先。

## Risks / Trade-offs

- **[Risk] 用户滥用超长/刷屏标题** → 长度上限 + trim +（可选）单行 CSS `overflow`。
- **[Trade-off] 旧条目无 `displayTitle`** → 回退文件名，乱码问题仍存在直至重新上传或后续迁移工具（非本变更）。

## Migration Plan

1. 先部署 API（接受 `displayTitle`，旧客户端不传则服务端可用文件名回退写入：可选「服务端默认 `displayTitle = originalFileName`」以统一列表逻辑——设计倾向**仅新客户端传**，旧提交无字段则列表回退，避免批量改写 meta）。
2. 再部署前端；旧前端上传的作品无 `displayTitle`，列表回退。

## Open Questions

- 是否在列表次要位置仍显示「原始文件名」供技术用户排查：产品可选，默认可隐藏以简化界面。
