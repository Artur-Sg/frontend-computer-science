import { strict as assert } from 'node:assert';
import { Memory } from './memory';
import { Rc } from './RC';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

function createMemory(totalSize: number, options: { stack: number }): Memory {
  return new Memory(totalSize, { stack: options.stack });
}

function bytes(buffer: ArrayBuffer): number[] {
  return [...new Uint8Array(buffer)];
}

test('Конструктор создаёт менеджер памяти с корректными параметрами', () => {
  const memory = createMemory(100 * 1024, { stack: 10 * 1024 });

  assert.ok(memory instanceof Memory);
  assert.equal(memory.buffer.byteLength, 100 * 1024);
  assert.equal(memory.stackSize, 10 * 1024);
  assert.equal(memory.stackPointer, 0);
});

test('Конструктор выбрасывает ошибку, если стек больше общей памяти', () => {
  assert.throws(() => {
    createMemory(100, { stack: 200 });
  });
});

test('Конструктор выбрасывает ошибку, если стек занимает всю память', () => {
  assert.throws(() => {
    createMemory(100, { stack: 100 });
  });
});

test('Конструктор выбрасывает ошибку, если размер стека отрицательный', () => {
  assert.throws(() => {
    createMemory(100, { stack: -1 });
  });
});

test('Конструктор выбрасывает ошибку, если общий размер памяти некорректный', () => {
  assert.throws(() => {
    createMemory(0, { stack: 10 });
  });
});

test('push кладёт данные в стек и возвращает указатель на них', () => {
  const memory = createMemory(100, { stack: 10 });

  const data = new Uint8Array([1, 2, 3]).buffer;
  const pointer = memory.push(data);

  assert.deepEqual(bytes(pointer.deref()), [1, 2, 3]);
  assert.equal(memory.stackPointer, 3);
});

test('push выравнивает следующий стековый блок по границе 8 байт', () => {
  const memory = createMemory(100, { stack: 24 });

  const p1 = memory.push(new Uint8Array([1, 2, 3]).buffer);
  const p2 = memory.push(new Uint8Array([4]).buffer);

  assert.equal(p1.offset, 0);
  assert.equal(p2.offset, 8);
  assert.equal(memory.stackPointer, 9);
});

test('push выбрасывает ошибку при переполнении стека', () => {
  const memory = createMemory(100, { stack: 3 });
  const data = new Uint8Array([1, 2, 3, 4]).buffer;

  assert.throws(() => {
    memory.push(data);
  });
});

test('push учитывает уже занятое место в стеке', () => {
  const memory = createMemory(100, { stack: 5 });

  memory.push(new Uint8Array([1, 2, 3]).buffer);

  assert.throws(() => {
    memory.push(new Uint8Array([4, 5, 6]).buffer);
  });

  assert.equal(memory.stackPointer, 3);
});

test('pointer.change заменяет данные по указателю', () => {
  const memory = createMemory(100, { stack: 10 });
  const pointer = memory.push(new Uint8Array([1, 2, 3]).buffer);

  pointer.change(new Uint8Array([4, 5, 6]).buffer);

  assert.deepEqual(bytes(pointer.deref()), [4, 5, 6]);
  assert.equal(memory.stackPointer, 3);
});

test('pointer.change выбрасывает ошибку, если новый размер отличается', () => {
  const memory = createMemory(100, { stack: 10 });
  const pointer = memory.push(new Uint8Array([1, 2, 3]).buffer);

  assert.throws(() => {
    pointer.change(new Uint8Array([4, 5]).buffer);
  });

  assert.deepEqual(bytes(pointer.deref()), [1, 2, 3]);
});

test('pointer.change изменяет данные внутри общего буфера памяти', () => {
  const memory = createMemory(100, { stack: 10 });
  const pointer = memory.push(new Uint8Array([1, 2, 3]).buffer);

  pointer.change(new Uint8Array([4, 5, 6]).buffer);

  assert.deepEqual(bytes(memory.buffer).slice(0, 3), [4, 5, 6]);
});

test('pop удаляет последний добавленный блок из стека', () => {
  const memory = createMemory(100, { stack: 10 });

  memory.push(new Uint8Array([1, 2, 3]).buffer);
  memory.push(new Uint8Array([4, 5]).buffer);

  assert.equal(memory.stackPointer, 10);

  memory.pop();

  assert.equal(memory.stackPointer, 3);
});

test('pop выбрасывает ошибку, если стек пуст', () => {
  const memory = createMemory(100, { stack: 10 });

  assert.throws(() => {
    memory.pop();
  });
});

test('указатель на удалённый из стека блок становится невалидным', () => {
  const memory = createMemory(100, { stack: 10 });
  const pointer = memory.push(new Uint8Array([1, 2, 3]).buffer);

  memory.pop();

  assert.throws(() => {
    pointer.deref();
  });

  assert.throws(() => {
    pointer.change(new Uint8Array([4, 5, 6]).buffer);
  });
});

