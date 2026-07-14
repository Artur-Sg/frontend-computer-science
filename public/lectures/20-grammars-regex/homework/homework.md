# Домашнее задание

## Проверка email

Необходимо написать регулярное выражение для проверки, является ли строка корректным email-адресом.

Требования:

- локальная часть (до `@`): латинские буквы, цифры, точки, подчёркивания, дефисы;
- домен (после `@`): латинские буквы, цифры, дефисы, точка;
- доменная зона: от `2` до `6` букв (например, `.com`, `.ru`, `.org`).

```js
const emailRegex = /________________________/;

console.log(emailRegex.test("user@example.com"));   // true
console.log(emailRegex.test("test@mail.ru"));       // true
console.log(emailRegex.test("user123@domain.org")); // true
console.log(emailRegex.test("invalid-email"));      // false
console.log(emailRegex.test("user@.com"));          // false
console.log(emailRegex.test("user@domain"));        // false
console.log(emailRegex.test("user@domain.c"));      // false
```

## Поиск всех чисел в тексте

Необходимо написать регулярное выражение, которое находит все числа (целые и с плавающей точкой) в тексте.

Требования:

- целые числа: `42`, `-5`, `0`;
- числа с плавающей точкой: `3.14`, `-0.5`, `.5`;
- не должны захватываться числа внутри слов (например, `version2` — не число).

```js
const numberRegex = /________________________/g;
const text = "The price is 100.5 dollars, -5 degrees, and version2 is out.";

const numbers = text.match(numberRegex);
console.log(numbers); // [ '100.5', '-5' ]
```

## Извлечение дат из текста

Необходимо написать регулярное выражение, которое находит все даты в формате `DD.MM.YYYY` или `YYYY-MM-DD`.

Требования:

- формат 1: `15.01.2025` (день.месяц.год);
- формат 2: `2025-01-15` (год-месяц-день);
- день: `01–31`, месяц: `01–12`, год: `1900–2099`.

```js
const dateRegex = /________________________/g;
const text = "Today is 15.01.2025 and tomorrow is 2025-01-16. Invalid: 32.13.2025";

const dates = text.match(dateRegex);
console.log(dates); // ["15.01.2025", "2025-01-16"]
```
