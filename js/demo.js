window.__esModuleLoaded = true;

let dtrPicker = null;
import { locales } from '../src/config/i18n.js';

// Load and display the version from package.json so the badge always matches
// the published npm version. Non-critical: silently hidden on failure.
async function loadPackageVersion() {
  try {
    const res = await fetch('package.json', { cache: 'no-store' });
    if (!res.ok) return;
    const pkg = await res.json();
    const el = document.getElementById('demo-version');
    if (el && pkg.version) el.textContent = 'v' + pkg.version;
  } catch (err) {
    // Ignore — version badge is optional.
  }
}
loadPackageVersion();

// ================================================================
//  Demo page i18n dictionary
// ================================================================
const demoI18n = {
  'zh-CN': {
    subtitle: '由 Limpo@live.com 设计，并由 DeepSeek V4 实施',
    demoPicker: '选择器演示',
    defaultLabel: '默认',
    autoLabel: '自动',
    dateRangeLabel: '日期范围：',
    demoHint: '💡 点击输入框弹出日历 · 拖拽浏览月份 · 点击起止日期 · JSON 实时返回',
    paramConfig: '参数配置',
    colorSchemeLabel: '色系风格',
    colorSchemeTitle: '色系风格',
    renderModeSvg: 'SVG',
    yearMonthModeLabel: '年月显示',
    yearMonthWatermark: '水印',
    yearMonthColumn: '列',
    schemeMorandi: '莫兰迪',
    schemeNature: '自然',
    schemeOcean: '海天蓝',
    schemeForest: '森林绿',
    schemeNight: '星夜黑',
    firstDayLabel: '周起始日',
    sun: '周日',
    mon: '周一',
    modeLabel: '选择模式',
    modeTitle: '选择模式',
    modeDate: '日期',
    modeDateTime: '日期+时间',
    modeDateRange: '日期范围',
    modeDateTimeRange: '日期时间范围',
    currentParams: '当前参数 (JSON)',
    codeSample: '调用代码',
    returnValue: '返回值 (JSON)',
    localeLabel: '国际语言',
    langTitle: '国际语言',
    clearTitle: '清除选择',
    placeholder: '请选择日期范围',
  },
  'en-US': {
    subtitle: 'Designed by Limpo@live.com, implemented by DeepSeek V4',
    demoPicker: 'Picker Demo',
    defaultLabel: 'Default',
    autoLabel: 'Auto',
    dateRangeLabel: 'Date Range:',
    demoHint: '💡 Click to open calendar · Drag to browse months · Click start/end dates · Real-time JSON',
    paramConfig: 'Configuration',
    colorSchemeLabel: 'Scheme',
    colorSchemeTitle: 'Color scheme',
    renderModeSvg: 'SVG',
    yearMonthModeLabel: 'Year/Month',
    yearMonthWatermark: 'Watermark',
    yearMonthColumn: 'Column',
    schemeMorandi: 'Morandi',
    schemeNature: 'Nature',
    schemeOcean: 'Ocean',
    schemeForest: 'Forest',
    schemeNight: 'Starry Night',
    firstDayLabel: 'Week starts',
    sun: 'Sun',
    mon: 'Mon',
    modeLabel: 'Mode',
    modeTitle: 'Selection mode',
    modeDate: 'Date',
    modeDateTime: 'Date+Time',
    modeDateRange: 'Date Range',
    modeDateTimeRange: 'Date Time Range',
    currentParams: 'Current Params (JSON)',
    codeSample: 'Code Sample',
    returnValue: 'Return Value (JSON)',
    localeLabel: 'Language',
    langTitle: 'Language',
    clearTitle: 'Clear selection',
    placeholder: 'Please select a date range',
  },
  'zh-TW': {
    subtitle: '由 Limpo@live.com 設計，由 DeepSeek V4 實作',
    demoPicker: '選擇器示範',
    defaultLabel: '預設',
    autoLabel: '自動',
    dateRangeLabel: '日期範圍：',
    demoHint: '💡 點擊輸入框彈出日曆 · 拖拽瀏覽月份 · 點擊起止日期 · JSON 即時回傳',
    paramConfig: '參數設定',
    colorSchemeLabel: '色彩風格',
    colorSchemeTitle: '色彩風格',
    renderModeSvg: 'SVG',
    yearMonthModeLabel: '年月顯示',
    yearMonthWatermark: '浮水印',
    yearMonthColumn: '欄',
    schemeMorandi: '莫蘭迪',
    schemeNature: '自然',
    schemeOcean: '海天藍',
    schemeForest: '森林綠',
    schemeNight: '星夜黑',
    firstDayLabel: '週起始日',
    sun: '週日',
    mon: '週一',
    modeLabel: '選擇模式',
    modeTitle: '選擇模式',
    modeDate: '日期',
    modeDateTime: '日期+時間',
    modeDateRange: '日期範圍',
    modeDateTimeRange: '日期時間範圍',
    currentParams: '目前參數 (JSON)',
    codeSample: '呼叫程式碼',
    returnValue: '回傳值 (JSON)',
    localeLabel: '國際語言',
    langTitle: '國際語言',
    clearTitle: '清除選擇',
    placeholder: '請選擇日期範圍',
  },
  'ja-JP': {
    subtitle: 'Limpo@live.com デザイン、DeepSeek V4 実装',
    demoPicker: 'ピッカー デモ',
    defaultLabel: 'デフォルト',
    autoLabel: '自動',
    dateRangeLabel: '日付範囲：',
    demoHint: '💡 クリックでカレンダー表示 · ドラッグで月を移動 · 開始/終了日をクリック · JSON リアルタイム表示',
    paramConfig: 'パラメータ設定',
    colorSchemeLabel: 'カラースキーム',
    colorSchemeTitle: 'カラースキーム',
    renderModeSvg: 'SVG',
    yearMonthModeLabel: '年月表示',
    yearMonthWatermark: 'ウォーターマーク',
    yearMonthColumn: '列',
    schemeMorandi: 'モランディ',
    schemeNature: 'ナチュラル',
    schemeOcean: 'オーシャン',
    schemeForest: 'フォレスト',
    schemeNight: 'スターリーナイト',
    firstDayLabel: '週の開始日',
    sun: '日',
    mon: '月',
    modeLabel: 'モード',
    modeTitle: '選択モード',
    modeDate: '日付',
    modeDateTime: '日付+時刻',
    modeDateRange: '日付範囲',
    modeDateTimeRange: '日付時刻範囲',
    currentParams: '現在のパラメータ (JSON)',
    codeSample: 'コードサンプル',
    returnValue: '戻り値 (JSON)',
    localeLabel: '言語',
    langTitle: '言語',
    clearTitle: '選択をクリア',
    placeholder: '日付範囲を選択してください',
  },
  'ko-KR': {
    subtitle: 'Limpo@live.com 디자인, DeepSeek V4 구현',
    demoPicker: '피커 데모',
    defaultLabel: '기본',
    autoLabel: '자동',
    dateRangeLabel: '날짜 범위：',
    demoHint: '💡 클릭하여 캘린더 열기 · 드래그로 월 탐색 · 시작/종료 날짜 클릭 · JSON 실시간 반환',
    paramConfig: '매개변수 설정',
    colorSchemeLabel: '색상 구성',
    colorSchemeTitle: '색상 구성',
    renderModeSvg: 'SVG',
    yearMonthModeLabel: '년월 표시',
    yearMonthWatermark: '워터마크',
    yearMonthColumn: '열',
    schemeMorandi: '모란디',
    schemeNature: '내추럴',
    schemeOcean: '오션',
    schemeForest: '포레스트',
    schemeNight: '스타리 나이트',
    firstDayLabel: '주 시작일',
    sun: '일',
    mon: '월',
    modeLabel: '모드',
    modeTitle: '선택 모드',
    modeDate: '날짜',
    modeDateTime: '날짜+시간',
    modeDateRange: '날짜 범위',
    modeDateTimeRange: '날짜 시간 범위',
    currentParams: '현재 매개변수 (JSON)',
    codeSample: '코드 샘플',
    returnValue: '반환값 (JSON)',
    localeLabel: '언어',
    langTitle: '언어',
    clearTitle: '선택 지우기',
    placeholder: '날짜 범위를 선택하세요',
  },
};

