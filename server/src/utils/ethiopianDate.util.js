// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// ETHIOPIAN DATE UTILITY
// kat-school/server/src/utils/ethiopianDate.util.js
// ============================================

'use strict';

// ─── Ethiopian Calendar Constants ─────────────
const ETHIOPIAN_MONTHS = [
  'Meskerem', // መስከረም  (Sep-Oct)
  'Tikemt', // ጥቅምት   (Oct-Nov)
  'Hidar', // ህዳር    (Nov-Dec)
  'Tahesas', // ታህሳስ   (Dec-Jan)
  'Tir', // ጥር     (Jan-Feb)
  'Yekatit', // የካቲት   (Feb-Mar)
  'Megabit', // መጋቢት   (Mar-Apr)
  'Miyazia', // ሚያዝያ   (Apr-May)
  'Ginbot', // ግንቦት   (May-Jun)
  'Sene', // ሰኔ     (Jun-Jul)
  'Hamle', // ሐምሌ    (Jul-Aug)
  'Nehase', // ነሐሴ    (Aug-Sep)
  'Pagume', // ጳጉሜ    (Sep)
];

const ETHIOPIAN_MONTHS_AMHARIC = [
  'መስከረም',
  'ጥቅምት',
  'ህዳር',
  'ታህሳስ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜ',
];

const ETHIOPIAN_DAYS_AMHARIC = ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];

// ─── Gregorian to Ethiopian Conversion ────────
// Algorithm based on Ethiopian calendar rules
const toEthiopian = (gregDate) => {
  const date = gregDate instanceof Date ? gregDate : new Date(gregDate);

  if (isNaN(date.getTime())) {
    throw new Error('Invalid date provided');
  }

  const GC = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };

  // Julian Day Number for Gregorian date
  const jdn = gregorianToJDN(GC.year, GC.month, GC.day);

  // Convert JDN to Ethiopian
  return jdnToEthiopian(jdn);
};

// ─── Ethiopian to Gregorian Conversion ────────
const toGregorian = (ethYear, ethMonth, ethDay) => {
  const jdn = ethiopianToJDN(ethYear, ethMonth, ethDay);
  return jdnToGregorian(jdn);
};

// ─── JDN Conversion Helpers ───────────────────
const gregorianToJDN = (year, month, day) => {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
};

const jdnToEthiopian = (jdn) => {
  // Ethiopian epoch: JDN 1724221 = Meskerem 1, 1 EC
  const ETHIOPIAN_EPOCH = 1724221;
  const r = (jdn - ETHIOPIAN_EPOCH) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  const year =
    4 * Math.floor((jdn - ETHIOPIAN_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460);
  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;

  return {
    year,
    month,
    day,
    monthName: ETHIOPIAN_MONTHS[month - 1] || 'Unknown',
    monthNameAmharic: ETHIOPIAN_MONTHS_AMHARIC[month - 1] || '',
  };
};

const ethiopianToJDN = (year, month, day) => {
  const ETHIOPIAN_EPOCH = 1724221;
  return ETHIOPIAN_EPOCH + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
};

const jdnToGregorian = (jdn) => {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);

  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);

  return new Date(year, month - 1, day);
};

// ─── Format Ethiopian Date ─────────────────────
const formatEthiopian = (gregDate, options = {}) => {
  const eth = toEthiopian(gregDate);
  const { amharic = false, includeYear = true, includeDay = true } = options;

  const monthName = amharic ? eth.monthNameAmharic : eth.monthName;

  if (!includeDay) {
    return includeYear ? `${monthName} ${eth.year} E.C.` : monthName;
  }

  return includeYear ? `${eth.day} ${monthName} ${eth.year} E.C.` : `${eth.day} ${monthName}`;
};

