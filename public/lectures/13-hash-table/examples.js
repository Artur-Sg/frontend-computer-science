function simpleHash(str, bucketCount) {
  let hash = 0;

  for (let i = 0; i < str.length; i += 1) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }

  return hash % bucketCount;
}

const buckets = Array.from({ length: 8 }, () => []);
const keys = ['foo', 'bar', 'baz', 'oof'];

for (const key of keys) {
  const index = simpleHash(key, buckets.length);
  buckets[index].push(key);
}

console.log('Buckets:', buckets);

const map = new Map();
map.set('user:1', { name: 'Alice' });
map.set('user:2', { name: 'Bob' });

console.log(map.get('user:1'));
console.log(map.has('user:3'));

const weak = new WeakMap();
const cacheKey = {};

weak.set(cacheKey, { expensive: true });
console.log(weak.get(cacheKey));
