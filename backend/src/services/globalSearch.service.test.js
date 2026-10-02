/* eslint-env jest */
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../config/env', () => ({ DB_SCHEMA: 'test_library' }));

const pool = require('../config/db');
const { searchAll } = require('./globalSearch.service');

const entityFor = sql => {
  const table = sql.match(/FROM test_library\.(\w+)/)[1];
  return table === 'book_copies' ? 'copies' : table;
};

beforeEach(() => pool.query.mockReset());

describe('global search authors and role boundaries', () => {
  test.each([
    ['student', ['books', 'authors']],
    ['librarian', ['books', 'authors', 'copies', 'members', 'loans']],
    ['admin', ['books', 'authors', 'copies', 'members', 'loans', 'users']],
  ])('%s receives matching authors and only permitted entities', async (role, permitted) => {
    const author = { author_id: 7, full_name: 'Ursula Le Guin' };
    pool.query.mockImplementation(async sql => ({
      rows: entityFor(sql) === 'authors' ? [author] : [{ entity: entityFor(sql) }],
    }));

    const results = await searchAll('Le Guin', { role, limit: 3, offset: 2 });

    expect(results.authors).toEqual([author]);
    expect(pool.query.mock.calls.map(([sql]) => entityFor(sql))).toEqual(permitted);
    for (const key of ['books', 'authors', 'copies', 'members', 'loans', 'users']) {
      expect(Array.isArray(results[key])).toBe(true);
      if (!permitted.includes(key)) expect(results[key]).toEqual([]);
    }
    const [authorSql, params] = pool.query.mock.calls.find(([sql]) => entityFor(sql) === 'authors');
    expect(authorSql).toContain('a.first_name ILIKE $1 OR a.last_name ILIKE $1');
    expect(authorSql).toContain('LIMIT $2 OFFSET $3');
    expect(params).toEqual(['%Le Guin%', 3, 2]);
  });

  test('no match returns an empty authors array after executing the author query', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const results = await searchAll('no-match');
    expect(results.authors).toEqual([]);
    expect(pool.query.mock.calls.map(([sql]) => entityFor(sql))).toEqual(['books', 'authors']);
  });

  test('search text stays in bound parameters rather than SQL', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const term = 'O\'Connor; --';
    await searchAll(term);
    const [sql, params] = pool.query.mock.calls.find(([query]) => entityFor(query) === 'authors');
    expect(sql).not.toContain(term);
    expect(params).toEqual([`%${term}%`, 10, 0]);
  });

  test('author query also matches the full name, with spaces tidied', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    await searchAll('  Ursula   Le Guin ');
    const [sql, params] = pool.query.mock.calls.find(([query]) => entityFor(query) === 'authors');
    expect(sql).toContain('CONCAT(a.first_name, \' \', a.last_name) ILIKE $1');
    expect(params).toEqual(['%Ursula Le Guin%', 10, 0]);
  });
});
