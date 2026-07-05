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

---

## 三、逐步骤执行方案

### ⚠ 核心原则

1. **文件操作只用 shell `cp`/`mv`/`mkdir`，绝不让 AI 重写文件内容**
2. **import 路径修改只用精确的旧→新字符串替换，一次只改一处**
3. **每完成一个阶段立即构建验证，发现问题立刻回退**
4. **旧文件在全部验证通过前绝不删除**

---

### 阶段 0：备份

```powershell
# 创建整个 dtrpicker/ 的完整备份
Copy-Item -Recurse -Path dtrpicker -Destination dtrpicker.BACKUP
```

> **验证**：检查 `dtrpicker.BACKUP/` 目录存在且包含所有文件

---

### 阶段 1：创建目标目录

```powershell
mkdir dtrpicker/renderers/cells
mkdir dtrpicker/renderers/time-wheel
mkdir dtrpicker/services
```

> **验证**：三个空目录已存在

---

### 阶段 2：复制文件到新位置（共 11 个文件）

**原则：只 `cp` 不 `mv`，原位置文件保留不动。**

```powershell
# cells/ 子目录 — 8 个 Cell 子类
cp dtrpicker/renderers/cell.js dtrpicker/renderers/cells/cell.js
cp dtrpicker/renderers/day-cell.js dtrpicker/renderers/cells/day-cell.js
cp dtrpicker/renderers/month-cell.js dtrpicker/renderers/cells/month-cell.js
cp dtrpicker/renderers/year-cell.js dtrpicker/renderers/cells/year-cell.js
cp dtrpicker/renderers/header-cell.js dtrpicker/renderers/cells/header-cell.js
cp dtrpicker/renderers/header-bar-cell.js dtrpicker/renderers/cells/header-bar-cell.js
cp dtrpicker/renderers/time-cell.js dtrpicker/renderers/cells/time-cell.js
cp dtrpicker/renderers/title-bar-cell.js dtrpicker/renderers/cells/title-bar-cell.js

# time-wheel/ 子目录 — 2 个文件
cp dtrpicker/renderers/time-wheel.js dtrpicker/renderers/time-wheel/time-wheel.js
cp dtrpicker/renderers/time-wheel-floater.js dtrpicker/renderers/time-wheel/time-wheel-floater.js

# services/ — 1 个文件
cp dtrpicker/utils/dragcontroller.js dtrpicker/services/drag-controller.js
```

> **验证**：每个新路径下文件存在，且与原始文件内容完全一致（可用 `fc` 命令逐对校验）

---

### 阶段 3：复制并重命名 `index.js` → `svg-renderer.js`

```powershell
cp dtrpicker/renderers/index.js dtrpicker/renderers/svg-renderer.js
```

> **验证**：`dtrpicker/renderers/svg-renderer.js` 已存在，内容与 `index.js` 一致

---

### 阶段 4：修改新文件的 import 路径（共 6 个文件、16 处修改）

**原则：每次替换必须是精确的旧字符串→新字符串，禁止 AI 臆测。**

#### 4a. 修改 `dtrpicker/renderers/svg-renderer.js`

**11 处替换：**

| # | 旧字符串 | 新字符串 |
|---|---------|---------|
| 1 | `import DragController from '../utils/dragcontroller.js';` | `import DragController from '../services/drag-controller.js';` |
| 2 | `import Cell from './cell.js';` | `import Cell from './cells/cell.js';` |
| 3 | `import DayCell from './day-cell.js';` | `import DayCell from './cells/day-cell.js';` |
| 4 | `import MonthCell from './month-cell.js';` | `import MonthCell from './cells/month-cell.js';` |
| 5 | `import YearCell from './year-cell.js';` | `import YearCell from './cells/year-cell.js';` |
| 6 | `import HeaderCell from './header-cell.js';` | `import HeaderCell from './cells/header-cell.js';` |
| 7 | `import HeaderBarCell from './header-bar-cell.js';` | `import HeaderBarCell from './cells/header-bar-cell.js';` |
| 8 | `import TimeCell from './time-cell.js';` | `import TimeCell from './cells/time-cell.js';` |
| 9 | `import TitleBarCell from './title-bar-cell.js';` | `import TitleBarCell from './cells/title-bar-cell.js';` |
| 10 | `import TimeWheel from './time-wheel.js';` | `import TimeWheel from './time-wheel/time-wheel.js';` |

> `import DrawingArea from './drawing-area.js';` 和 `import CellManager from './cell-manager.js';` **不需要修改**（同级目录不变）

#### 4b. 修改 `dtrpicker/renderers/cells/cell.js`

| # | 旧字符串 | 新字符串 |
|---|---------|---------|
| 11 | `import { getActiveScheme } from '../config/colors.js';` | `import { getActiveScheme } from '../../config/colors.js';` |

#### 4c. 修改 `dtrpicker/renderers/cells/month-cell.js`

| # | 旧字符串 | 新字符串 |
|---|---------|---------|
| 12 | `import { saturateColor, blendColors } from '../utils/color.js';` | `import { saturateColor, blendColors } from '../../utils/color.js';` |

#### 4d. 修改 `dtrpicker/renderers/cells/year-cell.js`

| # | 旧字符串 | 新字符串 |
|---|---------|---------|
| 13 | `import { saturateColor } from '../utils/color.js';` | `import { saturateColor } from '../../utils/color.js';` |

#### 4e. 修改 `dtrpicker/renderers/time-wheel/time-wheel.js`

