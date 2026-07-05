# 移除 HTML+CSS 渲染模式 — 完整回退方案

## 一、改动总览

| 类别 | 数量 | 涉及文件 |
|------|------|----------|
| 删除目录 | 1 | `dtrpicker/renderers/html/`（3 个文件） |
| 修改核心代码 | 1 | `dtrpicker/dtrpicker.js` |
| 修改类型声明 | 1 | `dtrpicker/dtrpicker.d.ts` |
| 修改构建脚本 | 1 | `build.js` |
| 修改 Demo 页面 | 2 | `index.html`、`js/demo.js` |
| 修改文档 | 1 | `docs/api-spec.md` |
| **总计** | **7 处** | |

---

## 二、分步操作

### Step 1 — 删除 HTML 渲染器目录

```
删除: dtrpicker/renderers/html/
  ├── index.js          (~500 行, HtmlRenderer 类)
  ├── panel.css         (~250 行, HTML 专属样式)
  └── time-floater.js   (~120 行, 时间浮层组件)
```

**影响**：无外部依赖，仅 `dtrpicker.js` 引用了此目录。

---

### Step 2 — 修改 `dtrpicker/dtrpicker.js`

#### 2.1 移除 import

```diff
- import HtmlRenderer from './renderers/html/index.js';
```

#### 2.2 简化渲染器注册表

```diff
  const RENDERERS = {
    svg: SvgRenderer,
-   html: HtmlRenderer,
  };
```

#### 2.3 移除 renderMode 校验层（关键简化！）

移除整个 `renderMode` 必选校验块（约第 65-71 行），改为 **直接 new SvgRenderer**：

```diff
- if (!options.renderMode) {
-   throw new Error('dtrPicker: "renderMode" is required (e.g. "svg")');
- }
- const RendererClass = RENDERERS[options.renderMode];
- if (!RendererClass) {
-   throw new Error('dtrPicker: unknown renderMode "' + options.renderMode + '"');
- }
+ // 仅支持 SVG 渲染（2026年起 HTML+CSS 模式已移除）
```

创建渲染器的行改为：

```diff
- this._renderer = new RendererClass(this);
+ this._renderer = new SvgRenderer(this);
```

#### 2.4 更新 JSDoc

```diff
- * @param {string} options.renderMode - 必选！渲染模式（如 'svg'）
+ * @param {string} [options.renderMode] - 已废弃，保留仅向后兼容，强制使用 SVG
- * @throws {Error} 缺少 renderMode 或 mode 或 trigger 无效时抛出
+ * @throws {Error} 缺少 mode 或 trigger 无效时抛出
```

移除 JSDoc 中对 HtmlRenderer 的引用：

```diff
- /** @type {SvgRenderer|HtmlRenderer} 渲染器实例 */
+ /** @type {SvgRenderer} 渲染器实例 */
```

#### 2.5 清理 `_positionDropdown()` 中的旧版渲染器降级分支

```diff
- // ── 支持 _applyScale 的渲染器（SVG / HTML）：CSS transform 缩放 ──
- if (typeof this._renderer._applyScale === 'function') {
    this._renderer._applyScale();
    const scaledW = this._renderer.SVG_W * this._renderer._scaleFactor;
    // ...
    return;
- }
-
- // ── 旧版渲染器（降级）：直接约束面板宽度 ──
- const availW = window.innerWidth - 10;
- // ...（可安全删除整个降级分支，因为 SVG 总有 _applyScale）
```

**性能优化效果**：每次 `_positionDropdown()` 调用省去一个 `typeof` 分支判断。

---

### Step 3 — 修改 `dtrpicker/dtrpicker.d.ts`

```diff
- export type RenderMode = 'svg' | 'html';
+ export type RenderMode = 'svg';

  export interface PickerOptions {
-   /** 渲染模式（必选） */
-   renderMode: RenderMode;
+   /** 渲染模式（默认 'svg'，'html' 已移除） */
+   renderMode?: RenderMode;
```

**效果**：`renderMode` 从必选变为可选，旧代码无需修改即可继续工作。

---

### Step 4 — 修改 `build.js`

```diff
- const cssSource = path.join(root, 'dtrpicker', 'renderers', 'html', 'panel.css');
- const cssDest = path.join(outdir, 'panel.css');
  // ...
- fs.copyFileSync(cssSource, cssDest);
```

**效果**：打包不再复制无用的 `panel.css`，减小 dist 体积。

---

### Step 5 — 修改 `index.html`

移除渲染模式切换的 radio 按钮：

