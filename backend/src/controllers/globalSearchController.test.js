/* eslint-env jest */
jest.mock('../services/globalSearch.service', () => ({ searchAll: jest.fn() }));
jest.mock('../utils/response', () => ({ sendSuccess: jest.fn() }));
const service = require('../services/globalSearch.service');
const { sendSuccess } = require('../utils/response');
const { globalSearch } = require('./globalSearchController');

beforeEach(() => {
  jest.clearAllMocks();
  service.searchAll.mockResolvedValue({ books: [] });
});

const run = async query => {
  const next = jest.fn();
  await globalSearch({ query, user: { role: 'librarian' } }, {}, next);
  return next;
};

test.each([
  { q: ['book', 'author'] }, { q: { nested: 'book' } },
  { q: 'book', limit: '-1' }, { q: 'book', limit: '0' },
  { q: 'book', limit: '2x' }, { q: 'book', limit: '1.5' },
  { q: 'book', limit: '' }, { q: 'book', limit: ['2'] },
  { q: 'book', offset: '-1' }, { q: 'book', offset: '2x' },
  { q: 'book', offset: '1.5' }, { q: 'book', offset: ['2'] },
  { q: 'book', offset: '9007199254740992' },
])('rejects malformed query before calling search: %j', async query => {
  const next = await run(query);
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(service.searchAll).not.toHaveBeenCalled();
  expect(sendSuccess).not.toHaveBeenCalled();
});

test('trims text and preserves default pagination and viewer role', async () => {
  const next = await run({ q: ' book ' });
  expect(next).not.toHaveBeenCalled();
  expect(service.searchAll).toHaveBeenCalledWith('book', { limit: 10, offset: 0, role: 'librarian' });
  expect(sendSuccess).toHaveBeenCalled();
});

test('accepts explicit integer pagination including zero offset', async () => {
  await run({ q: 'book', limit: '25', offset: '0' });
  expect(service.searchAll).toHaveBeenCalledWith('book', { limit: 25, offset: 0, role: 'librarian' });
});

test('rejects blank search text', async () => {
  const next = await run({ q: '  ' });
  expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  expect(service.searchAll).not.toHaveBeenCalled();
});
