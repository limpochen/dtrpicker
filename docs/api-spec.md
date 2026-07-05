# dtrPicker — API 规范

> 版本: 3.3.0
> 本文件定义了 `dtrPicker` 作为可嵌入部件的对外接口。
> **核心原则**: 组件不关心 trigger 的样式、布局、placeholder 或表单集成——那些是调用方的职责。

---

## 1. 安装与引入

### ESM（推荐）

```js
import dtrPicker from 'dtrpicker/dtrpicker.js';
```

### UMD / IIFE（传统页面）

```html
<script src="dist/dtrpicker.umd.js"></script>
<script>
  const picker = new dtrPicker('#my-input', { renderMode: 'svg' });
</script>
```

---

## 2. Options（构造配置）

```js
const picker = new dtrPicker(trigger, options);
```

| 参数 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| `trigger` | `HTMLElement \| string` | — | ✅ | 触发器元素或其 CSS 选择器。组件用它作为面板定位锚点及点击切换面板。 |
| `options` | `Object` | `{}` | — | 配置对象 |
| `options.renderMode` | `'svg'` | `'svg'` | — | 渲染模式（'html' 已移除） |
| `options.mode` | `string` | — | ✅ | 选择模式：`'date'` / `'dateTime'` / `'dateRange'` / `'dateTimeRange'` |
| `options.yearMonthMode` | `'watermark' \| 'column'` | `'watermark'` | — | 年月显示方式：`'watermark'` 水印叠加 / `'column'` 单独列 |
| `options.locale` | `string` | `'en-US'` | — | BCP 47 语言标签：`'zh-CN'` `'en-US'` `'ja-JP'` 等 |
| `options.firstDay` | `0 \| 1` | `0` | — | 周起始日：`0`=周日, `1`=周一 |
| `options.colorScheme` | `string` | `'morandi'` | — | 色系：`'morandi'`(莫兰迪) / `'nature'`(自然) |
| `options.zIndex` | `number` | — | ✅ | 面板 z-index |
| `options.todayBarHeight` | `number` | `6` | — | 今日标记条高度（px） |
| `options.wheelStep` | `number` | `40` | — | 滚轮翻页步长系数 |

> ⚠️ `renderMode`、`mode`、`zIndex`、`yearMonthMode`、`locale`、`firstDay`、`colorScheme` **构造后不可更改**。

颜色选项：

| 参数 | 默认值（morandi） | 说明 |
| --- | --- | --- |
| `selectedColor` | `'#2f54eb'` | 选中/高亮色 |
| `selectedTextColor` | `'#ffffff'` | 选中态文字色 |
| `gridColor` | `'#d0d0d0'` | 网格线色 |
| `cellColor` | `'#ffffff'` | 格子背景色 |
| `textColor` | `'#262626'` | 主文字色 |
| `textColorDisabled` | `'#d9d9d9'` | 禁用日期文字色 |
| `textColorSubLabel` | `'#595959'` | 次要标签色 |
| `textColorWeekend` | `'#f04040'` | 周末日期文字色 |
| `textColorWeekendTitle` | `'#f08080'` | 周末日期文字色 |
| `todayBarColor` | `'#8c00ff'` | 今日标记条颜色 |

---

## 3. ValueObject（值对象格式）

```ts
// 无选中
null

// date / dateTime
{ start: "2026-07-01 10:30" }

// dateRange / dateTimeRange
{ start: "2026-07-01 10:30", end: "2026-07-15 14:00" }
```

---

## 4. 公开方法

### picker.open() / picker.close() / picker.toggle()

```js
picker.open();    // 打开面板。已打开则无效果。
picker.close();   // 关闭面板。已关闭则无效果。
picker.toggle();  // 切换面板打开/关闭状态。
```

### picker.setValue(value)

```js
picker.setValue({ start: "2026-06-01", end: "2026-06-15" });
// 或带时间
picker.setValue({ start: "2026-06-01 08:30", end: "2026-06-15 17:00" });
```

- `value` 为 ValueObject（见 §3）
- 自动校验格式，非法日期静默忽略
- 触发 `onChange` 回调（`meta.source = 'programmatic'`）

