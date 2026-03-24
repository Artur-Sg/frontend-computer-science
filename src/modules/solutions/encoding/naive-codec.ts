export type CodecResult = {
  output: string;
  bits: string;
  errors: string[];
};

const upper = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const lower = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
const digits = '0123456789';
const punctuation = [
  '.', ',', '!', '?', '-', ':', ';',
  '(', ')', '[', ']', '{', '}', '"', "'",
  '«', '»', '…', '—', '/', '\\', '@', '#',
  '%', '&', '*', '+', '=', '<', '>', '_', '№'
];
const controls = [' ', '\t', '\n'];
const symbols = [...upper, ...lower, ...digits, ...punctuation, ...controls];
const index = new Map(symbols.map((s, i) => [s, i]));

function pad(n: number, size: number): string {
  return n.toString(2).padStart(size, '0');
}

function bitsOnly(str: string): string {
  return str.replace(/[^01]/g, '');
}

export function encode(text: string): CodecResult {
  const out: string[] = [];
  const errors: string[] = [];

  for (const ch of text) {
    const idx = index.get(ch);

    if (idx === undefined) {
      errors.push(`Наивная: неизвестный символ "${ch}"`);
      continue;
    }
    out.push(pad(idx, 7));
  }
  
return { output: out.join(' '), bits: out.join(''), errors };
}

export function decode(bits: string): CodecResult {
  const clean = bitsOnly(bits);
  const errors: string[] = [];

  if (clean.length % 7 !== 0) {
    errors.push('Наивная: длина битовой строки не кратна 7.');
  }
  let out = '';

  for (let i = 0; i + 7 <= clean.length; i += 7) {
    const chunk = clean.slice(i, i + 7);
    const idx = parseInt(chunk, 2);
    const ch = symbols[idx];

    if (ch === undefined) {
      errors.push(`Наивная: код ${chunk} вне диапазона.`);
      out += '�';
    } else {
      out += ch;
    }
  }
  
return { output: out, bits: clean, errors };
}
