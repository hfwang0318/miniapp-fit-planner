// Manual mock for wx-server-sdk
// Provides in-memory database for cloud function testing

const mockCollections = {};

function mockDb() {
  return {
    collection: (name) => {
      if (!mockCollections[name]) {
        mockCollections[name] = [];
      }
      return {
        where: (query) => ({
          get: async () => ({
            data: mockCollections[name].filter(
              (item) => item.openid === query.openid
            ),
          }),
          update: async ({ data }) => {
            const matches = mockCollections[name].filter(
              (item) => item.openid === query.openid
            );
            if (matches.length > 0) {
              Object.assign(matches[0], data);
            }
          },
        }),
        add: async ({ data }) => {
          mockCollections[name].push(data);
          return { _id: 'mock-id-' + Date.now() };
        },
        doc: (id) => ({
          get: async () => ({
            data: mockCollections[name].find((item) => item._id === id),
          }),
          update: async ({ data }) => {
            const idx = mockCollections[name].findIndex(
              (item) => item._id === id
            );
            if (idx >= 0) Object.assign(mockCollections[name][idx], data);
          },
          remove: async () => {
            mockCollections[name] = mockCollections[name].filter(
              (item) => item._id !== id
            );
          },
        }),
      };
    },
  };
}

let mockContext = { OPENID: 'test-openid-123' };

function __setMockContext(context) {
  mockContext = { ...mockContext, ...context };
}

function __resetMockData() {
  Object.keys(mockCollections).forEach((key) => delete mockCollections[key]);
}

const mockCloud = {
  init: function () { return this; },
  getWXContext: function () { return mockContext; },
  database: mockDb,
};

module.exports = mockCloud;

module.exports.__setMockContext = __setMockContext;
module.exports.__resetMockData = __resetMockData;
