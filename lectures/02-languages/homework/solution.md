# Решение

Реализован простой интерпретатор байткода с одним аккумулятором `A` и указателем инструкции `pointer`.
Программа — массив чисел. Указатель читает текущую операцию, выполняет команду и сдвигается дальше.

## Набор инструкций

```js
const instructions = {
  'SET A': 0,
  'PRINT A': 1,
  'IFN A': 2,
  'RET': 3,
  'DEC A': 4,
  'JMP': 5,
  'ACC A': 6
};
```

## Основной цикл

- `pointer` — индекс текущей инструкции
- `acc` — аккумулятор (ячейка `A`)
- Выполняем команды в `while (pointer < program.length)`

## Логика инструкций

- `SET A` — взять следующий элемент массива как значение и записать в `A`
- `PRINT A` — вывести `A`
- `IFN A` — если `A === 0`, перейти к `RET`, иначе — к `DEC A`
- `RET` — вернуть следующее значение
- `DEC A` — уменьшить `A` на 1
- `JMP` — перейти на адрес из следующего элемента массива
- `ACC A` — увеличить `A` на 1

## Реализация

```js
const instructions = {
  'SET A': 0,
  'PRINT A': 1,
  'IFN A': 2,
  'RET': 3,
  'DEC A': 4,
  'JMP': 5,
  'ACC A': 6
};

function execute(program) {
  let pointer = 0;
  let acc = 0;

  while (pointer < program.length) {
    const operation = program[pointer];

    switch (operation) {
      case instructions['SET A']: {
        const value = program[pointer + 1];
        acc = value;
        pointer += 2;
        break;
      }

      case instructions['PRINT A']: {
        console.log(acc);
        pointer += 1;
        break;
      }

      case instructions['IFN A']: {
        if (acc === 0) {
          pointer += 1;
        } else {
          pointer += 3;
        }
        break;
      }

      case instructions['RET']: {
        const returnValue = program[pointer + 1];
        return returnValue;
      }

      case instructions['DEC A']: {
        acc -= 1;
        pointer += 1;
        break;
      }

      case instructions['JMP']: {
        const target = program[pointer + 1];
        pointer = target;
        break;
      }

      case instructions['ACC A']: {
        acc += 1;
        pointer += 1;
        break;
      }

      default:
        throw new Error(`Неизвестная инструкция: ${operation} на позиции ${pointer}`);
    }
  }
}

const program = [
  instructions['SET A'],
  10,
  instructions['PRINT A'],
  instructions['IFN A'],
  instructions['RET'],
  0,
  instructions['DEC A'],
  instructions['JMP'],
  2
];

execute(program);
```

## Результат

Программа печатает числа от 10 до 0 и возвращает `0`.
