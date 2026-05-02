import * as fs from 'node:fs';
import * as zlib from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import { PackrStream } from 'msgpackr';
import archiver from 'archiver';

const [,, inputJson, outputBase] = process.argv;

if (!inputJson || !outputBase) {
  console.error('Usage: node convert-from-json.mjs <input.json> <output-base-without-ext>');
  process.exit(1);
}

const text = fs.readFileSync(inputJson, 'utf8');
const rows = JSON.parse(text);

if (!Array.isArray(rows) || rows.length === 0) {
  console.error('Input JSON must be a non-empty array of objects');
  process.exit(1);
}

const csvPath = `${outputBase}.csv`;
const msgpackPath = `${outputBase}.msgpack`;

const headers = ['id', 'active', 'score', 'name', 'email', 'verified', 'registered_ms', 'last_seen_ms'];
const csvLines = [headers.join(',')];

for (const row of rows) {
  csvLines.push([
    String(row.id),
    row.active ? 'TRUE' : 'FALSE',
    String(row.score),
    String(row.name),
    String(row.email),
    row.verified ? 'TRUE' : 'FALSE',
    String(row.registered_ms),
    String(row.last_seen_ms)
  ].join(','));
}

fs.writeFileSync(csvPath, `${csvLines.join('\n')}\n`, 'utf8');

await writeMsgpackStream(rows, msgpackPath);

await compressAll(csvPath);
await compressAll(msgpackPath);

console.log('Done:');
for (const file of [csvPath, msgpackPath]) {
  printSize(file);
  printSize(`${file}.gz`);
  printSize(`${file}.br`);
  printSize(`${file}.zip`);
}

async function compressAll(path) {
  await compressGzip(path, `${path}.gz`);
  await compressBrotli(path, `${path}.br`);
  await compressZip(path, `${path}.zip`);
}

async function compressGzip(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createGzip({ level: 9 }),
    fs.createWriteStream(output)
  );
}

async function compressBrotli(input, output) {
  await pipeline(
    fs.createReadStream(input),
    zlib.createBrotliCompress({
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 }
    }),
    fs.createWriteStream(output)
  );
}

async function compressZip(input, output) {
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(output);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(out);
    out.on('close', resolve);
    archive.on('error', reject);
    archive.file(input, { name: input.split('/').pop() });
    archive.finalize();
  });
}

function printSize(path) {
  const size = fs.statSync(path).size;
  console.log(`${path}: ${(size / 1024 / 1024).toFixed(2)} MB`);
}

async function writeMsgpackStream(objects, outPath) {
  const writeStream = fs.createWriteStream(outPath);
  const packrStream = new PackrStream({ useRecords: true, moreTypes: true });

  packrStream.pipe(writeStream);

  await new Promise((resolve, reject) => {
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    packrStream.on('error', reject);

    for (const obj of objects) {
      packrStream.write(obj);
    }
    packrStream.end();
  });
}
