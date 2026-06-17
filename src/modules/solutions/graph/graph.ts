import { Matrix } from './matrix';

export interface GraphOptions {
  directed?: boolean;
}

export interface TraversedNode<T> {
  id: number;
  weight: T | undefined;
}

export class Graph<T = number> {
  readonly matrix: Matrix<T>;
  readonly directed: boolean;

  constructor(matrix: Matrix<T>, options: GraphOptions = {}) {
    if (matrix.width !== matrix.height) {
      throw new Error('Матрица смежности должна быть квадратной');
    }

    this.matrix = matrix;
    this.directed = options.directed ?? false;
  }

  hasArc(from: number, to: number): boolean {
    return !this.matrix.elementView.isZero(this.matrix.get(from, to));
  }

  addArc(from: number, to: number, weight: T = this.matrix.elementView.one): void {
    this.matrix.set(from, to, weight);
  }

  removeArc(from: number, to: number): void {
    this.matrix.set(from, to, this.matrix.elementView.zero);
  }

  hasEdge(from: number, to: number): boolean {
    if (this.directed) {
      return this.hasArc(from, to);
    }

    return this.hasArc(from, to) && this.hasArc(to, from);
  }

  addEdge(from: number, to: number, weight: T = this.matrix.elementView.one): void {
    this.matrix.set(from, to, weight);

    if (!this.directed) {
      this.matrix.set(to, from, weight);
    }
  }

  removeEdge(from: number, to: number): void {
    this.matrix.set(from, to, this.matrix.elementView.zero);

    if (!this.directed) {
      this.matrix.set(to, from, this.matrix.elementView.zero);
    }
  }

  traverse(start: number, callback: (node: TraversedNode<T>, depth: number) => void): void {
    this.assertNode(start);

    const visited = new Set<number>();
    const queue: Array<TraversedNode<T> & { depth: number }> = [
      { id: start, weight: undefined, depth: 0 },
    ];
    let head = 0;

    while (head < queue.length) {
      const current = queue[head];

      head += 1;

      if (visited.has(current.id)) {
        continue;
      }

      visited.add(current.id);
      callback({ id: current.id, weight: current.weight }, current.depth);

      for (let neighbor = 0; neighbor < this.matrix.width; neighbor += 1) {
        const edgeWeight = this.matrix.get(current.id, neighbor);

        if (!this.matrix.elementView.isZero(edgeWeight) && !visited.has(neighbor)) {
          queue.push({
            id: neighbor,
            weight: edgeWeight,
            depth: current.depth + 1,
          });
        }
      }
    }
  }

  transitiveClosure(): Graph<number> | Graph<T> {
    if (this.matrix.ArrayClass) {
      const closure = new Graph<number>(
        new Matrix(Uint8Array, this.matrix.width, this.matrix.height),
        { directed: true },
      );

      for (let from = 0; from < this.matrix.width; from += 1) {
        closure.addArc(from, from, 1);

        for (let to = 0; to < this.matrix.height; to += 1) {
          if (this.hasArc(from, to)) {
            closure.addArc(from, to, 1);
          }
        }
      }

      for (let through = 0; through < this.matrix.width; through += 1) {
        for (let from = 0; from < this.matrix.width; from += 1) {
          for (let to = 0; to < this.matrix.height; to += 1) {
            if (closure.hasArc(from, through) && closure.hasArc(through, to)) {
              closure.addArc(from, to, 1);
            }
          }
        }
      }

      return closure;
    }

    const closure = new Graph<T>(
      new Matrix(this.matrix.width, this.matrix.height, this.matrix.elementView),
      { directed: true },
    );

    for (let from = 0; from < this.matrix.width; from += 1) {
      closure.addArc(from, from, this.matrix.elementView.one);

      for (let to = 0; to < this.matrix.height; to += 1) {
        if (this.hasArc(from, to)) {
          closure.addArc(from, to, this.matrix.elementView.one);
        }
      }
    }

    for (let through = 0; through < this.matrix.width; through += 1) {
      for (let from = 0; from < this.matrix.width; from += 1) {
        for (let to = 0; to < this.matrix.height; to += 1) {
          if (closure.hasArc(from, through) && closure.hasArc(through, to)) {
            closure.addArc(from, to, this.matrix.elementView.one);
          }
        }
      }
    }

    return closure;
  }

  private assertNode(id: number): void {
    if (!Number.isInteger(id) || id < 0 || id >= this.matrix.width) {
      throw new RangeError('Некорректный индекс узла');
    }
  }
}