// ─── Format Ethiopian + Gregorian ─────────────
const formatBoth = (gregDate) => {
  const date = gregDate instanceof Date ? gregDate : new Date(gregDate);
  const eth = toEthiopian(date);
  const gregFormatted = date.toLocaleDateString('en-ET', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return `${gregFormatted} (${eth.day} ${eth.monthName} ${eth.year} E.C.)`;
};

// ─── Get Ethiopian Academic Year ──────────────
// Ethiopian academic year: Meskerem (Sep) to Sene (Jun)
const getEthiopianAcademicYear = (gregDate = new Date()) => {
  const eth = toEthiopian(gregDate);
  // Ethiopian academic year starts in Meskerem (month 1)
  // which is September in Gregorian
  // If current month is >= Meskerem (1) to Pagume (13), we are in the same EC year
  if (eth.month >= 1 && eth.month <= 10) {
    // Meskerem to Ginbot: same academic year
    return {
      ethYear: eth.year,
      label: `${eth.year} E.C.`,
      gregLabel: `${toGregorian(eth.year, 1, 1).getFullYear()}-${
        toGregorian(eth.year, 1, 1).getFullYear() + 1
      }`,
    };
  } else {
    // Sene to Pagume: next academic year starts next Meskerem
    return {
      ethYear: eth.year + 1,
      label: `${eth.year + 1} E.C.`,
      gregLabel: `${toGregorian(eth.year + 1, 1, 1).getFullYear()}-${
        toGregorian(eth.year + 1, 1, 1).getFullYear() + 1
      }`,
    };
  }
};

// ─── Ethiopian Month Name ─────────────────────
const getEthiopianMonthName = (monthNumber, amharic = false) => {
  if (monthNumber < 1 || monthNumber > 13) return null;
  return amharic ? ETHIOPIAN_MONTHS_AMHARIC[monthNumber - 1] : ETHIOPIAN_MONTHS[monthNumber - 1];
};

// ─── Is Ethiopian Holiday ─────────────────────
const isEthiopianHoliday = (gregDate) => {
  const eth = toEthiopian(gregDate);
  const { month, day } = eth;

  const holidays = [
    { month: 1, day: 1, name: 'Ethiopian New Year (Enkutatash)' },
    { month: 1, day: 17, name: 'Meskel' },
    { month: 4, day: 27, name: 'Christmas (Gena) - approx' },
    { month: 5, day: 11, name: 'Ethiopian Epiphany (Timket)' },
    { month: 8, day: 27, name: 'Martyrs Day' },
    { month: 9, day: 1, name: 'Adwa Victory Day (approx EC)' },
  ];

  const found = holidays.find((h) => h.month === month && h.day === day);

  return found || null;
};

// ─── Working Days Calculator ──────────────────
// Counts working days between two dates
// Excluding weekends and Ethiopian holidays
const countWorkingDays = (startDate, endDate, holidays = []) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  const current = new Date(start);

  const holidayStrings = holidays.map((h) => new Date(h).toDateString());

  while (current <= end) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = holidayStrings.includes(current.toDateString());

    if (!isWeekend && !isHoliday) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};

// ─── Get Current Ethiopian Date ───────────────
const getCurrentEthiopianDate = () => {
  return toEthiopian(new Date());
};

// ─── Parse Ethiopian Date String ──────────────
// Parses "1 Meskerem 2016 E.C." to object
const parseEthiopianDateString = (dateStr) => {
  if (!dateStr) return null;

  // Clean up
  const cleaned = dateStr.replace('E.C.', '').trim();
  const parts = cleaned.split(' ').filter(Boolean);

  if (parts.length < 3) return null;

  const day = parseInt(parts[0]);
  const monthName = parts[1];
  const year = parseInt(parts[2]);

  const monthIndex = ETHIOPIAN_MONTHS.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());

  if (monthIndex === -1 || isNaN(day) || isNaN(year)) {
    return null;
  }

  return { year, month: monthIndex + 1, day };
};

// ─── Days in Ethiopian Month ──────────────────
const daysInEthiopianMonth = (month, year) => {
  if (month === 13) {
    // Pagume: 5 days normally, 6 in leap year
    return year % 4 === 3 ? 6 : 5;
  }
  return 30; // All other months have exactly 30 days
};

module.exports = {
  toEthiopian,
  toGregorian,
  formatEthiopian,
  formatBoth,
  getEthiopianAcademicYear,
  getEthiopianMonthName,
  isEthiopianHoliday,
  countWorkingDays,
  getCurrentEthiopianDate,
  parseEthiopianDateString,
  daysInEthiopianMonth,
  ETHIOPIAN_MONTHS,
  ETHIOPIAN_MONTHS_AMHARIC,
  ETHIOPIAN_DAYS_AMHARIC,
};
