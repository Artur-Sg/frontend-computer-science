(function (global) {
  const upper = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const lower = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
  const digits = '0123456789';

  const baseCodes = {
    'а': '01101',
    'б': '0100110',
    'в': '00001',
    'г': '0101100',
    'д': '001110',
    'е': '01111',
    'ё': '00000111100',
    'ж': '01110010',
    'з': '0100111',
    'и': '01100',
    'й': '0000010',
    'к': '010111',
    'л': '011101',
    'м': '010010',
    'н': '01010',
    'о': '0010',
    'п': '000111',
    'р': '00010',
    'с': '00110',
    'т': '01000',
    'у': '000110',
    'ф': '0000011111',
    'х': '01110011',
    'ц': '001111111',
    'ч': '0011110',
    'ш': '00111110',
    'щ': '001111110',
    'ъ': '00000111101',
    'ы': '0111000',
    'ь': '0101101',
    'э': '000001110',
    'ю': '0000110',
    'я': '000000'
  };

  const tokenCodes = {
    SPACE: '10',
    '.': '1100',
    ',': '1101',
    '!': '11100',
    '?': '11101',
    '-': '111100',
    ':': '111101',
    ';': '111110',
    TAB: '11111110',
    NL: '111111110',
    SHIFT: '11111111100',
    CAPS: '11111111101',
    NUM: '11111111110',
    PUNC: '11111111111'
  };

  const punc5 = {
    '(': '00000',
    ')': '00001',
    '[': '00010',
    ']': '00011',
    '{': '00100',
    '}': '00101',
    '"': '00110',
    "'": '00111',
    '«': '01000',
    '»': '01001',
    '…': '01010',
    '—': '01011',
    '/': '01100',
    '\\': '01101',
    '@': '01110',
    '#': '01111',
    '%': '10000',
    '&': '10001',
    '*': '10010',
    '+': '10011',
    '=': '10100',
    '<': '10101',
    '>': '10110',
    '_': '10111',
    '№': '11000'
  };

  const punc5Rev = Object.fromEntries(Object.entries(punc5).map(([k, v]) => [v, k]));
  const digit4 = {
    '0': '0000',
    '1': '0001',
    '2': '0010',
    '3': '0011',
    '4': '0100',
    '5': '0101',
    '6': '0110',
    '7': '0111',
    '8': '1000',
    '9': '1001'
  };
  const digit4Rev = Object.fromEntries(Object.entries(digit4).map(([k, v]) => [v, k]));

  function pad(n, size) {
    return n.toString(2).padStart(size, '0');
  }

  function bitsOnly(str) {
    return str.replace(/[^01]/g, '');
  }

  function buildTrie(map) {
    const root = {};
    for (const [symbol, code] of Object.entries(map)) {
      let node = root;
      for (const bit of code) {
        node[bit] = node[bit] || {};
        node = node[bit];
      }
      node.value = symbol;
    }
    return root;
  }

  const decodeMap = { ...baseCodes, ...tokenCodes };
  const trie = buildTrie(decodeMap);

  function decodeNext(bits, start) {
    let node = trie;
    for (let i = start; i < bits.length; i++) {
      const bit = bits[i];
      node = node[bit];
      if (!node) return null;
      if (node.value) return { value: node.value, next: i + 1 };
    }
    return null;
  }

  function encode(text) {
    const out = [];
    const errors = [];

    const lowerSet = new Set(lower);
    const upperSet = new Set(upper);

    let i = 0;
    while (i < text.length) {
      const ch = text[i];

      if (digits.includes(ch)) {
        let j = i;
        let buf = '';
        while (j < text.length && digits.includes(text[j]) && buf.length < 15) {
          buf += digit4[text[j]];
          j++;
        }
        out.push(tokenCodes.NUM);
        out.push(pad(buf.length / 4, 4));
        out.push(buf);
        i = j;
        continue;
      }

      if (upperSet.has(ch)) {
        let j = i;
        while (j < text.length && upperSet.has(text[j])) j++;
        const run = text.slice(i, j);
        if (run.length >= 2) {
          out.push(tokenCodes.CAPS);
          for (const letter of run) {
            const low = letter.toLowerCase();
            const code = baseCodes[low];
            if (!code) {
              errors.push(`Схема с режимами и префиксным кодом: неизвестная буква "${letter}"`);
              continue;
            }
            out.push(code);
          }
          out.push(tokenCodes.CAPS);
        } else {
          const low = ch.toLowerCase();
          const code = baseCodes[low];
          if (!code) {
            errors.push(`Схема с режимами и префиксным кодом: неизвестная буква "${ch}"`);
          } else {
            out.push(tokenCodes.SHIFT);
            out.push(code);
          }
        }
        i = j;
        continue;
      }

      if (lowerSet.has(ch)) {
        const code = baseCodes[ch];
        if (!code) errors.push(`Схема с режимами и префиксным кодом: неизвестная буква "${ch}"`);
        else out.push(code);
        i++;
        continue;
      }

      if (ch === ' ') {
        out.push(tokenCodes.SPACE);
        i++;
        continue;
      }
      if (ch === '\t') {
        out.push(tokenCodes.TAB);
        i++;
        continue;
      }
      if (ch === '\n') {
        out.push(tokenCodes.NL);
        i++;
        continue;
      }

      if (tokenCodes[ch]) {
        out.push(tokenCodes[ch]);
        i++;
        continue;
      }

      if (punc5[ch]) {
        out.push(tokenCodes.PUNC + punc5[ch]);
        i++;
        continue;
      }

      errors.push(`Схема с режимами и префиксным кодом: неизвестный символ "${ch}"`);
      i++;
    }

    return { output: out.join(' '), bits: out.join(''), errors };
  }

  function decode(bits) {
    const clean = bitsOnly(bits);
    const errors = [];
    let out = '';
    let i = 0;
    let caps = false;

    while (i < clean.length) {
      const res = decodeNext(clean, i);
      if (!res) {
        errors.push('Схема с режимами и префиксным кодом: не удалось декодировать последовательность битов.');
        break;
      }

      const value = res.value;
      i = res.next;

      if (value === 'SPACE') {
        out += ' ';
        continue;
      }
      if (value === 'TAB') {
        out += '\t';
        continue;
      }
      if (value === 'NL') {
        out += '\n';
        continue;
      }
      if (value === 'SHIFT') {
        const next = decodeNext(clean, i);
        if (!next) {
          errors.push('Схема с режимами и префиксным кодом: SHIFT без символа.');
          break;
        }
        const letter = next.value;
        i = next.next;
        if (baseCodes[letter]) {
          out += letter.toUpperCase();
        } else {
          errors.push('Схема с режимами и префиксным кодом: SHIFT ожидает букву.');
        }
        continue;
      }
      if (value === 'CAPS') {
        caps = !caps;
        continue;
      }
      if (value === 'NUM') {
        if (i + 4 > clean.length) {
          errors.push('Схема с режимами и префиксным кодом: не хватает бит для длины NUM.');
          break;
        }
        const len = parseInt(clean.slice(i, i + 4), 2);
        i += 4;
        for (let k = 0; k < len; k++) {
          if (i + 4 > clean.length) {
            errors.push('Схема с режимами и префиксным кодом: не хватает бит для цифр NUM.');
            i = clean.length;
            break;
          }
          const code = clean.slice(i, i + 4);
          i += 4;
          const digit = digit4Rev[code];
          if (digit === undefined) {
            errors.push(`Схема с режимами и префиксным кодом: неизвестный код цифры ${code}.`);
            out += '�';
          } else {
            out += digit;
          }
        }
        continue;
      }

      if (value === 'PUNC') {
        if (i + 5 > clean.length) {
          errors.push('Схема с режимами и префиксным кодом: не хватает бит для PUNC.');
          break;
        }
        const code = clean.slice(i, i + 5);
        i += 5;
        const sym = punc5Rev[code];
        if (!sym) {
          errors.push(`Схема с режимами и префиксным кодом: неизвестный PUNC код ${code}.`);
          out += '�';
        } else {
          out += sym;
        }
        continue;
      }

      if (baseCodes[value]) {
        out += caps ? value.toUpperCase() : value;
        continue;
      }

      if (tokenCodes[value]) {
        out += value;
        continue;
      }

      if (value.length === 1) {
        out += value;
      } else {
        errors.push(`Схема с режимами и префиксным кодом: неизвестный токен ${value}.`);
      }
    }

    return { output: out, bits: clean, errors };
  }

  global.PrefixCodec = { encode, decode };
})(window);