```diff
- <div class="param-row">
-   <label data-i18n="renderModeLabel">Render Mode</label>
-   <label class="radio-label" data-i18n="renderModeSvg">
-     <input type="radio" name="param-renderMode" value="svg" checked> SVG
-   </label>
-   <label class="radio-label" data-i18n="renderModeHtml">
-     <input type="radio" name="param-renderMode" value="html"> HTML+CSS
-   </label>
- </div>
```

或者保留该行但只显示一个不可变的 SVG 标签（更美观）：

```diff
+ <div class="param-row">
+   <label>Render Mode</label>
+   <span class="static-value">SVG</span>
+ </div>
```

---

### Step 6 — 修改 `js/demo.js`

#### 6.1 移除 i18n 中的 HTML 相关键

```diff
  const demoI18n = {
    'zh-CN': {
-     renderModeLabel: '渲染模式',
-     renderModeSvg: 'SVG',
-     renderModeHtml: 'HTML+CSS',
    },
    'en-US': {
-     renderModeLabel: 'Render Mode',
-     renderModeSvg: 'SVG',
-     renderModeHtml: 'HTML+CSS',
    },
  };
```

#### 6.2 移除 renderMode 读取与事件绑定

```diff
- renderMode: document.querySelector('input[name="param-renderMode"]:checked').value,
+ renderMode: 'svg',  // 固定为 SVG

- document.querySelectorAll('input[name="param-renderMode"]')
-   .forEach(function (el) { el.addEventListener('change', applyParams); });
  // 整段删除
```

#### 6.3 简化 `generateCodeSnippet()`

```diff
- opts.push('  renderMode: "' + params.renderMode + '"');
+ // renderMode 不再需要显式指定，默认 SVG
```

---

### Step 7 — 修改 `docs/api-spec.md`

```diff
- | `options.renderMode` | `'svg' \| 'html'` | — | ✅ | 渲染模式 |
+ | `options.renderMode` | `'svg'` | `'svg'` | — | 渲染模式（'html' 已移除） |
```

文档中所有示例代码如果有 `renderMode: 'svg'` 可以保留（无害），或统一移除该参数。

---

## 三、性能优化效果

| 方面 | 优化前 | 优化后 | 收益 |
|------|--------|--------|------|
| 主包体积 | 含 HtmlRenderer ~500 行 | 不含 HtmlRenderer | **-~500 行代码** |
| 构建产物 | 含 `panel.css` | 不含 | **-~250 行 CSS** |
| import 链 | `dtrpicker.js` → 同时 import `SvgRenderer` + `HtmlRenderer` | 只 import `SvgRenderer` | **省去 1 次模块解析** |
| `_positionDropdown()` | 含 `typeof _applyScale` 分支判断 | 直接执行 | **省去 1 次条件分支** |
| `new dtrPicker()` 构造 | 需校验 `renderMode` + 查注册表 | 直接 `new SvgRenderer` | **省去 2 次判断 + 1 次对象查找** |
| 运行时内存 | 含从未使用的 HtmlRenderer 模块 | 不加载 | **省去 ~500 行闭包内存** |
| `open()` 路径 | `renderCalendar()` 需区分两个渲染器 | 单一 SVG 路径 | **省去多态分发开销** |

---

## 四、不保留兼容性 — 彻底斩断 renderMode 遗毒

### 4.1 `renderMode` 选项 — 移除，不留余地

不保留 `renderMode` 的解析。传入 `renderMode` 等价于传了一个无关属性，什么都不会发生。
没有任何警告、没有任何 fallback、没有任何兼容检测。不存在的选项不需要处理。

### 4.2 `_positionDropdown()` 降级分支 — 必须清理，不许遗漏

`_positionDropdown()` 中的旧版渲染器降级分支（`typeof this._renderer._applyScale !== 'function'` 的兜底逻辑）**必须一并删除**。SVG 渲染器始终有 `_applyScale`，该分支是死代码，留着只会混淆视听。彻底斩断，不许遗漏。

### 4.3 TypeScript 兼容

`PickerOptions.renderMode` 从必选变为可选，默认 `'svg'`。旧类型定义 `RenderMode = 'svg' | 'html'` 改为 `RenderMode = 'svg'`。
使用 `renderMode: 'html'` 的 TS 代码会报类型错误——要的就是这个效果，逼调用方升级。

### 4.4 旧调用代码怎么办？

```js
// 旧代码 — 照常工作，renderMode 被忽略
const p = new dtrPicker('#input', {
  renderMode: 'svg',
  mode: 'dateRange',
});

// 新代码（推荐）
const p = new dtrPicker('#input', {
  mode: 'dateRange',   // renderMode 已死
});
```

