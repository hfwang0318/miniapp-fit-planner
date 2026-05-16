/**
 * 轻量 E2E 断言库，用于 miniprogram-automator spec。
 * 失败时抛出带有 type 字段的 Error，便于报告分类。
 */

function assert(condition, message) {
  if (!condition) {
    const err = new Error(message || 'Assertion failed');
    err.type = 'ASSERT_ERROR';
    throw err;
  }
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    const err = new Error(
      `${label || 'Assertion'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
    err.type = 'ASSERT_ERROR';
    err.expected = expected;
    err.actual = actual;
    throw err;
  }
}

function assertIncludes(text, substring, label) {
  if (typeof text !== 'string' || !text.includes(substring)) {
    const err = new Error(
      `${label || 'Assertion'}: expected "${text}" to include "${substring}"`
    );
    err.type = 'ASSERT_ERROR';
    throw err;
  }
}

function assertExists(value, label) {
  if (value === null || value === undefined) {
    const err = new Error(`${label || 'Assertion'}: expected value to exist, got ${value}`);
    err.type = 'ASSERT_ERROR';
    throw err;
  }
}

function assertNoRuntimeErrors(errors) {
  if (errors && errors.length > 0) {
    const err = new Error(
      `Found ${errors.length} runtime error(s): ${JSON.stringify(errors.slice(0, 5))}`
    );
    err.type = 'ASSERT_ERROR';
    err.details = errors;
    throw err;
  }
}

module.exports = { assert, assertEqual, assertIncludes, assertExists, assertNoRuntimeErrors };
