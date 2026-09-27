const FORMULA_PREFIX_RE = /^[\u0000-\u0020]*[=+\-@]/;

function parseCsv(content) {
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('CSV file is empty');
  }

  const source = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
  const records = [];
  let record = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;
  let line = 1;
  let recordLine = 1;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (quoted) {
      if (char === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += char;
        if (char === '\n') line += 1;
      }
      continue;
    }

    if (closedQuote && char !== ',' && char !== '\r' && char !== '\n') {
      throw new Error(`CSV has unexpected content after a quoted field on line ${line}`);
    }
    if (closedQuote) closedQuote = false;

    if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === '"') {
      throw new Error(`CSV has an unexpected quote on line ${line}`);
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\r' || char === '\n') {
      record.push(field);
      field = '';
      if (record.some((value) => value !== '')) records.push({ values: record, line: recordLine });
      record = [];
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      line += 1;
      recordLine = line;
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error('CSV contains an unterminated quoted field');
  record.push(field);
  if (record.some((value) => value !== '')) records.push({ values: record, line: recordLine });
  if (!records.length) throw new Error('CSV file has no header row');

  const headers = records[0].values.map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error('CSV headers cannot be empty');
  if (new Set(headers).size !== headers.length) throw new Error('CSV headers cannot be duplicated');

  const rows = records.slice(1).map(({ values, line: rowLine }) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${rowLine} has ${values.length} columns; expected ${headers.length}`);
    }
    return {
      line: rowLine,
      values: Object.fromEntries(headers.map((header, index) => [header, unescapeCell(values[index])])),
    };
  });

  if (!rows.length) throw new Error('CSV file contains no data rows');
  if (rows.length > 5000) throw new Error('CSV files cannot contain more than 5,000 data rows');
  return { headers, rows };
}

function unescapeCell(value) {
  if (value.startsWith("''") || (value.startsWith("'") && FORMULA_PREFIX_RE.test(value.slice(1)))) {
    return value.slice(1);
  }
  return value;
}

function serializeCsv(headers, rows) {
  const escape = (value) => {
    let text = value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
    if (text.startsWith("'") || FORMULA_PREFIX_RE.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };

  return '\uFEFF' + [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\r\n') + '\r\n';
}

function requireHeaders(headers, required) {
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) throw new Error('CSV is missing required columns: ' + missing.join(', '));
}

module.exports = { parseCsv, serializeCsv, requireHeaders };
