/**
 * Weight service — weight record CRUD and stats.
 *
 * Layer boundary: service layer only, calls cloud functions.
 * No direct cloud database access.
 *
 * Privacy: All console.log calls involving weight records MUST use
 * sanitizeForLogging() from models/weight.js before logging.
 */

const { calculateTrend } = require('../utils/weight');
const { ERROR_MESSAGES } = require('../config/constants');

/**
 * Map cloud function error codes to user-friendly messages.
 * @param {Object} cloudResult - the result.result from wx.cloud.callFunction
 * @returns {{ success: false, error: { code: string, message: string } } | null}
 */
function mapCloudError(cloudResult) {
  if (cloudResult && cloudResult.success === false) {
    const code = cloudResult.error && cloudResult.error.code;
    const message = ERROR_MESSAGES[code] || '操作失败，请重试';
    return { success: false, error: { code, message } };
  }
  return null;
}

const weightService = {
  /**
   * Create a new weight record.
   * @param {Object} params
   * @param {number} params.weight - Weight value
   * @param {string} params.unit - 'kg' or 'lb'
   * @param {string} params.recordedAt - Date string (ISO or YYYY-MM-DD)
   * @param {string} [params.note] - Optional note
   * @returns {Promise<Object>}
   */
  async createWeight({ weight, unit, recordedAt, note }) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'weight',
        data: { type: 'create', weight, unit, recordedAt, note }
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      }

      return mapCloudError(result.result) || {
        success: false,
        error: { code: 'SERVER_ERROR', message: '操作失败，请重试' }
      };
    } catch (err) {
      console.error('[WEIGHT_RECORD] createWeight error');
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR }
      };
    }
  },

  /**
   * Get weight records with optional pagination and date filtering.
   * @param {Object} params
   * @param {number} [params.limit] - Page size (default 20, max 100)
   * @param {string} [params.startDate] - Filter: start date (YYYY-MM-DD)
   * @param {string} [params.endDate] - Filter: end date (YYYY-MM-DD)
   * @param {string} [params.offset] - Cursor (recordId of last record from previous page)
   * @returns {Promise<Object>}
   */
  async getWeights({ limit, startDate, endDate, offset } = {}) {
    try {
      const data = { type: 'list' };
      if (limit !== undefined) data.limit = limit;
      if (startDate) data.startDate = startDate;
      if (endDate) data.endDate = endDate;
      if (offset) data.offset = offset;

      const result = await wx.cloud.callFunction({
        name: 'weight',
        data
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      }

      return mapCloudError(result.result) || {
        success: false,
        error: { code: 'SERVER_ERROR', message: '操作失败，请重试' }
      };
    } catch (err) {
      console.error('[WEIGHT_RECORD] getWeights error');
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR }
      };
    }
  },

  /**
   * Update a weight record.
   * Only fields that are not undefined will be updated.
   * @param {Object} params
   * @param {string} params.recordId - ID of the record to update
   * @param {number} [params.weight] - Updated weight value
   * @param {string} [params.unit] - Updated unit
   * @param {string} [params.recordedAt] - Updated date
   * @param {string} [params.note] - Updated note
   * @returns {Promise<Object>}
   */
  async updateWeight({ recordId, weight, unit, recordedAt, note }) {
    try {
      const data = { type: 'update', recordId };
      if (weight !== undefined) data.weight = weight;
      if (unit !== undefined) data.unit = unit;
      if (recordedAt !== undefined) data.recordedAt = recordedAt;
      if (note !== undefined) data.note = note;

      const result = await wx.cloud.callFunction({
        name: 'weight',
        data
      });

      if (result.result && result.result.success) {
        return { success: true, data: result.result.data };
      }

      return mapCloudError(result.result) || {
        success: false,
        error: { code: 'SERVER_ERROR', message: '操作失败，请重试' }
      };
    } catch (err) {
      console.error('[WEIGHT_RECORD] updateWeight error');
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR }
      };
    }
  },

  /**
   * Delete a weight record.
   * @param {string} recordId - ID of the record to delete
   * @returns {Promise<Object>}
   */
  async deleteWeight(recordId) {
    try {
      const result = await wx.cloud.callFunction({
        name: 'weight',
        data: { type: 'delete', recordId }
      });

      if (result.result && result.result.success) {
        return { success: true };
      }

      return mapCloudError(result.result) || {
        success: false,
        error: { code: 'SERVER_ERROR', message: '操作失败，请重试' }
      };
    } catch (err) {
      console.error('[WEIGHT_RECORD] deleteWeight error');
      return {
        success: false,
        error: { code: 'NETWORK_ERROR', message: ERROR_MESSAGES.NETWORK_ERROR }
      };
    }
  },

  /**
   * Calculate stats from an array of weight records.
   * Pure function — no side effects, no network calls.
   *
   * @param {Array<{ weight: number, recordedAt: string }>} records - Sorted by date descending
   * @returns {{ count: number, latest: Object|null, average: number, trend: { direction: string, delta: number } }}
   */
  getStats(records) {
    if (!records || records.length === 0) {
      return {
        count: 0,
        latest: null,
        average: 0,
        trend: { direction: 'stable', delta: 0 }
      };
    }

    const count = records.length;
    const latest = records[0];

    const sum = records.reduce((acc, r) => acc + r.weight, 0);
    const average = Math.round((sum / count) * 10) / 10;

    const trend = calculateTrend(records);

    return { count, latest, average, trend };
  }
};

module.exports = weightService;
