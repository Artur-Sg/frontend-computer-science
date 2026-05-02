import * as fs from 'node:fs';
import * as readline from 'node:readline';

export type CsvRow = string[];

export function splitCsvLine(line: string, separator = ','): CsvRow {
  // Экранируем спецсимволы RegExp в разделителе (например |, ., ?, +),
  // чтобы использовать separator как буквальный символ в шаблоне.
  const sep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return line
    .split(new RegExp(`(?<!\\\\)${sep}(?=(?:[^"]*"[^"]*")*[^"]*$)`))
    .map((field) =>
      field
        .replace(/^"(.*)"$/, '$1')
        .replace(/""/g, '"')
        .replace(new RegExp(`\\\\${sep}`, 'g'), separator)
    );
}

export function parseCSV(
  file: string,
  separator: string | RegExp,
  callback: (err: Error | null, data?: CsvRow) => void
): void {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity,
  });

  rl.on('line', (line) => {
    callback(null, splitCsvLine(line, separator));
  });

  rl.once('error', (error) => {
    callback(error);
  });

  rl.once('close', () => {
    callback(null);
  });
}
