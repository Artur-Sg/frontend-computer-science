import assert from 'node:assert/strict';
import { parseCSV, splitCsvLine, type CsvRow } from './csv-parser';


function parseCSVForTest(file: string, separator: string | RegExp): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const rows: CsvRow[] = [];

    parseCSV(file, separator, (err, row) => {
      if (err) {
        reject(err);

        return;
      }

      if (row === undefined) {
        resolve(rows);

        return;
      }

      rows.push(row);
    });
  });
}

{
  const row = splitCsvLine('1,2,3', ',');

  assert.deepEqual(row, ['1', '2', '3'], 'базовый split');
}

{
  const rows = await parseCSVForTest(
    'src/modules/solutions/data-formats/datasets/test-small.csv',
    ','
  );

  assert.equal(rows.length, 6, 'парсер читает все строки файла');
  assert.deepEqual(rows[0], ['id', 'name', 'city', 'note'], 'заголовок');
}

{
  const rows = await parseCSVForTest(
    'src/modules/solutions/data-formats/datasets/test-semicolon.csv',
    ';'
  );

  assert.equal(rows.length, 3, 'файл с разделителем ";"');
  assert.deepEqual(rows[0], ['id', 'name', 'score'], 'semicolon header');
}

{
  const row = splitCsvLine('"a,b",c,"d,e,f"', ',');

  assert.deepEqual(
    row,
    ['a,b', 'c', 'd,e,f'],
    'поддержка quoted полей с запятыми'
  );
}

{
  const row = splitCsvLine('a\\,b,c', ',');

  assert.deepEqual(
    row,
    ['a,b', 'c'],
    'экранирование разделителя через backslash'
  );
}

{
  const row = splitCsvLine('a,"b""q""",c', ',');

  assert.deepEqual(
    row,
    ['a', 'b"q"', 'c'],
    'двойные кавычки внутри quoted поля'
  );
}

console.log('OK: csv-parser тесты пройдены');
