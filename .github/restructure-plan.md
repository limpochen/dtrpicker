# 目录结构调整方案（待实施）

HTML 渲染模式已移除，`renderers/svg/` 已上移至 `renderers/`，但**完整的 OOP 对齐重构尚未实施**。

---

## 一、当前结构（已清理 HTML 后）

```
dtrpicker/
└── dtrpicker/
    ├── dtrpicker.js
    ├── dtrpicker.d.ts
    ├── config/
    ├── state/
    │   └── pickerstate.js
    ├── utils/
    │   ├── color.js
    │   ├── date.js
    │   └── dragcontroller.js
    └── renderers/          ← 仅剩渲染器，仍用 renderers 命名
        ├── index.js
        ├── cell.js
        ├── day-cell.js
        ├── drawing-area.js
        ├── ...
        └── time-wheel.js
```

## 二、目标结构（OOP 对齐，全小写 + 连字符）

```
dtrpicker/
└── dtrpicker/
    ├── index.js             ← 入口（import/export 汇聚）
    ├── dtrpicker.js         ← 主类
    ├── dtrpicker.d.ts
    │
    ├── config/              ← 纯常量，不动
    ├── state/
    │   └── picker-state.js  ← 文件名对齐类名（可选）
    │
    ├── utils/               ← 仅保留纯函数
    │   ├── color.js
    │   └── date.js
    │
    ├── services/            ← 有状态的服务/管理类（新增）
    │   └── drag-controller.js ← 从 utils/ 移入
    │
    └── renderers/           ← 渲染层（保留原名）
        ├── svg-renderer.js  ← 类: SvgRenderer（从 index.js 改名）
        ├── cells/           ← Cell 继承体系子目录
        │   ├── cell.js
        │   ├── day-cell.js
        │   ├── month-cell.js
        │   ├── year-cell.js
        │   ├── header-cell.js
        │   ├── header-bar-cell.js
        │   ├── time-cell.js
        │   └── title-bar-cell.js
        ├── drawing-area.js
        ├── cell-manager.js
        └── time-wheel/      ← TimeWheel 子模块（有附属浮层）
            ├── time-wheel.js
            └── time-wheel-floater.js
```

## 三、需要更新的 import 路径

| 文件 | 旧路径 | 新路径 |
|------|--------|--------|
| `dtrpicker/dtrpicker.js` | `'./renderers/index.js'` | `'./renderers/svg-renderer.js'` |
| `renderers/svg-renderer.js` | `'../config/xxx'` | `'../config/xxx'`（不变） |
| `renderers/svg-renderer.js` | `'../utils/dragcontroller.js'` | `'../services/drag-controller.js'` |
| `renderers/svg-renderer.js` | `'./cell.js'` | `'./cells/cell.js'` |
| `renderers/svg-renderer.js` | `'./day-cell.js'` | `'./cells/day-cell.js'` |
| `renderers/svg-renderer.js` | `'./drawing-area.js'` | `'./drawing-area.js'`（同级） |
| `renderers/svg-renderer.js` | `'./cell-manager.js'` | `'./cell-manager.js'`（同级） |
| `renderers/svg-renderer.js` | `'./time-wheel.js'` | `'./time-wheel/time-wheel.js'` |
| `renderers/cells/cell.js` | `'../config/colors.js'` | `'../../config/colors.js'`（深一层） |
| `renderers/cells/month-cell.js` | `'../utils/color.js'` | `'../../utils/color.js'`（深一层） |
| `renderers/cells/year-cell.js` | `'../utils/color.js'` | `'../../utils/color.js'`（深一层） |
| `renderers/cells/*.js` 引用 Cell | `'./cell.js'` | `'./cell.js'`（同级，不变） |
| `renderers/time-wheel/time-wheel.js` | `'./time-cell.js'` | `'../cells/time-cell.js'` |
| `renderers/time-wheel/time-wheel.js` | `'./title-bar-cell.js'` | `'../cells/title-bar-cell.js'` |
| `renderers/time-wheel/time-wheel.js` | `'./time-wheel-floater.js'` | `'./time-wheel-floater.js'`（同级） |

## 四、实施顺序建议

```
Step 1  新增 renderers/cells/、renderers/time-wheel/ 子目录
Step 2  新增 services/     → drag-controller.js 从 utils/ 移入
Step 3  重命名 index.js    → svg-renderer.js
Step 4  更新全部 import 路径  → 约 15 处
Step 5  删除空的 utils/dragcontroller.js
```
