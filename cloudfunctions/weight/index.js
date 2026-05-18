// Cloud function: weight
// Provides CRUD operations for weight records.
// Privacy: NEVER log raw weight values. Log [WEIGHT_RECORD] placeholder if needed.
// Auth: All operations require valid openid from cloud.getWXContext().OPENID.

const cloud = require('wx-server-sdk');
cloud.init({ env: 'cloud1-d5gl9zvald3fd7fab' });
const db = cloud.database();
const _ = db.command;

const WEIGHT_MIN = 20;
const WEIGHT_MAX = 500;
const VALID_UNITS = ['kg', 'lb'];
const NOTE_MAX_LENGTH = 200;
const DEFAULT_PAGE_LIMIT = 20;
const MAX_PAGE_LIMIT = 100;

/**
 * Validate weight value.
 * @param {*} weight
 * @returns {boolean}
 */
function isValidWeight(weight) {
  return typeof weight === 'number' && !isNaN(weight) && weight >= WEIGHT_MIN && weight <= WEIGHT_MAX;
}

/**
 * Validate unit.
 * @param {string} unit
 * @returns {boolean}
 */
function isValidUnit(unit) {
  return !unit || VALID_UNITS.includes(unit);
}

/**
 * Validate recordedAt date — must be valid and not in the future.
 * @param {string} dateStr
 * @returns {{ valid: boolean, isFuture: boolean }}
 */
function validateDate(dateStr) {
  if (!dateStr) return { valid: false, isFuture: false };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { valid: false, isFuture: false };
  return { valid: true, isFuture: d > new Date() };
}

/**
 * Handle create weight record.
 * @param {string} openid
 * @param {Object} event
 * @returns {Object}
 */
async function handleCreate(openid, event) {
  const { weight, unit, recordedAt, note } = event;

  // Validate weight
  if (!isValidWeight(weight)) {
    return {
      success: false,
      error: { code: 'INVALID_WEIGHT', message: '请输入有效体重（20-500 kg）' }
    };
  }

  // Validate unit
  if (unit && !isValidUnit(unit)) {
    return {
      success: false,
      error: { code: 'INVALID_WEIGHT', message: '单位必须是 kg 或 lb' }
    };
  }

  // Validate date
  if (!recordedAt) {
    return {
      success: false,
      error: { code: 'INVALID_DATE', message: '请输入有效日期' }
    };
  }

  const dateValidation = validateDate(recordedAt);
  if (!dateValidation.valid) {
    return {
      success: false,
      error: { code: 'INVALID_DATE', message: '请输入有效日期' }
    };
  }
  if (dateValidation.isFuture) {
    return {
      success: false,
      error: { code: 'FUTURE_DATE', message: '不能记录未来的日期' }
    };
  }

  // Validate note length
  if (note && typeof note === 'string' && note.length > NOTE_MAX_LENGTH) {
    return {
      success: false,
      error: { code: 'INVALID_WEIGHT', message: `备注不能超过${NOTE_MAX_LENGTH}个字` }
    };
  }

  const record = {
    weight,
    unit: unit || 'kg',
    recordedAt: new Date(recordedAt).toISOString(),
    note: note || '',
    openid,
    createdBy: openid,
    createdAt: new Date().toISOString()
  };

  const result = await db.collection('WeightRecord').add({ data: record });

  return {
    success: true,
    data: { recordId: result._id }
  };
}

/**
 * Handle list weight records.
 * @param {string} openid
 * @param {Object} event
 * @returns {Object}
 */
async function handleList(openid, event) {
  const limit = Math.min(event.limit || DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT);

  // Build where conditions
  const conditions = [{ createdBy: openid }];

  // Date range filter
  if (event.startDate) {
    conditions.push({ recordedAt: _.gte(new Date(event.startDate).toISOString()) });
  }
  if (event.endDate) {
    conditions.push({ recordedAt: _.lte(new Date(event.endDate).toISOString()) });
  }

  // Cursor-based pagination — offset is the _id of the last record from previous page
  if (event.offset) {
    const offsetDoc = await db.collection('WeightRecord').doc(event.offset).get();
    if (offsetDoc.data) {
      conditions.push({ recordedAt: _.lt(offsetDoc.data.recordedAt) });
    }
  }

  // Combine all conditions
  const whereClause = conditions.length > 1
    ? _.and(conditions)
    : conditions[0];

  const result = await db.collection('WeightRecord')
    .where(whereClause)
    .orderBy('recordedAt', 'desc')
    .limit(limit + 1) // Fetch one extra to determine hasMore
    .get();

  const records = result.data.slice(0, limit).map(r => ({
    recordId: r._id,
    weight: r.weight,
    unit: r.unit,
    recordedAt: r.recordedAt,
    note: r.note
  }));

  const hasMore = result.data.length > limit;

  return {
    success: true,
    data: { records, hasMore }
  };
}