### 4.5 外部用户传 `renderMode: 'html'`

放心，没人会传 `'html'`。就算传了，直接被忽略，SVG 一把梭。

---

## 五、风险与回滚

| 风险 | 概率 | 应对 |
|------|------|------|
| `_positionDropdown` 降级分支清理遗漏 | 低 | **必须清理**，已在 4.2 明确要求，Code Review 逐行核查 |
| 其他文件引用了 `HtmlRenderer` | 极低 | 全局搜索已确认只有 `dtrpicker.js` 引用，删除前再确认一次 |
| 外部用户传 `renderMode: 'html'` | 零 | 没人会传。就算传了，属性被忽略，SVG 正常渲染，无任何影响 |

---

## 六、目录结构扁平化

### 6.1 现状问题

```
dtrpicker/                  ← 项目根
└── dtrpicker/              ← 库源码根
    ├── dtrpicker.js        ← 主入口
    ├── dtrpicker.d.ts
    ├── config/
    ├── state/
    ├── utils/
    └── renderers/
        ├── html/           ← 删除（Step 1）
        └── svg/            ← 仅剩的渲染器，白占一层
            ├── index.js
            ├── cell.js
            ├── day-cell.js
            └── ... (13 个文件)
```

`renderers/` 的存在意义是容纳多种渲染器。HTML 移除后只剩 SVG 一种，`renderers/svg/` 嵌套纯属冗余。

### 6.2 目标结构

```
dtrpicker/
└── dtrpicker/
    ├── index.js             ← was dtrpicker.js
    ├── index.d.ts           ← was dtrpicker.d.ts
    ├── config/
    ├── state/
    ├── utils/
    └── views/               ← was renderers/svg/，上升一层
        ├── index.js         ← SvgRenderer
        ├── cell.js
        ├── day-cell.js
        ├── month-cell.js
        ├── year-cell.js
        ├── header-cell.js
        ├── header-bar-cell.js
        ├── title-bar-cell.js
        ├── time-cell.js
        ├── drawing-area.js
        ├── cell-manager.js
        ├── time-wheel.js
        └── time-wheel-floater.js
```

### 6.3 路径深度对比

| 文件 | 改造前 | 改造后 | 减少 |
|------|--------|--------|------|
| SvgRenderer 入口 | `dtrpicker/renderers/svg/index.js` | `dtrpicker/views/index.js` | **少 2 层** |
| 各 Cell 组件 | `dtrpicker/renderers/svg/day-cell.js` | `dtrpicker/views/day-cell.js` | **少 2 层** |

### 6.4 需要更新的 import 路径

| 文件 | 旧路径 | 新路径 |
|------|--------|--------|
| `dtrpicker/dtrpicker.js` | `'./renderers/svg/index.js'` | `'./views/index.js'` |
| `views/*.js` 引用 config | `'../../config/xxx'` | `'../config/xxx'` |
| `views/*.js` 引用 utils | `'../../utils/xxx'` | `'../utils/xxx'` |
| `views/index.js` 引用同级文件 | `'./cell.js'` | 不变 |
| `build.js` 中 css 路径 | `'dtrpicker/renderers/html/panel.css'` | 已删除（Step 4） |

影响范围：**`dtrpicker.js` 1 处 + `views/` 内 5 处**（`index.js`、`cell.js`、`year-cell.js`、`month-cell.js` 的 `../../config/` 和 `../../utils/` 引用），共 6 处改动。

### 6.5 不动的内容

- `config/`、`state/`、`utils/` — 路径不变，不受影响
- `views/` 内部互相引用（`./cell.js`）— 不变
- `docs/api-spec.md` 中的示例代码路径 — 无需更新（引用的是库名，非内部路径）
- `.github/问题报告.md` 中的引用路径 — 属于历史记录，无需修改

---

## 七、实施顺序建议

```
Step 1  删除 renderers/html/ 目录
Step 2  修改 dtrpicker.js     → 移除 HtmlRenderer import, 简化渲染器逻辑
Step 3  修改 dtrpicker.d.ts   → renderMode 类型收窄
Step 4  修改 build.js         → 移除 panel.css 复制
Step 5  目录扁平化             → renderers/svg/ → views/, 更新 6 处 import
Step 6  修改 index.html       → Demo 页面移除 HTML 选项
Step 7  修改 demo.js          → Demo 逻辑简化
Step 8  修改 API 文档          → 文档同步
```
