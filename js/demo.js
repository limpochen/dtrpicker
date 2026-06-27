window.__esModuleLoaded = true;

let dtrPicker = null;
let currentPickerSource = '';
const PICKER_SOURCES = {
  dev: '../dtrpicker/dtrpicker.js',
  bundle: '../dist/dtrpicker.js',
};
const ALL_MODES = ['date', 'dateTime', 'dateRange', 'dateTimeRange'];

import { locales } from '../dtrpicker/config/i18n.js';

// ================================================================
//  Demo page i18n dictionary
// ================================================================
const demoI18n = {
  'zh-CN': {
    subtitle: '由 Limpo@live.com 设计，由 DeepSeek V4 实施',
    demoPicker: '选择器演示',
    dateRangeLabel: '日期范围：',
    demoHint: '💡 点击输入框弹出日历 · 拖拽浏览月份 · 点击起止日期 · JSON 实时返回',
    paramConfig: '参数配置',
    colorSchemeLabel: '色系',
    renderModeLabel: '渲染模式',
    renderModeSvg: 'SVG',
    renderModeHtml: 'HTML+CSS',
    schemeMorandi: '莫兰迪',
    schemeNature: '自然',
    firstDayLabel: '周起始日',
    sun: '周日',
    mon: '周一',
    modeLabel: '选择模式',
    modeDate: '日期',
    modeDateTime: '日期+时间',
    modeDateRange: '日期范围',
    modeDateTimeRange: '日期时间范围',
    currentParams: '当前参数 (JSON)',
    codeSample: '调用代码',
    returnValue: '返回值 (JSON)',
    localeLabel: '语言',
    clearTitle: '清除选择',
    placeholder: '请选择日期范围',
  },
  'en-US': {
    subtitle: 'Designed by Limpo@live.com, implemented by DeepSeek V4',
    demoPicker: 'Picker Demo',
    dateRangeLabel: 'Date Range:',
    demoHint: '💡 Click to open calendar · Drag to browse months · Click start/end dates · Real-time JSON',
    paramConfig: 'Configuration',
    colorSchemeLabel: 'Scheme',
    renderModeLabel: 'Render Mode',
    renderModeSvg: 'SVG',
    renderModeHtml: 'HTML+CSS',
    schemeMorandi: 'Morandi',
    schemeNature: 'Nature',
    firstDayLabel: 'Week starts',
    sun: 'Sun',
    mon: 'Mon',
    modeLabel: 'Mode',
    modeDate: 'Date',
    modeDateTime: 'Date+Time',
    modeDateRange: 'Date Range',
    modeDateTimeRange: 'Date Time Range',
    currentParams: 'Current Params (JSON)',
    codeSample: 'Code Sample',
    returnValue: 'Return Value (JSON)',
    localeLabel: 'Language',
    clearTitle: 'Clear selection',
    placeholder: 'Please select a date range',
  },
};

// ================================================================
//  i18n helpers
// ================================================================

function getDemoLocale(locale) {
  const lang = locale.split('-')[0];
  for (const key of Object.keys(demoI18n)) {
    if (key === locale || key.startsWith(lang)) return demoI18n[key];
  }
  return demoI18n['en-US'];
}

function applyDemoI18n(locale) {
  const dict = getDemoLocale(locale);
  document.getElementById('demo-subtitle').textContent = dict.subtitle;
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      if (el.tagName === 'OPTION') {
        el.textContent = dict[key];
      } else if (el.tagName === 'LABEL' && el.querySelector('input')) {
        const input = el.querySelector('input');
        el.textContent = dict[key];
        el.prepend(input);
      } else {
        el.textContent = dict[key];
      }
    }
  });
  const clearBtn = document.getElementById('picker-clear-btn');
  if (clearBtn && dict.clearTitle) clearBtn.title = dict.clearTitle;
  const trigger = document.getElementById('picker-trigger');
  if (trigger && dict.placeholder) trigger.placeholder = dict.placeholder;
}

// ================================================================
//  Multi-instance picker management
// ================================================================

let pickers = {};
let currentMode = 'dateRange';
let lastValue = null;

function toggleClearBtn(val) {
  const btn = document.getElementById('picker-clear-btn');
  btn.classList.toggle('visible', !!val);
}

