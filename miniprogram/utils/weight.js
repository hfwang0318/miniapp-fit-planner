// Weight utility functions — conversion, formatting, privacy masking

/**
 * Convert kg to lb.
 * @param {number} kg
 * @returns {number}
 */
function kgToLb(kg) {
  return Math.round(kg * 2.20462 * 10) / 10;
}

/**
 * Convert lb to kg.
 * @param {number} lb
 * @returns {number}
 */
function lbToKg(lb) {
  return Math.round(lb / 2.20462 * 10) / 10;
}

/**
 * Format a weight value with its unit for display.
 * @param {number} value
 * @param {string} unit - 'kg' or 'lb'
 * @returns {string} e.g. "75.5 kg"
 */
function formatWeight(value, unit) {
  if (value == null) return '--';
  const formatted = typeof value === 'number' && value % 1 !== 0
    ? value.toFixed(1)
    : String(value);
  return `${formatted} ${unit || 'kg'}`;
}

/**
 * Mask weight for privacy in team views.
 * Returns placeholder text instead of raw value.
 * @param {number} weight
 * @returns {string}
 */
function maskWeight(weight) {
  return '[PRIVATE]';
}

/**
 * Calculate trend from weight records (most recent vs previous).
 * @param {Array<{ weight: number }>} records - sorted by date descending
 * @returns {{ direction: 'up'|'down'|'stable', delta: number }}
 */
function calculateTrend(records) {
  if (!records || records.length < 2) {
    return { direction: 'stable', delta: 0 };
  }
  const latest = records[0].weight;
  const previous = records[1].weight;
  const delta = Math.round((latest - previous) * 10) / 10;

  let direction = 'stable';
  if (delta < -0.1) direction = 'down';
  else if (delta > 0.1) direction = 'up';

  return { direction, delta };
}

module.exports = {
  kgToLb,
  lbToKg,
  formatWeight,
  maskWeight,
  calculateTrend
};
