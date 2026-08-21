# dtrPicker

> 一个流式日期/时间范围选择器组件，基于 SVG 渲染，专注于轻量、流畅与可定制。

<!-- 截图：运行 `node server.js` 后打开 http://localhost:16800/，截取选择器弹出界面，保存为 docs/screenshots/picker.png -->
![选择器弹出界面](docs/screenshots/picker.png)

---

## 功能特性

- **四种选择模式** — `date` / `dateTime` / `dateRange` / `dateTimeRange`
- **SVG 渲染** — 像素级精确控制，CSS 隔离，不依赖外部 UI 框架
- **虚拟滚动** — 日历面板流畅翻页，支持滚轮与拖拽浏览
- **国际化** — 内置多语言包（简体中文、英语、日语等），BCP 47 语言标签
- **多色系** — 莫兰迪 / 自然 / 海天蓝 / 森林绿 / 星夜黑，支持自定义颜色覆盖
- **TypeScript 支持** — 完整类型声明
- **零运行时依赖** — 仅构建时依赖 esbuild

---

## 快速开始

```js
import dtrPicker from 'dist/dtrpicker.js';

const picker = new dtrPicker('#my-input', {
  mode: 'dateRange',
});

picker.onChange((value, meta) => {
  console.log('选中值:', value);
  console.log('变更来源:', meta.source, '动作:', meta.action);
});
```

> 详细 API 参考请见 [`docs/api-spec.md`](docs/api-spec.md)。

---

## API 概览

### 构造

```js
const picker = new dtrPicker(trigger, options);
```

| 参数 | 说明 |
| --- | --- |
| `trigger` | 触发器元素或其 CSS 选择器，作为面板锚点与点击开关 |
| `options.mode` | **必填**。`'date'` / `'dateTime'` / `'dateRange'` / `'dateTimeRange'` |
| `options.locale` | BCP 47 语言标签（`'zh-CN'` / `'en-US'` / `'ja-JP'`），空串自动检测浏览器语言 |
| `options.firstDay` | 周起始日：`0`=周日，`1`=周一 |
| `options.colorScheme` | 色系：`'morandi'` / `'nature'` / `'ocean'` / `'forest'` / `'night'` |
| 颜色选项 | `selectedColor`、`gridColor`、`textColor` 等，可逐项覆盖 |

### 方法

| 方法 | 说明 |
| --- | --- |
| `open()` / `close()` / `toggle()` | 打开 / 关闭 / 切换面板 |
| `setValue(value)` | 程序化设置选中值（`{start, end}`） |
| `getValue([format])` | 读取值：`'string'`（默认）/ `'date'` / `'object'` |
| `clear([silent])` | 清除选中值，`silent=true` 时不触发回调 |
| `onChange(cb)` | 监听值变更，回调 `(value, meta)` |
| `onOpen(cb)` / `onClose(cb)` | 面板生命周期回调 |
| `destroy()` | 销毁实例并清理 DOM |

### 多实例

`mode` 在构造后不可更改。同一页面需要不同模式 / 语言时，创建多个实例即可，支持同一 trigger 绑定多个实例。

---

## 构建

```bash
npm run build
```

输出在 `dist/` 目录。

---

## 本地演示

```bash
node server.js
# 访问 http://localhost:16800/
```

---

## 技术栈

| 层面 | 技术 |
| --- | --- |
| 语言 | JavaScript (ES Module) |
| 渲染 | SVG |
| 构建 | esbuild |
| 类型 | TypeScript (类型声明) |
| 运行时 | 浏览器 (无 Node.js 依赖) |

---

## 许可

MIT