/**
 * Handle update weight record.
 * Verifies record ownership before updating.
 * @param {string} openid
 * @param {Object} event
 * @returns {Object}
 */
async function handleUpdate(openid, event) {
  const { recordId, weight, unit, recordedAt, note } = event;

  if (!recordId) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '记录不存在' }
    };
  }

  // Fetch the record to verify ownership
  const recordResult = await db.collection('WeightRecord').doc(recordId).get();
  if (!recordResult.data) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '记录不存在' }
    };
  }

  // Ownership check
  if (recordResult.data.createdBy !== openid) {
    return {
      success: false,
      error: { code: 'NOT_OWNER', message: '无权操作此记录' }
    };
  }

  // Build update data — only include provided fields
  const updateData = {};

  if (weight !== undefined) {
    if (!isValidWeight(weight)) {
      return {
        success: false,
        error: { code: 'INVALID_WEIGHT', message: '请输入有效体重（20-500 kg）' }
      };
    }
    updateData.weight = weight;
  }

  if (unit !== undefined) {
    if (!isValidUnit(unit)) {
      return {
        success: false,
        error: { code: 'INVALID_WEIGHT', message: '单位必须是 kg 或 lb' }
      };
    }
    updateData.unit = unit;
  }

  if (recordedAt !== undefined) {
    const dateValidation = validateDate(recordedAt);
    if (!dateValidation.valid) {
      return {
        success: false,
        error: { code: 'INVALID_DATE', message: '请输入有效日期' }
      };
    }
    if (dateValidation.isFuture) {
      return {
        success: false,
        error: { code: 'FUTURE_DATE', message: '不能记录未来的日期' }
      };
    }
    updateData.recordedAt = new Date(recordedAt).toISOString();
  }

  if (note !== undefined) {
    if (typeof note === 'string' && note.length > NOTE_MAX_LENGTH) {
      return {
        success: false,
        error: { code: 'INVALID_WEIGHT', message: `备注不能超过${NOTE_MAX_LENGTH}个字` }
      };
    }
    updateData.note = note;
  }

  await db.collection('WeightRecord').doc(recordId).update({ data: updateData });

  return {
    success: true,
    data: { recordId }
  };
}

/**
 * Handle delete weight record.
 * Verifies record ownership before deleting.
 * @param {string} openid
 * @param {Object} event
 * @returns {Object}
 */
async function handleDelete(openid, event) {
  const { recordId } = event;

  if (!recordId) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '记录不存在' }
    };
  }

  // Fetch the record to verify ownership
  const recordResult = await db.collection('WeightRecord').doc(recordId).get();
  if (!recordResult.data) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: '记录不存在' }
    };
  }

  // Ownership check
  if (recordResult.data.createdBy !== openid) {
    return {
      success: false,
      error: { code: 'NOT_OWNER', message: '无权操作此记录' }
    };
  }

  await db.collection('WeightRecord').doc(recordId).remove();

  return { success: true };
}

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();

    if (!OPENID) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: '请先登录' }
      };
    }

    switch (event.type) {
      case 'create':
        return await handleCreate(OPENID, event);
      case 'list':
        return await handleList(OPENID, event);
      case 'update':
        return await handleUpdate(OPENID, event);
      case 'delete':
        return await handleDelete(OPENID, event);
      default:
        return {
          success: false,
          error: { code: 'INVALID_TYPE', message: '无效的操作类型' }
        };
    }
  } catch (err) {
    // Privacy: log only error type, never raw error objects that may contain weight data
    console.error('[WEIGHT_RECORD] cloud function error:', err ? err.message : 'unknown');

    return {
      success: false,
      error: { code: 'SERVER_ERROR', message: '服务器错误，请稍后重试' }
    };
  }
};