function updateTriggerDisplay(val) {
  const trigger = document.getElementById('picker-trigger');
  if (val) {
    trigger.value = val.start + (val.end ? ' ~ ' + val.end : '');
  } else {
    trigger.value = '';
  }
}

function updateJSONDisplay(val) {
  const el = document.getElementById('json-display');
  if (val) {
    el.className = 'has-value';
    el.innerHTML = syntaxHighlightJSON(JSON.stringify(val, null, 2));
  } else {
    el.className = '';
    el.innerHTML = '<span class="json-null">null</span>';
  }
}

function syntaxHighlightJSON(json) {
  return json
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (m) {
      let cls = 'json-null';
      if (/^"/.test(m)) {
        if (/:$/.test(m)) cls = 'json-key';
        else cls = 'json-string';
      }
      return '<span class="' + cls + '">' + m + '</span>';
    });
}

function getCurrentParams() {
  return {
    renderMode: document.getElementById('param-renderMode').value,
    locale: document.getElementById('lang-select').value,
    firstDay: parseInt(document.querySelector('input[name="param-firstDay"]:checked').value),
    mode: currentMode,
    colorScheme: document.getElementById('param-colorScheme').value,
  };
}

function updateParamsDisplay() {
  const el = document.getElementById('params-display');
  el.innerHTML = '<span class="json-section">// 初始化参数</span>\n'
    + syntaxHighlightJSON(JSON.stringify(getCurrentParams(), null, 2))
    + '\n\n<span class="json-section">// 弹出时传值</span>\n'
    + syntaxHighlightJSON(JSON.stringify(lastValue || null, null, 2));
}

function generateCodeSnippet(params) {
  const source = document.getElementById('source-select')?.value || 'dev';
  const importPath = source === 'bundle' ? 'dist/dtrpicker.js' : 'dtrpicker/dtrpicker.js';
  const opts = [];
  const currentLocale = document.getElementById('lang-select').value;
  opts.push('  renderMode: "' + params.renderMode + '"');
  opts.push('  mode: "' + params.mode + '"');
  if (currentLocale !== 'en-US') opts.push('  locale: "' + currentLocale + '"');
  if (params.firstDay !== 0) opts.push('  firstDay: ' + params.firstDay);
  if (params.colorScheme !== 'morandi') opts.push('  colorScheme: "' + params.colorScheme + '"');

  let code = '// Import & Create\nimport dtrPicker from \'' + importPath + '\';\n\n'
    + 'const picker = new dtrPicker("#my-input", {\n' + opts.join(',\n') + '\n});\n\n'
    + '// Set value\npicker.setValue(' + JSON.stringify(lastValue || { start: '...' }) + ');\n';
  return code;
}

function updateCodeDisplay() {
  document.getElementById('code-display').innerHTML = highlightCode(generateCodeSnippet(getCurrentParams()));
}

function highlightCode(code) {
  const html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return html
    .replace(/(\/\/[^\n]*)/g, '<span class="code-cmt">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="code-str">$1</span>')
    .replace(/\b(new|const|let|var|function|return|if|else|true|false|null|undefined)\b/g, '<span class="code-kw">$1</span>')
    .replace(/\b(dtrPicker|picker|document|console)\b/g, '<span class="code-fn">$1</span>')
    .replace(/(\d+)/g, '<span class="code-num">$1</span>');
}

// ================================================================
//  Picker initialization
// ================================================================

async function ensurePickerSource(source) {
  if (source === currentPickerSource && dtrPicker) return dtrPicker;
  const mod = await import(PICKER_SOURCES[source] || PICKER_SOURCES.dev);
  dtrPicker = mod.default || mod;
  currentPickerSource = source;
  return dtrPicker;
}

function destroyAllPickers() {
  for (const key in pickers) {
    if (pickers[key]) pickers[key].destroy();
  }
  pickers = {};
}

function onChangeHandler(val) {
  lastValue = val;
  updateTriggerDisplay(val);
  updateJSONDisplay(val);
  updateParamsDisplay();
  updateCodeDisplay();
  toggleClearBtn(val);
}

