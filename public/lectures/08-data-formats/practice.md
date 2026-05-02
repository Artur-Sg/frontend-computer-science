# Практика — Форматы обмена данными

## 1. Почему «текст» в компьютере — это тоже байты

```js
const text = 'Привет';
const bytes = new TextEncoder().encode(text);

console.log(bytes);
console.log(new TextDecoder().decode(bytes));
```

- Посчитайте длину строки в символах и в байтах.
- Сравните для ASCII и кириллицы.

## 2. CSV: простое разбиение и ограничение подхода

```js
const line = 'id,name,city';
const cols = line.split(',');
console.log(cols);
```

- Почему этого недостаточно для строки вроде `"a,b",c`?
- Что должно измениться в парсере для поддержки кавычек/экранирования?

## 3. Streaming-чтение CSV

```js
import * as fs from 'node:fs';
import * as readline from 'node:readline';

const rl = readline.createInterface({
  input: fs.createReadStream('./data.csv'),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  // обработка строки сразу по мере чтения
});
```

- Чем это лучше чтения всего файла сразу для больших данных?
- В какой момент можно получить первую запись?

## 4. JSON.parse и latency до первой записи

```js
import * as fs from 'node:fs';

const text = fs.readFileSync('./data.json', 'utf8');
const rows = JSON.parse(text);
console.log(rows[0]);
```

- Когда в этом сценарии становится доступна первая запись?
- Что происходит с памятью на больших файлах?

## 5. Что мерить в сравнении форматов

Мини-чеклист для эксперимента:

- общее время обработки;
- время до первой записи;
- пиковая память;
- размер без сжатия и со сжатием.

## 6. Подготовка к ДЗ

Перед реализацией определите:

- как хранить результат (`string[][]`, объекты или поток callback);
- как обрабатывать пустые строки;
- как считать latency до первой записи;
- какой набор данных использовать, чтобы CSV/JSON/MessagePack были эквивалентны.