| # | 旧字符串 | 新字符串 |
|---|---------|---------|
| 14 | `import TimeCell from './time-cell.js';` | `import TimeCell from '../cells/time-cell.js';` |
| 15 | `import TitleBarCell from './title-bar-cell.js';` | `import TitleBarCell from '../cells/title-bar-cell.js';` |

> `import TimeWheelFloater from './time-wheel-floater.js';` **不需要修改**（同在 time-wheel/ 目录下）

#### 4f. 验证

逐文件检查 import 行是否已按上表更新正确。

---

### 阶段 5：修改 `dtrpicker.js` 的入口导入

修改 `dtrpicker/dtrpicker.js` 第 12 行：

| 旧字符串 | 新字符串 |
|---------|---------|
| `import SvgRenderer from './renderers/index.js';` | `import SvgRenderer from './renderers/svg-renderer.js';` |

> **验证**：此步完成后，`dtrpicker.js` 不再依赖 `renderers/index.js`

---

### 阶段 6：创建顶层入口 `index.js`（可选）

如果方案要求顶层入口，创建 `dtrpicker/index.js`：

```js
export { default } from './dtrpicker.js';
```

> **验证**：文件存在，内容正确

---

### 阶段 7：构建验证

```powershell
node build.js
```

**验证标准：**
- [ ] 构建成功（esbuild 无报错）
- [ ] 打开浏览器 http://localhost:16800/ → 选择"开发代码"模式
- [ ] 标题栏背景色渐变正常
- [ ] "回到今天"按钮显示
- [ ] 日期可选中
- [ ] 时分条可滚动
- [ ] 鼠标滚轮日历滚动方向正确
- [ ] 拖动日历区滚动流畅
- [ ] 休息日颜色位置正确
- [ ] 切换到"打包代码"模式，以上各项同样正常

> **如果任何一项失败 → 立即回退：**
> ```powershell
> Remove-Item -Recurse -Force dtrpicker
> Copy-Item -Recurse -Path dtrpicker.BACKUP -Destination dtrpicker
> ```

---

### 阶段 8：清理旧文件（仅阶段 7 全部通过后执行）

```powershell
# 删除已移到 cells/ 的旧文件
Remove-Item dtrpicker/renderers/cell.js
Remove-Item dtrpicker/renderers/day-cell.js
Remove-Item dtrpicker/renderers/month-cell.js
Remove-Item dtrpicker/renderers/year-cell.js
Remove-Item dtrpicker/renderers/header-cell.js
Remove-Item dtrpicker/renderers/header-bar-cell.js
Remove-Item dtrpicker/renderers/time-cell.js
Remove-Item dtrpicker/renderers/title-bar-cell.js

# 删除已移到 time-wheel/ 的旧文件
Remove-Item dtrpicker/renderers/time-wheel.js
Remove-Item dtrpicker/renderers/time-wheel-floater.js

# 删除旧的 index.js（已被 svg-renderer.js 替代）
Remove-Item dtrpicker/renderers/index.js

# 删除旧的 utils/dragcontroller.js（已移到 services/）
Remove-Item dtrpicker/utils/dragcontroller.js

# 删除备份
Remove-Item -Recurse -Force dtrpicker.BACKUP
```

> **验证**：再次运行 `node build.js`，确认构建成功

---

## 四、各文件不需要改动的 import 验证清单

以下 import 路径在重构后仍然正确，**不允许改动**：

| 文件 | import 路径 | 理由 |
|-----|------------|------|
| `dtrpicker/dtrpicker.js` | `'./config/colors.js'` | 同级目录不变 |
| `dtrpicker/dtrpicker.js` | `'./config/i18n.js'` | 同级目录不变 |
| `dtrpicker/dtrpicker.js` | `'./state/pickerstate.js'` | 同级目录不变 |
| `dtrpicker/renderers/svg-renderer.js` | `'../config/colors.js'` | 相对 `renderers/` 不变 |
| `dtrpicker/renderers/svg-renderer.js` | `'../config/dimensions.js'` | 同上 |
| `dtrpicker/renderers/svg-renderer.js` | `'../utils/color.js'` | 同上 |
| `dtrpicker/renderers/svg-renderer.js` | `'../utils/date.js'` | 同上 |
| `dtrpicker/renderers/svg-renderer.js` | `'./drawing-area.js'` | 同级不变 |
| `dtrpicker/renderers/svg-renderer.js` | `'./cell-manager.js'` | 同级不变 |
| `dtrpicker/cells/*.js` | `'./cell.js'` | 同在 cells/ 目录下不变 |
| `dtrpicker/state/pickerstate.js` | `'../utils/date.js'` | 相对 `state/` 不变 |
| `dtrpicker/renderers/time-wheel/time-wheel.js` | `'./time-wheel-floater.js'` | 同在 time-wheel/ 目录不变 |
| `js/demo.js` | `'../dtrpicker/config/i18n.js'` | 相对 `js/` 不变 |
| `js/demo.js` | `'../dtrpicker/dtrpicker.js'` | 主入口路径不变 |
| `build.js` | entry: `dtrpicker/dtrpicker.js` | 入口路径不变 |

---

## 五、变更统计

| 指标 | 数量 |
|------|------|
| 新建目录 | 3 个（`cells/`、`time-wheel/`、`services/`） |
| 复制文件 | 12 次（11 个移入子目录 + 1 个改名） |
| import 路径修改 | 15 处（涉及 6 个文件） |
| 最终删除旧文件 | 12 个 |
| AI 禁止重写的文件 | 21 个源文件全部禁止重写 |
