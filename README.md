# dtrPicker

> 一个流式日期/时间范围选择器组件，基于 SVG 渲染，专注于轻量、流畅与可定制。

---

## 概述

dtrPicker 是一个纯前端日期选择器，采用 **SVG 渲染引擎**，支持日期、日期时间、日期范围和日期时间范围四种选择模式。组件以模块化架构设计，核心依赖仅 esbuild 用于构建打包，无其他运行时依赖。

---

## 功能特性

- **四种选择模式** — `date` / `dateTime` / `dateRange` / `dateTimeRange`
- **SVG 渲染** — 像素级精确控制，CSS 隔离，不依赖外部 UI 框架
- **虚拟滚动** — 日历面板流畅翻页，支持滚轮与拖拽浏览
- **国际化** — 内置多语言包（简体中文、英语、日语等），BCP 47 语言标签
- **双色系** — 莫兰迪 / 自然，支持自定义颜色覆盖
- **TypeScript 支持** — 完整类型声明
- **零运行时依赖** — 仅构建时依赖 esbuild

---

## 项目结构

```
dtrpicker/
├── dtrpicker/                # 核心源码
│   ├── dtrpicker.js          # 主类与入口
│   ├── dtrpicker.d.ts        # TypeScript 类型声明
│   ├── index.js              # 再导出入口
│   ├── config/               # 配置模块
│   │   ├── colors.js         # 色彩方案定义
│   │   ├── dimensions.js     # 尺寸与布局常量
│   │   └── i18n.js           # 国际化语言包
│   ├── renderers/            # 渲染层
│   │   ├── svg-renderer.js   # SVG 渲染器
│   │   ├── drawing-area.js   # 绘图区域管理
│   │   ├── cell-manager.js   # 单元格生命周期
│   │   └── cells/            # 各类单元格实现
│   ├── services/             # 服务层
│   │   └── drag-controller.js # 拖拽事件统一调度
│   └── utils/                # 工具函数
│       ├── color.js          # 颜色处理
│       ├── date.js           # 日期计算
│       └── datetime-value.js # 日期时间值解析
├── docs/
│   └── api-spec.md           # API 规范文档
├── css/
│   └── demo.css              # 演示页样式
├── js/
│   └── demo.js               # 演示页逻辑
├── index.html                # 演示入口
├── server.js                 # 本地开发 HTTP 服务
├── build.js                  # esbuild 打包脚本
└── package.json
```

---

## 快速开始

```js
import dtrPicker from 'dtrpicker/dtrpicker.js';

const picker = new dtrPicker('#my-input', {
  mode: 'dateRange',
  zIndex: 1000,
});

picker.onChange((value, meta) => {
  console.log('选中值:', value);
  console.log('变更来源:', meta.source, '动作:', meta.action);
});
```

详细 API 参考请见 [`docs/api-spec.md`](docs/api-spec.md)。

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