// ================================================================
//  i18n helpers
// ================================================================

function getDemoLocale(locale) {
  if (demoI18n[locale]) return demoI18n[locale];
  const lang = locale.split('-')[0];
  for (const key of Object.keys(demoI18n)) {
    if (key.startsWith(lang)) return demoI18n[key];
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
  document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
    const key = el.getAttribute('data-i18n-title');
    if (dict[key]) el.title = dict[key];
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
  const locale = document.getElementById('lang-select').value;
  const yearMonthMode = document.querySelector('input[name="param-yearMonthMode"]:checked').value;
  const firstDayRaw = document.querySelector('input[name="param-firstDay"]:checked').value;
  const colorScheme = document.getElementById('param-colorScheme').value;
  const params = {
    mode: currentMode,
  };
  // Omit the corresponding JSON keys when options are "default" (empty); the picker uses its internal defaults
  if (locale) params.locale = locale;
  if (yearMonthMode) params.yearMonthMode = yearMonthMode;
  if (firstDayRaw !== '') params.firstDay = parseInt(firstDayRaw, 10);
  if (colorScheme) params.colorScheme = colorScheme;
  return params;
}

function updateParamsDisplay() {
  const el = document.getElementById('params-display');
  el.innerHTML = '<span class="json-section">// Init params</span>\n'
    + syntaxHighlightJSON(JSON.stringify(getCurrentParams(), null, 2))
    + '\n\n<span class="json-section">// Value passed on open</span>\n'
    + syntaxHighlightJSON(JSON.stringify(lastValue || null, null, 2));
}

function generateCodeSnippet(params) {
  const importPath = 'src/dtrpicker.js';
  const opts = [];
  const currentLocale = document.getElementById('lang-select').value;
  opts.push('  mode: "' + params.mode + '"');
  // Omit code lines for "default" options; always emit explicitly selected values
  if (params.yearMonthMode) opts.push('  yearMonthMode: "' + params.yearMonthMode + '"');
  // No locale is provided for "Auto" (empty) or the default en-US
  if (currentLocale && currentLocale !== 'en-US') opts.push('  locale: "' + currentLocale + '"');
  if (params.firstDay !== undefined) opts.push('  firstDay: ' + params.firstDay);
  if (params.colorScheme) opts.push('  colorScheme: "' + params.colorScheme + '"');

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

async function ensurePickerSource() {
  if (dtrPicker) return dtrPicker;
  const mod = await import('../src/dtrpicker.js');
  dtrPicker = mod.default || mod;
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

  const PickerClass = await ensurePickerSource();
  const yearMonthMode = document.querySelector('input[name="param-yearMonthMode"]:checked').value;
  const locale = document.getElementById('lang-select').value;
  const firstDayRaw = document.querySelector('input[name="param-firstDay"]:checked').value;
  const colorScheme = document.getElementById('param-colorScheme').value;
  const triggerEl = document.getElementById('picker-trigger');

  currentMode = document.getElementById('param-mode').value;
  const pickerOpts = {
    mode: currentMode,
  };
  // Don't pass options that are "default" (empty); the picker uses its internal defaults
  if (yearMonthMode) pickerOpts.yearMonthMode = yearMonthMode;
  if (locale) pickerOpts.locale = locale;
  if (firstDayRaw !== '') pickerOpts.firstDay = parseInt(firstDayRaw, 10);
  if (colorScheme) pickerOpts.colorScheme = colorScheme;
  const p = new PickerClass(triggerEl, pickerOpts);
  p.onChange(onChangeHandler);
  // Remove the instance's own trigger click handler; the demo manages it centrally
  triggerEl.removeEventListener('click', p._onTriggerClick);
  pickers[currentMode] = p;
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

document.querySelectorAll('input[name="param-yearMonthMode"]').forEach(function (el) { el.addEventListener('change', applyParams); });
document.getElementById('param-colorScheme').addEventListener('change', applyParams);
document.getElementById('lang-select').addEventListener('change', applyParams);
document.querySelectorAll('input[name="param-firstDay"]').forEach(function (el) { el.addEventListener('change', applyParams); });

/**
 * Parses the trigger display text into the JSON format accepted by the picker's setValue.
 * Caller responsibility: returns null on format errors; the picker does not read the trigger across boundaries.
 * @param {string} text - trigger.value
 * @param {string} mode - the current selection mode
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

// Trigger input change: clear the current picker when empty
document.getElementById('picker-trigger').addEventListener('input', function () {
  if (!this.value) {
    const picker = pickers[currentMode];
    if (picker) picker.clear();
    lastValue = null;
    updateJSONDisplay(null);
    updateParamsDisplay();
    updateCodeDisplay();
  }
});

// Trigger click: parse the current value, pass it to the picker, then toggle open
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

// Mode changes reinitialize all instances like other config parameters
document.getElementById('param-mode').addEventListener('change', applyParams);

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

// Language defaults to "Auto": page copy renders in the browser-detected language; the picker locale is auto-detected by the browser
applyDemoI18n(detectedLocale);
initAllPickers();
updateParamsDisplay();
updateCodeDisplay();
updateJSONDisplay(null);
