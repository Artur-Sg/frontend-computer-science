// Лекция 12. Мини-примеры

// 1) WeakMap не удерживает ключ живым
const metadata = new WeakMap();

let user = { id: 1, name: 'Alice' };
metadata.set(user, { lastSeen: Date.now() });

console.log('metadata:', metadata.get(user));
user = null;

// 2) WeakRef даёт слабую ссылку на объект
let data = { huge: new Array(10).fill('x') };
const ref = new WeakRef(data);

console.log('weak ref before clear:', ref.deref());
data = null;

// 3) FinalizationRegistry для наблюдения, а не для деструктора
const registry = new FinalizationRegistry((label) => {
  console.log('GC собрал объект:', label);
});

let session = { token: 'abc' };
registry.register(session, 'session');
session = null;

// 4) Disposable-объект
class TimerResource {
  constructor(label) {
    this.label = label;
    this.id = setInterval(() => {}, 1000);
  }

  [Symbol.dispose]() {
    clearInterval(this.id);
    console.log(`timer ${this.label} disposed`);
  }
}

{
  using timer = new TimerResource('demo');
  console.log('timer active:', timer.label);
}
