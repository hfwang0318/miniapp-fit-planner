/**
 * Auth 云函数单元测试
 * Jest + manual mock (tests/__mocks__/wx-server-sdk.js)
 */

const path = require('path');

// Ensure mock is loaded before the cloud function
jest.mock('wx-server-sdk');

const cloud = require('wx-server-sdk');

describe('auth cloud function', () => {
  beforeEach(() => {
    cloud.__resetMockData();
    cloud.__setMockContext({ OPENID: 'test-openid-123' });
  });

  test('TC-AUTH-001: first login creates new user', async () => {
    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    const result = await main({ type: 'login' }, {});

    expect(result.success).toBe(true);
    expect(result.data.openid).toBe('test-openid-123');
    expect(result.data.isNewUser).toBe(true);
  });

  test('TC-AUTH-002: returning user login', async () => {
    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    await main({ type: 'login' }, {}); // first call creates user
    const result = await main({ type: 'login' }, {}); // second call

    expect(result.success).toBe(true);
    expect(result.data.isNewUser).toBe(false);
  });

  test('TC-AUTH-003: invalid event type', async () => {
    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    const result = await main({ type: 'invalid_type' }, {});

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_TYPE');
  });

  test('TC-AUTH-004: missing OPENID returns UNAUTHORIZED', async () => {
    cloud.__setMockContext({ OPENID: '' });

    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    const result = await main({ type: 'login' }, {});

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });

  test('TC-AUTH-009: handleUpdateProfile updates nickName successfully', async () => {
    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    // First login to create user
    await main({ type: 'login' }, {});
    // Then update profile
    const result = await main({ type: 'updateProfile', nickName: 'TestUser' }, {});

    expect(result.success).toBe(true);
    expect(result.data.nickName).toBe('TestUser');
  });

  test('TC-AUTH-010: handleUpdateProfile with empty nickName returns INVALID_PARAMS', async () => {
    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    const result = await main({ type: 'updateProfile', nickName: '' }, {});

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_PARAMS');
  });

  test('TC-AUTH-011: handleUpdateProfile with too long nickName returns INVALID_PARAMS', async () => {
    const { main } = require(path.join(process.cwd(), 'cloudfunctions/auth/index'));
    const result = await main({ type: 'updateProfile', nickName: 'a'.repeat(31) }, {});

    expect(result.success).toBe(false);
    expect(result.error.code).toBe('INVALID_PARAMS');
  });
});
