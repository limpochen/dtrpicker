# DateTime 类化方案 ✅ 已完成

将 `utils/date.js` 从纯函数模块重构为 `DateTime` 类，让日期选择器的核心领域对象以正式类形式存在。

---

## 一、当前状态

`utils/date.js` — 5 个导出函数的纯函数模块，无状态、无类：

```text
dateEqual(a, b)       比较两个 Date 是否同一天
dateStr(d)            格式化为 YYYY-MM-DD
parseDate(s)          从字符串解析 Date
getStartOfWeek(d, sf) 获取所在周第一天
formatDate(d, fmt)    按模板格式化
```

被 2 个文件引用，共 11 处调用：

| 文件 | 使用的函数 | 调用次数 |
| ------ | ----------- | --------- |
| `state/pickerstate.js` | `dateEqual`、`parseDate`、`formatDate`、`getStartOfWeek` | 6 次 |
| `renderers/svg-renderer.js` | `dateEqual`、`dateStr`、`parseDate` | 5 次 |

此外，这两个文件还有大量对原生 `Date` 方法的直接调用：

| 文件 | Date 方法调用次数（含 new Date） |
| ------ | ------------------------------- |
| `state/pickerstate.js` | ~19 处 |
| `renderers/svg-renderer.js` | ~40 处 |

---

## 二、目标：DateTime 类

### API 设计

```js
class DateTime {
  // 构造：接受 Date、字符串、或 年月日时分秒参数
  constructor(d)

  // ── 只读属性（替代 .getXxx()）──
  get year()       // 替代 .getFullYear()
  get month()      // 替代 .getMonth()       → 0-11
  get date()       // 替代 .getDate()         → 1-31
  get hour()       // 替代 .getHours()
  get minute()     // 替代 .getMinutes()
  get second()     // 替代 .getSeconds()
  get day()        // 替代 .getDay()          → 0=周日
  get timestamp()  // 替代 .getTime()

  // ── 修改方法（原地修改，返回 this）──
  setDate(n)       // 设置日（1-31），跨月自动回滚
  setMonth(n)      // 设置月（0-11）
  setFullYear(y)   // 设置年
  setHour(n)       // 设置时
  setMinute(n)     // 设置分
  addDays(n)       // 加减天数（n 可为负）

  // ── 查询方法 ──
  equals(other)         // 比较年月日是否相同
  isBefore(other)       // 是否早于
  isAfter(other)        // 是否晚于
  isBetween(a, b)       // 是否在 a 和 b 之间（不含两端）

  // ── 格式化 ──
  toDateString()        // → "YYYY-MM-DD"
  format(fmt)           // 按模板格式化

  // ── 工具 ──
  clone()               // 深拷贝
  startOfWeek(sunFirst) // 所在周第一天

  // ── 静态工厂 ──
  static parse(s)       // 从字符串解析
  static now()          // 当前时刻
  static today()        // 今日 00:00
}
```

---

## 三、改动清单

### 3a. `utils/date.js` — 完整重写

将 5 个导出函数重写为 `DateTime` 类（约 80 行）。

### 3b. `state/pickerstate.js` — ~19 处修改

| # | 位置 | 当前代码 | 改为 |
| --- | ------ | --------- | ------ |
| 1 | import | `import { dateEqual, parseDate, formatDate, getStartOfWeek } from '../utils/date.js'` | `import DateTime from '../utils/date.js'` |
| 2 | L63 | `getStartOfWeek(this.baseDate, this.options.firstDay === 0)` | `this.baseDate.startOfWeek(this.options.firstDay === 0)` |
| 3 | L60 | `this.today = new Date()` | `this.today = DateTime.now()` |
| 4 | L62 | `this.baseDate = new Date()` | `this.baseDate = DateTime.now()` |
| 5 | L125 | `dateEqual(this.rangeStart, this.rangeEnd)` | `this.rangeStart.equals(this.rangeEnd)` |
| 6 | L127 | `this.rangeStart = new Date(d)` | `this.rangeStart = d.clone()` |
| 7 | L129 | `this.rangeEnd = new Date(d)` | `this.rangeEnd = d.clone()` |
| 8 | L136 | `this.rangeStart = new Date(d)` | `this.rangeStart = d.clone()` |
| 9 | L137 | `this.rangeEnd = new Date(d)` | `this.rangeEnd = d.clone()` |
| 10 | L173 | `new Date(baseStart)` | `baseStart.clone()` |
| 11 | L174 | `new Date(baseEnd)` | `baseEnd.clone()` |
| 12 | L180 | `d.getFullYear()` | `d.year` |
| 13 | L180 | `d.getMonth() + 1` | `d.month + 1` |
| 14 | L180 | `d.getDate()` | `d.date` |
| 15 | L194 | `formatDate(baseStart, 'YYYY-MM-DD')` | `baseStart.format('YYYY-MM-DD')` |
| 16 | L195 | `formatDate(baseEnd, 'YYYY-MM-DD')` | `baseEnd.format('YYYY-MM-DD')` |
| 17 | L259 | `parseDate(range.start)` | `DateTime.parse(range.start)` |
| 18 | L260 | `parseDate(range.end)` | `DateTime.parse(range.end)` |
| 19 | L263 | `this.rangeStart.getHours()` | `this.rangeStart.hour` |
| 20 | L264 | `this.rangeStart.getMinutes()` | `this.rangeStart.minute` |
| 21 | L267 | `this.rangeEnd.getHours()` | `this.rangeEnd.hour` |
| 22 | L268 | `this.rangeEnd.getMinutes()` | `this.rangeEnd.minute` |

