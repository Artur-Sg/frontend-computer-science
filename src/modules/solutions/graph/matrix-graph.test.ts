import { strict as assert } from 'node:assert';
import { Matrix, ElementView } from './matrix';
import { Graph } from './graph';

type NumberView = ElementView<number>;

const U8View: NumberView = {
  name: 'Uint8',

  bytesPerElement: 1,

  read(view: DataView, byteOffset: number): number {
    return view.getUint8(byteOffset);
  },

  write(view: DataView, byteOffset: number, value: number): void {
    view.setUint8(byteOffset, value);
  },
};

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✔ ${name}`);
  } catch (error) {
    console.error(`✘ ${name}`);
    throw error;
  }
}

function createMatrix(size: number): Matrix<number> {
  return new Matrix(size, size, U8View);
}

test('неориентированный граф добавляет ребро в обе стороны', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: false });

  graph.addEdge(1, 2, 7);

  assert.equal(matrix.get(1, 2), 7);
  assert.equal(matrix.get(2, 1), 7);

  assert.equal(graph.hasEdge(1, 2), true);
  assert.equal(graph.hasEdge(2, 1), true);
});

test('неориентированный граф удаляет ребро в обе стороны', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: false });

  graph.addEdge(1, 2, 7);
  graph.removeEdge(1, 2);

  assert.equal(matrix.get(1, 2), 0);
  assert.equal(matrix.get(2, 1), 0);

  assert.equal(graph.hasEdge(1, 2), false);
  assert.equal(graph.hasEdge(2, 1), false);
});

test('неориентированное ребро по умолчанию имеет вес 1', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: false });

  graph.addEdge(0, 3);

  assert.equal(matrix.get(0, 3), 1);
  assert.equal(matrix.get(3, 0), 1);
});

test('hasArc проверяет строгое направление', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: false });

  matrix.set(1, 2, 5);

  assert.equal(graph.hasArc(1, 2), true);
  assert.equal(graph.hasArc(2, 1), false);
});

test('ориентированный граф добавляет дугу только в одну сторону', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(1, 2, 9);

  assert.equal(matrix.get(1, 2), 9);
  assert.equal(matrix.get(2, 1), 0);

  assert.equal(graph.hasArc(1, 2), true);
  assert.equal(graph.hasArc(2, 1), false);
});

test('ориентированный граф удаляет только указанную дугу', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(1, 2, 5);
  graph.addArc(2, 1, 8);

  graph.removeArc(1, 2);

  assert.equal(matrix.get(1, 2), 0);
  assert.equal(matrix.get(2, 1), 8);

  assert.equal(graph.hasArc(1, 2), false);
  assert.equal(graph.hasArc(2, 1), true);
});

test('addEdge в ориентированном графе работает как добавление дуги', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: true });

  graph.addEdge(0, 1, 6);

  assert.equal(matrix.get(0, 1), 6);
  assert.equal(matrix.get(1, 0), 0);

  assert.equal(graph.hasArc(0, 1), true);
  assert.equal(graph.hasArc(1, 0), false);
});

test('removeEdge в ориентированном графе удаляет только одно направление', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1, 6);
  graph.addArc(1, 0, 4);

  graph.removeEdge(0, 1);

  assert.equal(matrix.get(0, 1), 0);
  assert.equal(matrix.get(1, 0), 4);
});

test('граф выбрасывает RangeError при обращении к несуществующим вершинам', () => {
  const matrix = createMatrix(3);
  const graph = new Graph(matrix, { directed: false });

  assert.throws(() => graph.addEdge(0, 3), RangeError);
  assert.throws(() => graph.addEdge(3, 0), RangeError);
  assert.throws(() => graph.hasEdge(-4, 0), RangeError);
  assert.throws(() => graph.removeEdge(0, -4), RangeError);
});

test('traverse посещает стартовый узел с глубиной 0 и весом 0', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: false });

  const visited: Array<{ id: number; depth: number; weight: number }> = [];

  graph.traverse(1, (node, depth) => {
    visited.push({
      id: node.id,
      depth,
      weight: node.weight,
    });
  });

  assert.deepEqual(visited, [
    { id: 1, depth: 0, weight: 0 },
  ]);
});

test('traverse обходит достижимые узлы неориентированного графа', () => {
  const matrix = createMatrix(6);
  const graph = new Graph(matrix, { directed: false });

  graph.addEdge(1, 2, 10);
  graph.addEdge(1, 3, 20);
  graph.addEdge(2, 4, 30);
  graph.addEdge(3, 5, 40);

  const visited: Array<{ id: number; depth: number; weight: number }> = [];

  graph.traverse(1, (node, depth) => {
    visited.push({
      id: node.id,
      depth,
      weight: node.weight,
    });
  });

  assert.deepEqual(visited, [
    { id: 1, depth: 0, weight: 0 },
    { id: 2, depth: 1, weight: 10 },
    { id: 3, depth: 1, weight: 20 },
    { id: 4, depth: 2, weight: 30 },
    { id: 5, depth: 2, weight: 40 },
  ]);
});

test('traverse не посещает недостижимые узлы', () => {
  const matrix = createMatrix(7);
  const graph = new Graph(matrix, { directed: false });

  graph.addEdge(0, 1);
  graph.addEdge(1, 2);

  graph.addEdge(5, 6);

  const visited: number[] = [];

  graph.traverse(0, (node) => {
    visited.push(node.id);
  });

  assert.deepEqual(visited, [0, 1, 2]);
});

test('traverse не зацикливается на циклах', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: false });

  graph.addEdge(0, 1);
  graph.addEdge(1, 2);
  graph.addEdge(2, 0);

  const visited: number[] = [];

  graph.traverse(0, (node) => {
    visited.push(node.id);
  });

  assert.deepEqual(visited.sort((a, b) => a - b), [0, 1, 2]);
});

test('traverse учитывает направление в ориентированном графе', () => {
  const matrix = createMatrix(5);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1);
  graph.addArc(1, 2);
  graph.addArc(3, 0);
  graph.addArc(4, 3);

  const visited: number[] = [];

  graph.traverse(0, (node) => {
    visited.push(node.id);
  });

  assert.deepEqual(visited, [0, 1, 2]);
});

test('traverse передаёт вес дуги, по которой пришли в узел', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1, 11);
  graph.addArc(1, 2, 22);
  graph.addArc(2, 3, 33);

  const visited: Array<{ id: number; weight: number }> = [];

  graph.traverse(0, (node) => {
    visited.push({
      id: node.id,
      weight: node.weight,
    });
  });

  assert.deepEqual(visited, [
    { id: 0, weight: 0 },
    { id: 1, weight: 11 },
    { id: 2, weight: 22 },
    { id: 3, weight: 33 },
  ]);
});

test('traverse выбрасывает RangeError для несуществующего стартового узла', () => {
  const matrix = createMatrix(3);
  const graph = new Graph(matrix, { directed: false });

  assert.throws(() => {
    graph.traverse(3, () => {});
  }, RangeError);

  assert.throws(() => {
    graph.traverse(-4, () => {});
  }, RangeError);
});

test('transitiveClosure строит достиимость через промежуточные вершины', () => {
  const matrix = createMatrix(4);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1);
  graph.addArc(1, 2);
  graph.addArc(2, 3);

  const closure = graph.transitiveClosure();

  assert.equal(closure.hasArc(0, 1), true);
  assert.equal(closure.hasArc(0, 2), true);
  assert.equal(closure.hasArc(0, 3), true);

  assert.equal(closure.hasArc(1, 2), true);
  assert.equal(closure.hasArc(1, 3), true);

  assert.equal(closure.hasArc(2, 3), true);

  assert.equal(closure.hasArc(3, 0), false);
});

test('transitiveClosure не мутирует исходный граф', () => {
  const matrix = createMatrix(3);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1);
  graph.addArc(1, 2);

  const closure = graph.transitiveClosure();

  assert.equal(graph.hasArc(0, 2), false);
  assert.equal(closure.hasArc(0, 2), true);
});

test('transitiveClosure работает с несвязными компонентами', () => {
  const matrix = createMatrix(6);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1);
  graph.addArc(1, 2);

  graph.addArc(3, 4);

  const closure = graph.transitiveClosure();

  assert.equal(closure.hasArc(0, 2), true);
  assert.equal(closure.hasArc(3, 4), true);

  assert.equal(closure.hasArc(0, 4), false);
  assert.equal(closure.hasArc(3, 2), false);
});

test('transitiveClosure корректно обрабатывает цикл', () => {
  const matrix = createMatrix(3);
  const graph = new Graph(matrix, { directed: true });

  graph.addArc(0, 1);
  graph.addArc(1, 2);
  graph.addArc(2, 0);

  const closure = graph.transitiveClosure();

  assert.equal(closure.hasArc(0, 1), true);
  assert.equal(closure.hasArc(0, 2), true);

  assert.equal(closure.hasArc(1, 0), true);
  assert.equal(closure.hasArc(1, 2), true);

  assert.equal(closure.hasArc(2, 0), true);
  assert.equal(closure.hasArc(2, 1), true);
});

console.log('\nGraph tests done');
