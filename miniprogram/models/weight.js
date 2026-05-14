// WeightRecord model — validation and sanitization

const { WEIGHT_LIMITS, NOTE_LIMITS, UNITS } = require('../config/constants');

/**
 * Validate a weight record before submission.
 * @param {Object} record - { weight, unit, recordedAt, note? }
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(record) {
  const errors = [];

  if (!record || typeof record.weight !== 'number' || isNaN(record.weight)) {
    errors.push('体重必须是一个有效数字');
  } else if (record.weight < WEIGHT_LIMITS.MIN || record.weight > WEIGHT_LIMITS.MAX) {
    errors.push(`体重必须在 ${WEIGHT_LIMITS.MIN}–${WEIGHT_LIMITS.MAX} kg 之间`);
  }

  if (record.unit && ![UNITS.KG, UNITS.LB].includes(record.unit)) {
    errors.push(`单位必须是 ${UNITS.KG} 或 ${UNITS.LB}`);
  }

  if (record.recordedAt) {
    const d = new Date(record.recordedAt);
    if (isNaN(d.getTime())) {
      errors.push('无效的日期格式');
    } else if (d > new Date()) {
      errors.push('不能记录未来的日期');
    }
  }

  if (record.note && typeof record.note === 'string' && record.note.length > NOTE_LIMITS.MAX_LENGTH) {
    errors.push(`备注不能超过 ${NOTE_LIMITS.MAX_LENGTH} 个字`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Remove sensitive weight value from a record for safe logging.
 * Must be called before any console.log that touches weight data.
 * @param {Object} record
 * @returns {Object} sanitized copy
 */
function sanitizeForLogging(record) {
  if (!record) return record;
  const sanitized = { ...record };
  if (sanitized.weight !== undefined) {
    sanitized.weight = '[REDACTED]';
  }
  return sanitized;
}

module.exports = {
  validate,
  sanitizeForLogging
};