> ⚠️ **组件不跨边界读取 trigger 显示文本**。`setValue()` 接受的是 ValueObject（`{start, end}`），不是 trigger 输入框的原始字符串。
> 调用方负责将 trigger 的显示值解析为正确的 JSON 格式后再传入。格式错误由调用方承担。

### picker.getValue([format])

```js
picker.getValue();
// → { start: "2026-06-01 00:00", end: "2026-06-15 23:59" } | null

picker.getValue('string');
// → 同上（默认格式）

picker.getValue('date');
// → { start: Date, end: Date | null } | null

picker.getValue('object');
// → { start: { year, month, day, hour, minute }, end: { ... } | null } | null
```

| format | 返回类型 | 说明 |
| --- | --- | --- |
| `'string'`（默认） | `ValueObject \| null` | YYYY-MM-DD HH:mm 格式字符串。单日模式无`end` 字段 |
| `'date'` | `{start:Date, end:Date\|null} \| null` | JavaScript Date 对象 |
| `'object'` | `{start:DateParts, end:DateParts\|null} \| null` | 展开的数字对象 |

`DateParts`:

```ts
{ year: number, month: number, day: number, hour: number, minute: number }
```

### picker.clear([silent])

```js
picker.clear();       // 清除选中值，触发 onChange(null)
picker.clear(true);   // 静默清除，不触发回调
```

### picker.onChange(callback)

```js
picker.onChange(function(value, meta) {
  // value: ValueObject | null
  // meta: { source: 'user' | 'programmatic', action: 'selecting' | 'confirmed' | 'cleared' }
});
```

| meta 字段 | 值 | 说明 |
| --- | --- | --- |
| `source` | `'user'` | 由用户点击/交互触发 |
| `source` | `'programmatic'` | 由`setValue()` / `clear()` 触发 |
| `action` | `'selecting'` | 选择中（单日期已选、范围选了起点） |
| `action` | `'confirmed'` | 选择完成 |
| `action` | `'cleared'` | 被清除 |

### picker.destroy()

```js
picker.destroy();
```

- 关闭面板、解绑所有事件监听、清空回调列表、移除 DOM
- 调用后实例不可再用

### 生命周期回调

```js
picker.onOpen(function() { /* 面板已打开 */ });
picker.onClose(function() { /* 面板已关闭 */ });
```

---

## 5. 多实例模式（单页使用不同 mode）

组件的 `mode` 在构造时确定后不可变更。如果单一页面内需要使用不同模式（如 `date` 和 `dateRange` 共存、或中英文各一个实例），应创建多个独立实例。

### 多 trigger 多实例

每个实例绑定各自的 trigger 元素，独立工作：

```js
const pickerA = new dtrPicker('#input-a', { renderMode: 'svg', mode: 'date' });
const pickerB = new dtrPicker('#input-b', { renderMode: 'svg', mode: 'dateRange' });
```

### 单 trigger 多实例

一个 trigger 元素也可以关联多个实例（例如在同一位置切换不同模式、或中英文混用）：

```js
const trigger = document.querySelector('#my-input');
const instances = [];

['dateTime', 'dateTimeRange'].forEach(function(mode) {
  const p = new dtrPicker(trigger, { renderMode: 'svg', mode: mode });
  instances.push(p);
});

function switchInstance(index) {
  instances.forEach(function(p, i) {
    if (i === index) p.open();
    else p.close();
  });
}
```

> 同一 trigger 关联多个实例时，面板会重叠定位在同一位置。建议同一时刻只打开其中一个实例，避免视觉冲突。

---

## 6. 快速开始

```js
import dtrPicker from 'path/to/dtrpicker/dtrpicker.js';

// 1. 创建
const picker = new dtrPicker('#my-input', {
  renderMode: 'svg',
  mode: 'dateRange',
  locale: 'zh-CN',
  firstDay: 1,
  colorScheme: 'nature',
});

// 2. 监听值变化
picker.onChange((value, meta) => {
  if (value) {
    console.log(`选择范围：${value.start} ~ ${value.end}`);
  }
});

// 3. 面板打开/关闭通知
picker.onOpen(() => console.log('面板已打开'));
picker.onClose(() => console.log('面板已关闭'));

// 4. 程序化操作
picker.setValue({ start: '2026-07-01', end: '2026-07-10' });
const val = picker.getValue('date');
console.log(val.start.getFullYear()); // 2026

// 5. 清理
picker.destroy();
```
