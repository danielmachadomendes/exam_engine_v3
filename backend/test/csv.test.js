const test = require('node:test');
const assert = require('node:assert/strict');
const { parseCsv, serializeCsv } = require('../utils/csv');

test('CSV serialization round-trips commas, quotes, newlines, Unicode, and formula-like values', () => {
  const rows = [
    {
      id: '',
      title: 'Quoted, "title"\r\ncontinued',
      question: '=SUM(A1:A2)',
      apostrophe: "'literal",
      unicode: 'Domínio – café',
    },
  ];
  const csv = serializeCsv(Object.keys(rows[0]), rows);
  const parsed = parseCsv(csv);
  assert.deepEqual(parsed.rows.map(({ values }) => values), rows);
});

test('CSV parser reports malformed rows and unterminated quoted fields', () => {
  assert.throws(() => parseCsv('id,name\n1'), /row 2 has 1 columns; expected 2/);
  assert.throws(() => parseCsv('id,name\n1,"unfinished'), /unterminated quoted field/);
  assert.throws(() => parseCsv('id,name\n1,"closed"x'), /unexpected content after a quoted field/);
});

test('CSV parser rejects duplicate headers and empty files', () => {
  assert.throws(() => parseCsv('id,id\n1,2'), /headers cannot be duplicated/);
  assert.throws(() => parseCsv(' \r\n'), /CSV file is empty/);
});
