## Why

班级列表虽已在每条卡片上标了得票，但要在**整班范围内**一眼看出「谁领先」仍不直观。在「班级列表」视图旁增加**按票数从高到低**的排行榜，可降低扫视成本，并与现有服务端 `voteCount` 数据对齐，无需新增计票逻辑。

## What Changes

- 在用户查看**班级列表**的布局中，于列表**右侧**增加一块固定的「排行榜」区域（桌面宽屏并排；窄屏下允许改为列表下方堆叠，见 `design.md`）。
- 排行榜列出**每一件**当前班级列表中的作品（与列表数据源一致），按 **`voteCount` 降序**排列；同票时采用稳定次序规则（在 `design.md` / spec 中定稿，例如再按 `createdAt` 降序）。
- 每一行至少展示：**名次**、**作品可读名称**（与列表主标题一致：`displayTitle` 回退 `originalFileName`）、**票数**；可选展示作者（若设计采纳）。
- **非目标**：跨页分页、历史快照、仅 Top N 截断（首版应展示**全部**作品）；独立排行榜 API（首版用现有列表数据即可）。

## Capabilities

### New Capabilities

- （无）

### Modified Capabilities

- `class-voting`: 增加「班级列表旁票数排行榜」的展示与排序需求（与现有票数权威来源一致）。

## Impact

- **前端**：`LoggedInClassroom` 布局、`ClassSubmissionsList` 与排行榜的数据衔接（或父级统一拉取列表）、`App.css` 响应式栅格。
- **API**：无变更（沿用 `GET /submissions` 的 `voteCount` 等字段）。
- **无障碍**：排行榜区域需有标题/landmark，避免仅依赖颜色传达名次。
