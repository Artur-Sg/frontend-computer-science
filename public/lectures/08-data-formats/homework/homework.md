# ДЗ 08 — Форматы обмена данными

## 1) Поточный парсер CSV с заданным разделителем

Реализуйте поточный (`streaming`) парсер CSV-файлов с заданным разделителем и сравните его с нативной обработкой JSON.

### Что нужно сделать

- Написать парсер, который читает CSV построчно (или по чанкам), не загружая весь файл в память.
- Протестировать на файле `>= 10 МБ`, сравнив с аналогичными данными в JSON (`JSON.parse`).
- Измерить и сравнить:
  - общее время обработки;
  - время до первой записи (latency до начала получения данных);
  - пиковое потребление памяти;
  - размер данных в CSV и JSON без и со сжатием.

### Со звёздочкой

Добавить поддержку экранирования разделителя (например, `"a,b"` или `a\,b`).

```ts
import * as fs from "node:fs";
import * as readline from "node:readline";

parseCSV("./very-big-csv", ",", (err, data) => {
  if (err != null) {
    console.error(err);
    return;
  }

  console.log(data);
});

function parseCSV(
  file: string,
  separator: string,
  cb: (err: Error | null, data: string[][]) => void
) {
  const rl = readline.createInterface({
    input: fs.createReadStream(file),
    crlfDelay: Infinity
  });

  rl.on("line", (line) => {
    // ...
  });

  rl.once("close", () => {
    // ...
  });
}
```

## 2) Поточный парсинг CSV против MessagePack

Сравните ваш CSV-парсер с MessagePack на больших файлах (набор данных должен быть эквивалентным).

Оба парсера должны работать в потоке, без загрузки всех данных целиком в память.
Проанализируйте результат теми же метриками, что и в пункте 1.

Для MessagePack используйте `msgpackr` (`PackrStream` и `UnpackrStream`):
https://www.npmjs.com/package/msgpackr
