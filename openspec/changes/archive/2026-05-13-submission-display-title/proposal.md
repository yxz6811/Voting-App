## Why

班级列表元数据行目前展示 `originalFileName`；来自微信等渠道的**含中文或特殊编码的文件名**在部分环境下会以乱码（UTF-8 被误读为 Latin-1 等）呈现，影响辨识。允许用户在**上传时填写「作品名」**，并在列表中用该名称替代原先展示文件名的位置，可稳定提供可读标题，同时仍保留原始文件名供存储与排错。

## What Changes

- 在「上传作品」流程中增加**必填或强约束的文本框「作品名」**（具体必填/默认值与长度上限在 `design.md` / spec 中定稿）。
- 提交时将该字符串随作品一并写入**持久化元数据**（例如 `displayTitle` 字段），服务端 `meta.json` 与 `GET /submissions` 响应包含该字段。
- 班级列表每条卡片上，**原先展示 `originalFileName` 给用户看的位置**改为展示 `displayTitle`（若旧数据无该字段，则回退为 `originalFileName`，避免破坏已有条目）。
- **非目标**：上传后在线改作品名、富文本标题、多语言 slug；不在本变更中强制重传历史作品。

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `class-submissions`: 上传 UI 与元数据模型扩展「作品名」；列表展示规则改为优先展示作品名；服务端 `POST /submissions` 接收并校验该字段。

## Impact

- **前端**：`UploadWorkPanel`、`submitClassSubmission`（FormData 新字段）、`ClassSubmissionRecord` / `listSubmissionsDesc`、列表 `SubmissionRow` 文案绑定。
- **API**：`api/server.mjs` 在写入 `meta.json` 时增加字段；旧目录无该字段时列表逻辑回退。
- **OpenSpec 归档**：合并进 `openspec/specs/class-submissions/spec.md` 时需更新「Metadata fields (minimum)」或等效需求块。
