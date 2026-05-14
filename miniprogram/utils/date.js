// Date utility functions

/**
 * Format a date to YYYY-MM-DD string.
 * @param {Date|string} date
 * @returns {string} formatted date
 */
function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date to short display form (MM月DD日).
 * @param {Date|string} date
 * @returns {string}
 */
function formatDateShort(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * Check if a date is in the future.
 * @param {Date|string} date
 * @returns {boolean}
 */
function isFutureDate(date) {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return d > today;
}

/**
 * Get today as YYYY-MM-DD string.
 * @returns {string}
 */
function today() {
  return formatDate(new Date());
}

/**
 * Calculate days between two dates.
 * @param {Date|string} a
 * @param {Date|string} b
 * @returns {number}
 */
function daysBetween(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return Math.abs(Math.round((db - da) / (1000 * 60 * 60 * 24)));
}

module.exports = {
  formatDate,
  formatDateShort,
  isFutureDate,
  today,
  daysBetween
};