test('pop инвалидирует только последний указатель', () => {
  const memory = createMemory(100, { stack: 10 });

  const p1 = memory.push(new Uint8Array([1, 2, 3]).buffer);
  const p2 = memory.push(new Uint8Array([4, 5]).buffer);

  memory.pop();

  assert.deepEqual(bytes(p1.deref()), [1, 2, 3]);

  assert.throws(() => {
    p2.deref();
  });

  assert.equal(memory.stackPointer, 3);
});

test('alloc выделяет блок в куче и возвращает указатель на него', () => {
  const memory = createMemory(100, { stack: 10 });
  const pointer = memory.alloc(5);

  assert.equal(pointer.offset, 16);
  assert.equal(pointer.size, 5);
  assert.deepEqual(bytes(pointer.deref()), [0, 0, 0, 0, 0]);
});

test('alloc сдвигает указатель кучи после выделения', () => {
  const memory = createMemory(100, { stack: 10 });
  const p1 = memory.alloc(5);
  const p2 = memory.alloc(3);

  assert.equal(p1.offset, 16);
  assert.equal(p2.offset, 24);
  assert.equal(memory.heapPointer, 27);
});

test('alloc выбрасывает ошибку при некорректном размере', () => {
  const memory = createMemory(100, { stack: 10 });

  assert.throws(() => {
    memory.alloc(0);
  });
});

test('Symbol.dispose освобождает указатель из кучи', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer = memory.alloc(10);

  pointer[Symbol.dispose]();

  assert.throws(() => {
    pointer.deref();
  });
});

test('Symbol.dispose выбрасывает ошибку при повторном освобождении', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer = memory.alloc(10);

  pointer[Symbol.dispose]();

  assert.throws(() => {
    pointer[Symbol.dispose]();
  });
});

test('Rc делегирует change и deref во внутренний указатель', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer = new Rc(memory.alloc(3));

  pointer.change(new Uint8Array([1, 2, 3]).buffer);

  assert.deepEqual(bytes(pointer.deref()), [1, 2, 3]);
});

test('Rc делегирует change и deref во внутренний указатель', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer = new Rc(memory.alloc(3));

  pointer.change(new Uint8Array([1, 2, 3]).buffer);

  assert.deepEqual(bytes(pointer.deref()), [1, 2, 3]);
});

test('Rc.clone увеличивает счётчик ссылок', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer1 = new Rc(memory.alloc(3));
  const pointer2 = pointer1.clone();

  assert.equal(pointer1.refCount, 2);
  assert.equal(pointer2.refCount, 2);
});

test('Rc.clone увеличивает счётчик ссылок', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer1 = new Rc(memory.alloc(3));
  const pointer2 = pointer1.clone();

  assert.equal(pointer1.refCount, 2);
  assert.equal(pointer2.refCount, 2);
});

test('Rc.clone создаёт владельца того же блока памяти', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer1 = new Rc(memory.alloc(3));
  const pointer2 = pointer1.clone();

  pointer1.change(new Uint8Array([1, 2, 3]).buffer);

  assert.deepEqual(bytes(pointer2.deref()), [1, 2, 3]);

  pointer2.change(new Uint8Array([4, 5, 6]).buffer);

  assert.deepEqual(bytes(pointer1.deref()), [4, 5, 6]);
});

test('Rc освобождает память после dispose последнего владельца', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer1 = new Rc(memory.alloc(4));
  const pointer2 = pointer1.clone();

  pointer1.change(new Uint8Array([1, 2, 3, 4]).buffer);

  pointer1[Symbol.dispose]();

  // Память ещё жива, потому что есть pointer2.
  assert.deepEqual(bytes(pointer2.deref()), [1, 2, 3, 4]);

  pointer2[Symbol.dispose]();

  // Теперь владельцев нет, внутренний Pointer освобождён.
  assert.throws(() => {
    pointer2.deref();
  });
});

test('Rc не освобождает память, пока есть другие владельцы', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer1 = new Rc(memory.alloc(3));
  const pointer2 = pointer1.clone();

  pointer1.change(new Uint8Array([1, 2, 3]).buffer);

  pointer1[Symbol.dispose]();

  assert.equal(pointer2.refCount, 1);
  assert.deepEqual(bytes(pointer2.deref()), [1, 2, 3]);
});

test('Rc освобождает память после dispose последнего владельца', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer1 = new Rc(memory.alloc(3));
  const pointer2 = pointer1.clone();

  pointer1[Symbol.dispose]();
  pointer2[Symbol.dispose]();

  assert.throws(() => {
    pointer2.deref();
  });
});

test('Rc выбрасывает ошибку при повторном dispose одного владельца', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer = new Rc(memory.alloc(3));

  pointer[Symbol.dispose]();

  assert.throws(() => {
    pointer[Symbol.dispose]();
  });
});

test('Rc не позволяет clone после dispose', () => {
  const memory = createMemory(100, { stack: 10 });

  const pointer = new Rc(memory.alloc(3));

  pointer[Symbol.dispose]();

  assert.throws(() => {
    pointer.clone();
  });
});

console.log('\nOS memory tests done');
