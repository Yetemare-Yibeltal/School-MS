// ============================================
// KAT SCHOOL MANAGEMENT SYSTEM
// GENERAL HELPERS UTILITY
// kat-school/server/src/utils/helpers.util.js
// ============================================

'use strict';

const crypto = require('crypto');

// ─── String Helpers ───────────────────────────
const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeWords = (str) => {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
};

const toUpperCase = (str) => (str ? str.toUpperCase().trim() : '');

const toLowerCase = (str) => (str ? str.toLowerCase().trim() : '');

const truncate = (str, length = 100, suffix = '...') => {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + suffix;
};

const slugify = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const removeExtraSpaces = (str) => {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
};

// ─── Number Helpers ───────────────────────────
const round = (value, decimals = 2) => {
  const factor = Math.pow(10, decimals);
  return Math.round((value || 0) * factor) / factor;
};

const formatCurrency = (amount, currency = 'ETB', decimals = 2) => {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  return `${currency} ${Number(amount).toLocaleString('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

const formatNumber = (num, decimals = 0) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('en-ET', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const percentage = (part, total, decimals = 1) => {
  if (!total || total === 0) return 0;
  return round((part / total) * 100, decimals);
};

const clamp = (value, min, max) => {
  return Math.min(max, Math.max(min, value || 0));
};

// ─── Date Helpers ─────────────────────────────
const formatDate = (date, options = {}) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  };

  return d.toLocaleDateString('en-ET', {
    ...defaultOptions,
    ...options,
  });
};

const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return d.toLocaleString('en-ET', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-ET', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const daysBetween = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffMs = Math.abs(d2 - d1);
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const startOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const startOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

const isToday = (date) => {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

const isWeekend = (date) => {
  const d = new Date(date);
  return d.getDay() === 0 || d.getDay() === 6;
};

const timeAgo = (date) => {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  return formatDate(date);
};

// ─── Array Helpers ────────────────────────────
const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) groups[groupKey] = [];
    groups[groupKey].push(item);
    return groups;
  }, {});
};

const sortBy = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key];
    const bVal = typeof key === 'function' ? key(b) : b[key];

    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

const unique = (array, key = null) => {
  if (!key) return [...new Set(array)];
  const seen = new Set();
  return array.filter((item) => {
    const val = typeof key === 'function' ? key(item) : item[key];
    if (seen.has(val)) return false;
    seen.add(val);
    return true;
  });
};

const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const flatten = (array, depth = 1) => array.flat(depth);

const sum = (array, key = null) => {
  return array.reduce((acc, item) => {
    const val = key ? (typeof key === 'function' ? key(item) : item[key]) : item;
    return acc + (Number(val) || 0);
  }, 0);
};

const average = (array, key = null) => {
  if (array.length === 0) return 0;
  return sum(array, key) / array.length;
};

// ─── Object Helpers ───────────────────────────
const pick = (obj, keys) => {
  return keys.reduce((acc, key) => {
    if (key in obj) acc[key] = obj[key];
    return acc;
  }, {});
};

const omit = (obj, keys) => {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !keys.includes(key)));
};

const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

const isEmptyObject = (obj) => obj && typeof obj === 'object' && Object.keys(obj).length === 0;

const removeNullValues = (obj) => {
  const cleaned = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

// ─── Crypto Helpers ───────────────────────────
const hashSHA256 = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

const generateRandomHex = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

const generateRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// ─── Validation Helpers ───────────────────────
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isValidEthiopianPhone = (phone) => {
  const phoneRegex = /^(\+251|251|0)?[79]\d{8}$/;
  return phoneRegex.test(phone);
};

const isValidMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const isValidDate = (date) => {
  return date instanceof Date ? !isNaN(date.getTime()) : !isNaN(Date.parse(date));
};

// ─── Phone Formatting ─────────────────────────
const formatEthiopianPhone = (phone) => {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('251')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+251${cleaned.substring(1)}`;
  }
  if (cleaned.length === 9) {
    return `+251${cleaned}`;
  }
  return phone;
};

// ─── Response Builder ─────────────────────────
const buildResponse = (success, message, data = null, extras = {}) => {
  const response = { success, message, ...extras };
  if (data !== null) response.data = data;
  return response;
};

const successMessage = (message, data = null, extras = {}) =>
  buildResponse(true, message, data, extras);

const errorMessage = (message, data = null, extras = {}) =>
  buildResponse(false, message, data, extras);

// ─── Sleep ────────────────────────────────────
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Retry Utility ────────────────────────────
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      console.warn(`⚠️ Retry ${attempt}/${retries}: ${error.message}`);
      await sleep(delay * attempt);
    }
  }
};

// ─── Safe JSON Parse ──────────────────────────
const safeJSONParse = (str, fallback = null) => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

// ─── Mask Sensitive Data ──────────────────────
const maskEmail = (email) => {
  if (!email) return '';
  const [user, domain] = email.split('@');
  const masked = user.substring(0, 2) + '***' + user.slice(-1);
  return `${masked}@${domain}`;
};

const maskPhone = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  return `***${cleaned.slice(-4)}`;
};

module.exports = {
  // String
  capitalize,
  capitalizeWords,
  toUpperCase,
  toLowerCase,
  truncate,
  slugify,
  removeExtraSpaces,
  // Number
  round,
  formatCurrency,
  formatNumber,
  percentage,
  clamp,
  // Date
  formatDate,
  formatDateTime,
  formatTime,
  daysBetween,
  addDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  isToday,
  isWeekend,
  timeAgo,
  // Array
  groupBy,
  sortBy,
  unique,
  chunk,
  flatten,
  sum,
  average,
  // Object
  pick,
  omit,
  deepClone,
  isEmptyObject,
  removeNullValues,
  // Crypto
  hashSHA256,
  generateRandomHex,
  generateRandomInt,
  // Validation
  isValidEmail,
  isValidEthiopianPhone,
  isValidMongoId,
  isValidDate,
  // Phone
  formatEthiopianPhone,
  // Response
  buildResponse,
  successMessage,
  errorMessage,
  // Misc
  sleep,
  retry,
  safeJSONParse,
  maskEmail,
  maskPhone,
};
