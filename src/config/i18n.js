/**
 * i18n.js — 国际化语言包字典
 *
 * 提供多语言文本翻译，通过 dtrPickerI18n.getLocale(locale) 获取。
 * locale 格式为 BCP 47 标签（如 'zh-CN', 'en-US'）。
 * 未匹配时自动回退到英语（en-US）。
 *
 * @file       国际化语言包
 * @version    2.1.11
 * @license    MIT
 */

/**
 * 所有语言包。
 * 每周日数组索引：0=周日, 1=周一 … 6=周六
 * @const {Object<string, Object>}
 */
export const locales = {

    /* ==============================
       简体中文 (Chinese Simplified)
       ============================== */
    'zh-CN': {
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      year: '年',
      month: '月',
      hour: '时',
      minute: '分',
      start: '开始',
      end: '结束',
      schemeMorandi: '莫兰迪',
      schemeNature: '自然',
      schemeOcean: '海天蓝',
      schemeForest: '森林绿',
      schemeNight: '星夜黑',
      yearFirst: true,
    },

    /* ==============================
       英语 (English)
       ============================== */
    'en-US': {
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      year: 'Year',
      month: 'Mon',
      hour: 'Hour',
      minute: 'Min',
      start: 'Start',
      end: 'End',
      schemeMorandi: 'Morandi',
      schemeNature: 'Nature',
      schemeOcean: 'Ocean',
      schemeForest: 'Forest',
      schemeNight: 'Starry Night',
    },

    /* ==============================
       繁体中文 (Chinese Traditional)
       ============================== */
    'zh-TW': {
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      year: '年',
      month: '月',
      hour: '時',
      minute: '分',
      start: '開始',
      end: '結束',
      schemeMorandi: '莫蘭迪',
      schemeNature: '自然',
      schemeOcean: '海天藍',
      schemeForest: '森林綠',
      schemeNight: '星夜黑',
      yearFirst: true,
    },

    /* ==============================
       日文 (Japanese)
       ============================== */
    'ja-JP': {
      weekdays: ['日', '月', '火', '水', '木', '金', '土'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      year: '年',
      month: '月',
      hour: '時',
      minute: '分',
      start: '開始',
      end: '終了',
      schemeMorandi: 'モランディ',
      schemeNature: 'ナチュラル',
      schemeOcean: 'オーシャンブルー',
      schemeForest: 'フォレストグリーン',
      schemeNight: 'スターリーナイト',
      yearFirst: true,
    },

    /* ==============================
       韩文 (Korean)
       ============================== */
    'ko-KR': {
      weekdays: ['일', '월', '화', '수', '목', '금', '토'],
      months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
      year: '년',
      month: '월',
      hour: '시',
      minute: '분',
      start: '시작',
      end: '종료',
      schemeMorandi: '모란디',
      schemeNature: '내추럴',
      schemeOcean: '오션 블루',
      schemeForest: '포레스트 그린',
      schemeNight: '스타리 나이트',
      yearFirst: true,
    },

    /* ==============================
       俄文 (Russian)
       ============================== */
    'ru-RU': {
      weekdays: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
      months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
      year: 'г',
      month: 'мес',
      hour: 'ч',
      minute: 'мин',
      start: 'Начало',
      end: 'Конец',
      schemeMorandi: 'Моранди',
      schemeNature: 'Натуральный',
      schemeOcean: 'Океан',
      schemeForest: 'Лес',
      schemeNight: 'Звёздная ночь',
    },

    /* ==============================
       法文 (French)
       ============================== */
    'fr-FR': {
      weekdays: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      months: ['Janv', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'],
      year: 'an',
      month: 'mois',
      hour: 'h',
      minute: 'min',
      start: 'Début',
      end: 'Fin',
      schemeMorandi: 'Morandi',
      schemeNature: 'Naturel',
      schemeOcean: 'Océan',
      schemeForest: 'Forêt',
      schemeNight: 'Nuit étoilée',
    },

    /* ==============================
       德文 (German)
       ============================== */
    'de-DE': {
      weekdays: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
      months: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
      year: 'J',
      month: 'M',
      hour: 'Std',
      minute: 'Min',
      start: 'Start',
      end: 'Ende',
      schemeMorandi: 'Morandi',
      schemeNature: 'Natur',
      schemeOcean: 'Ozean',
      schemeForest: 'Wald',
      schemeNight: 'Sternennacht',
    },

    /* ==============================
       西班牙文 (Spanish)
       ============================== */
    'es-ES': {
      weekdays: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
      months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      year: 'año',
      month: 'mes',
      hour: 'h',
      minute: 'min',
      start: 'Inicio',
      end: 'Fin',
      schemeMorandi: 'Morandi',
      schemeNature: 'Natural',
      schemeOcean: 'Océano',
      schemeForest: 'Bosque',
      schemeNight: 'Noche estrellada',
    },

    /* ==============================
       葡萄牙文 (Portuguese)
       ============================== */
    'pt-BR': {
      weekdays: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'],
      months: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      year: 'ano',
      month: 'mês',
      hour: 'h',
      minute: 'min',
      start: 'Início',
      end: 'Fim',
      schemeMorandi: 'Morandi',
      schemeNature: 'Natural',
      schemeOcean: 'Oceano',
      schemeForest: 'Floresta',
      schemeNight: 'Noite estrelada',
    },

    /* ==============================
       意大利文 (Italian)
       ============================== */
    'it-IT': {
      weekdays: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
      months: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
      year: 'anno',
      month: 'mese',
      hour: 'h',
      minute: 'min',
      start: 'Inizio',
      end: 'Fine',
      schemeMorandi: 'Morandi',
      schemeNature: 'Naturale',
      schemeOcean: 'Oceano',
      schemeForest: 'Foresta',
      schemeNight: 'Notte stellata',
    },

    /* ==============================
       泰文 (Thai)
       ============================== */
    'th-TH': {
      weekdays: ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'],
      months: ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
      year: 'ปี',
      month: 'เดือน',
      hour: 'ชม.',
      minute: 'น.',
      start: 'เริ่ม',
      end: 'สิ้นสุด',
      schemeMorandi: 'โมรันดี',
      schemeNature: 'ธรรมชาติ',
      schemeOcean: 'ทะเลฟ้า',
      schemeForest: 'ป่าไม้',
      schemeNight: 'ราตรีประดับดาว',
    },

    /* ==============================
       荷兰文 (Dutch)
       ============================== */
    'nl-NL': {
      weekdays: ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'],
      months: ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
      year: 'jr',
      month: 'mnd',
      hour: 'u',
      minute: 'min',
      start: 'Start',
      end: 'Einde',
      schemeMorandi: 'Morandi',
      schemeNature: 'Natuur',
      schemeOcean: 'Oceaan',
      schemeForest: 'Bos',
      schemeNight: 'Sterrennacht',
    },

    /* ==============================
       波兰文 (Polish)
       ============================== */
    'pl-PL': {
      weekdays: ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'],
      months: ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'],
      year: 'r',
      month: 'mies',
      hour: 'g',
      minute: 'min',
      start: 'Początek',
      end: 'Koniec',
      schemeMorandi: 'Morandi',
      schemeNature: 'Naturalny',
      schemeOcean: 'Ocean',
      schemeForest: 'Las',
      schemeNight: 'Gwieździsta noc',
    },

    /* ==============================
       土耳其文 (Turkish)
       ============================== */
    'tr-TR': {
      weekdays: ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'],
      months: ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'],
      year: 'yıl',
      month: 'ay',
      hour: 's',
      minute: 'dk',
      start: 'Başlangıç',
      end: 'Bitiş',
      schemeMorandi: 'Morandi',
      schemeNature: 'Doğal',
      schemeOcean: 'Okyanus',
      schemeForest: 'Orman',
      schemeNight: 'Yıldızlı gece',
    },

    /* ==============================
       越南文 (Vietnamese)
       ============================== */
    'vi-VN': {
      weekdays: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      months: ['Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6', 'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12'],
      year: 'năm',
      month: 'tháng',
      hour: 'giờ',
      minute: 'phút',
      start: 'Bắt đầu',
      end: 'Kết thúc',
      schemeMorandi: 'Morandi',
      schemeNature: 'Tự nhiên',
      schemeOcean: 'Đại dương',
      schemeForest: 'Rừng xanh',
      schemeNight: 'Đêm đầy sao',
    },

    /* ==============================
       印尼文 (Indonesian)
       ============================== */
    'id-ID': {
      weekdays: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
      year: 'thn',
      month: 'bln',
      hour: 'j',
      minute: 'mnt',
      start: 'Mulai',
      end: 'Selesai',
      schemeMorandi: 'Morandi',
      schemeNature: 'Alami',
      schemeOcean: 'Lautan',
      schemeForest: 'Hutan',
      schemeNight: 'Malam berbintang',
    },
  };

/** 全局默认语言——检测不到语言时的唯一兜底 */
export const DEFAULT_LOCALE = 'en-US';

/**
 * 获取指定语言的语言包字典。
 *
 * 查找顺序：
 * 1. 完全匹配（如 'zh-CN'）
 * 2. 语言前缀匹配（如 'zh' → 'zh-CN'）
 * 3. 回退到全局默认语言 DEFAULT_LOCALE
 *
 * @param {string} [locale] - BCP 47 语言标签。为空时自动检测浏览器语言。
 * @returns {Object} 语言包对象
 */
export function getLocale(locale) {
    if (!locale) {
      locale = (navigator.language || navigator.browserLanguage || DEFAULT_LOCALE);
    }
    // 完全匹配
    if (locales[locale]) return locales[locale];
    // 语言前缀匹配（如 'zh' → 'zh-CN'）
    const lang = locale.split('-')[0];
    for (const key of Object.keys(locales)) {
      if (key.startsWith(lang)) return locales[key];
    }
    // 终极回退（用户确认保留的预期兜底）
    return locales[DEFAULT_LOCALE];
  }