### 3c. `renderers/svg-renderer.js` — ~45 处修改

**按模式分组：**

### 模式 A：import + 函数调用替换（6 处）

| 当前 | 改为 |
| ------ | ------ |
| `import { dateEqual, dateStr, parseDate } from '../utils/date.js'` | `import DateTime from '../utils/date.js'` |
| `dateEqual(d, this.state.rangeStart)` | `d.equals(this.state.rangeStart)` |
| `dateEqual(d, this.state.rangeEnd)` | `d.equals(this.state.rangeEnd)` |
| `dateEqual(dayDate, this.state.today)` | `dayDate.equals(this.state.today)` |
| `dateStr(dayDate)` | `dayDate.toDateString()` |
| `parseDate(dateAttr)` | `DateTime.parse(dateAttr)` |

### 模式 B：.getTime() 替换（4 处）

| 当前 | 改为 |
| ------ | ------ |
| `d.getTime()` | `d.timestamp` |
| `this.state.rangeStart.getTime()` | `this.state.rangeStart.timestamp` |
| `this.state.rangeEnd.getTime()` | `this.state.rangeEnd.timestamp` |
| `this.state.startOfWeekZero.getTime()` | `this.state.startOfWeekZero.timestamp` |

### 模式 C：.getMonth() → .month（8 处）

包括 `rowStart.getMonth()`、`d.getMonth()`、`dayDate.getMonth()` 等。

### 模式 D：.getFullYear() → .year（8 处）

包括 `rowStart.getFullYear()`、`d.getFullYear()`、`dayDate.getFullYear()` 等。

### 模式 E：.getDate() → .date（~7 处）

包括 `rowStart.getDate()`、`dayDate.getDate()` 等。

### 模式 F：new Date(rowStart) → rowStart.clone()（7 处）

```js
// 当前
const d = new Date(rowStart);
d.setDate(rowStart.getDate() + col);

// 改为
const d = rowStart.clone();
d.setDate(rowStart.date + col);
```

### 模式 G：特殊 new Date(...) 构造（2 处）

```js
// 第 1099 行 — goToDate 方法
const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
// 改为
const targetDate = new DateTime(date.year, date.month, date.date);

// 第 1116 行 — _getDateOfWeekRow 方法
const d = new Date(this.state.startOfWeekZero.getTime());
// 改为
const d = this.state.startOfWeekZero.clone();
// 且 d.setDate(d.getDate() + rowOffset * 7) 改为 d.setDate(d.date + rowOffset * 7)
```

---

## 四、实施顺序

```text
阶段 0: 备份 dtrpicker/ (已有备份则跳过)
阶段 1: 重写 utils/date.js → DateTime 类
阶段 2: 更新 state/pickerstate.js  — ~22 处
阶段 3: 更新 renderers/svg-renderer.js — ~45 处
阶段 4: node build.js + 浏览器全面测试
阶段 5: git commit + push
```

### 阶段 0：备份

```powershell
Copy-Item -Recurse -Path dtrpicker -Destination dtrpicker.BACKUP
```

### 阶段 1：重写 `utils/date.js`

完整的 `DateTime` 类实现（见 API 设计章节）。注意：

- `setDate(n)` 需支持跨月回滚（与原生 `Date.setDate` 行为一致）
- `equals()` 只比较年月日，忽略时分秒（与当前 `dateEqual` 一致）
- `parse()` 优先解析 `YYYY-MM-DD`，按本地日期处理（与当前 `parseDate` 一致）
- `format()` 支持 `YYYY`/`MM`/`DD`/`HH`/`mm`/`ss`（与当前 `formatDate` 一致）

### 阶段 2：更新 `state/pickerstate.js`

按 3b 清单逐处替换。

**关于 `getValue('date')` 的注意：**
此方法返回 `{ start: Date, end: Date }`，消费方期望的是原生 `Date` 对象。由于 `baseStart` 变为 `DateTime` 实例，需要提供转换方法。

在 `DateTime` 类中添加：

```js
toNativeDate()  // 返回原生 Date 对象
```

`getValue('date')` 中改为：

```js
const val = { start: baseStart.toNativeDate() };
if (this.isRange()) val.end = baseEnd.toNativeDate();
```

**关于 `goToDate` 的注意：**
此方法接收 `date` 参数，可能来自 `this.state.today`（DateTime 实例）或外部直接传入 `new Date(...)`。`DateTime` 构造函数需兼容 `Date` 和 `DateTime` 两种入参。

### 阶段 3：更新 `renderers/svg-renderer.js`

按 3c 清单逐处替换。注意 `goToDate` 方法中的 `date.getFullYear()` 等调用。

---

## 五、验证标准

- [ ] `node build.js` 构建成功
- [ ] 浏览器日历正常弹出
- [ ] 点击选择日期正常
- [ ] 日期高亮/范围正常
- [ ] 时分滚轮可滚动
- [ ] 拖拽浏览正常
- [ ] 水印/列模式切换正常
- [ ] `getValue('string'/'date'/'object')` 三种格式输出正确
- [ ] `pickr.setValue({...})` 设置值正常
- [ ] 切换打包代码模式同样正常

**失败回退：**

```powershell
Remove-Item -Recurse -Force dtrpicker
Copy-Item -Recurse -Path dtrpicker.BACKUP -Destination dtrpicker
```