async function initAllPickers() {
  destroyAllPickers();

  const source = document.getElementById('source-select')?.value || 'dev';
  const PickerClass = await ensurePickerSource(source);
  const renderMode = document.getElementById('param-renderMode').value;
  const locale = document.getElementById('lang-select').value;
  const firstDay = parseInt(document.querySelector('input[name="param-firstDay"]:checked').value);
  const colorScheme = document.getElementById('param-colorScheme').value;
  const triggerEl = document.getElementById('picker-trigger');

  ALL_MODES.forEach(function (mode) {
    const p = new PickerClass(triggerEl, {
      renderMode: renderMode,
      mode: mode,
      locale: locale,
      firstDay: firstDay,
      colorScheme: colorScheme,
    });
    p.onChange(onChangeHandler);
    // 移除实例自带的 trigger 点击，由 demo 统一管理
    triggerEl.removeEventListener('click', p._onTriggerClick);
    pickers[mode] = p;
  });

  // 所有实例保持关闭，等待用户交互
  currentMode = document.getElementById('param-mode').value;
}

function switchMode(mode) {
  // 关闭旧实例，标记当前 mode，但不打开
  if (pickers[currentMode]) pickers[currentMode].close();
  currentMode = mode;
  document.getElementById('param-mode').value = mode;
  if (lastValue && pickers[mode]) {
    pickers[mode].setValue(lastValue);
  }
  updateParamsDisplay();
  updateCodeDisplay();
}

// ================================================================
//  Event bindings
// ================================================================

document.getElementById('picker-clear-btn').addEventListener('click', function (e) {
  e.stopPropagation();
  if (pickers[currentMode]) pickers[currentMode].clear();
});

function applyParams() {
  initAllPickers();
  updateParamsDisplay();
  updateCodeDisplay();
}

document.getElementById('param-renderMode').addEventListener('change', applyParams);
document.getElementById('param-colorScheme').addEventListener('change', applyParams);
document.getElementById('lang-select').addEventListener('change', applyParams);
document.querySelectorAll('input[name="param-firstDay"]').forEach(function (el) { el.addEventListener('change', applyParams); });
document.getElementById('source-select').addEventListener('change', applyParams);

/**
 * 将 trigger 显示文本解析为选择器 setValue 接受的 JSON 格式。
 * 消费方职责：格式错误返回 null，选择器不跨边界读取 trigger。
 * @param {string} text - trigger.value
 * @param {string} mode - 当前选择模式
 * @returns {{start:string, end?:string}|null}
 */
function parseTriggerValue(text, mode) {
  if (!text) return null;
  const isRange = mode === 'dateRange' || mode === 'dateTimeRange';
  const parts = text.split(' ~ ');
  if (isRange) {
    if (parts.length !== 2) return null;
    return { start: parts[0].trim(), end: parts[1].trim() };
  }
  return { start: parts[0].trim() };
}

// Trigger 输入变化：为空时通知所有 picker 清空
document.getElementById('picker-trigger').addEventListener('input', function () {
  if (!this.value) {
    for (const key in pickers) {
      if (pickers[key]) pickers[key].clear();
    }
    lastValue = null;
    updateJSONDisplay(null);
    updateParamsDisplay();
    updateCodeDisplay();
  }
});

// Trigger 点击：解析当前值传给选择器后再弹出
document.getElementById('picker-trigger').addEventListener('click', function (e) {
  e.stopPropagation();
  const picker = pickers[currentMode];
  if (!picker) return;

  const parsed = parseTriggerValue(this.value, currentMode);
  if (parsed) {
    picker.setValue(parsed);
    lastValue = parsed;
  } else if (!this.value) {
    picker.clear();
    lastValue = null;
  }

  picker.toggle();
});

// Mode 下拉切换：关闭旧实例，标记新 mode，等待用户点击 trigger 打开
document.getElementById('param-mode').addEventListener('change', function () {
  switchMode(this.value);
});

// ================================================================
//  Bootstrap
// ================================================================

const browserLang = navigator.language || navigator.browserLanguage || 'en-US';
const detectedLocale = (function () {
  if (locales[browserLang]) return browserLang;
  const lang = browserLang.split('-')[0];
  for (const key of Object.keys(locales)) { if (key.startsWith(lang)) return key; }
  return 'en-US';
})();

document.getElementById('lang-select').value = detectedLocale;
applyDemoI18n(detectedLocale);
initAllPickers();
updateParamsDisplay();
updateCodeDisplay();
updateJSONDisplay(null);
