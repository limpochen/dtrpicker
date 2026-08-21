# Changelog

本文件记录 dtrPicker 各版本的变更。版本号遵循 `.github/copilot-instructions.md` 的递增规则：
问题修复 / 行级调整 +0.0.1，功能增强 / 模块级调整 +0.1.0，重大变更主版本 +1。

## [2.1.10] - 2026-08-21

### 修复

- 修复单日期模式（`date` / `dateTime`）下第二次点击不同日期时，误走「同天范围 → 扩展」
  逻辑，导致 UI 呈现日期范围选择、而选中值不更新的问题。
  现单日期模式点击即替换选中日期，`end` 恒为 `null`。
  涉及文件：`src/utils/datetime-value.js` → `handleDateClick()`
- 修复 `DateTime.parse` 对 `YYYY-MM-DD HH:mm` 时间字符串依赖 `new Date(string)`、
  Safari 解析失败导致时间丢失的兼容隐患。现补充按本地时间构造的正则解析分支。
  涉及文件：`src/utils/date.js` → `static parse()`
- 修正泰文（th-TH）「小时」翻译：`'น.'` → `'ชม.'`（涉及 `src/config/i18n.js`）。

### 变更

- 放弃阿拉伯语（ar-SA）支持：移除 `src/config/i18n.js` 中的 `ar-SA` 语言包
  （RTL 布局未适配，暂不支持；demo 本无该语言）。
- `header-bar-cell.js`：创建 `<stop>` 复用 `this.g.svgNS`（替代硬编码 namespace）。

### 维护

- 更新 `src/config/dimensions.js` 头注释（去除已移除的 HTML+CSS 模式描述）。
- 兜底代码与死代码/冗余：保持现状并补充注释提醒（详见 `docs/一扫问题.md` 二、三）。
- 轻微项处理（详见 `docs/一扫问题.md` 五）：
  - `dtrpicker.destroy()` 补清 `_onOpenCallbacks` / `_onCloseCallbacks`。
  - `color.js`、`time-cell.js`：补充注释提醒。
- 版本号全项目统一为 `2.1.10`（以 `package.json` 为准；同步各源文件头注释、`DIM.VERSION`、`index.html`、`package-lock.json`）。
- 修正对外文档/声明与代码一致：`docs/api-spec.md`、`src/dtrpicker.d.ts`、`README.md` 清除过时的 `renderMode` / `zIndex` / `selecting` / UMD 说明，`locale` 默认值更正为自动检测，更新引入路径与色系说明。
