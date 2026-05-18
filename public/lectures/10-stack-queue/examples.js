// Лекция 10. Мини-примеры

// 1) Простой стек
class Stack {
  #data = [];

  get length() {
    return this.#data.length;
  }

  push(value) {
    this.#data.push(value);
    return this.length;
  }

  pop() {
    return this.#data.pop();
  }

  peek() {
    return this.#data[this.#data.length - 1];
  }
}

// 2) Очередь на массиве (наивно)
class QueueArray {
  #data = [];

  enqueue(value) {
    this.#data.push(value);
    return this.#data.length;
  }

  dequeue() {
    return this.#data.shift();
  }
}

// 3) Deque на кольцевом буфере
class Deque {
  #buffer;
  #start = 0;
  #end = 0;
  #length = 0;

  constructor(capacity = 4) {
    this.#buffer = new Array(Math.max(4, capacity >>> 0));
  }

  get capacity() {
    return this.#buffer.length;
  }

  get length() {
    return this.#length;
  }

  push(value) {
    if (this.#length === this.capacity) return false;
    this.#buffer[this.#end] = value;
    this.#end = (this.#end + 1) % this.capacity;
    this.#length++;
    return true;
  }

  shift() {
    if (this.#length === 0) return undefined;
    const value = this.#buffer[this.#start];
    this.#buffer[this.#start] = undefined;
    this.#start = (this.#start + 1) % this.capacity;
    this.#length--;
    return value;
  }
}
