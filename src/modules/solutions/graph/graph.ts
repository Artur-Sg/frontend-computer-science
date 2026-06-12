import { Matrix } from './matrix';

export interface GraphOptions {
  directed?: boolean;
}

export interface TraversedNode<T = number> {
  id: number;
  weight: T;
}

export class Graph<T = number> {
  readonly matrix: Matrix<T>;

  readonly directed: boolean;

  constructor(matrix: Matrix<T>, options: GraphOptions = {}) {
    this.matrix = matrix;
    this.directed = options.directed ?? false;
  }

  hasArc(from: number, to: number): boolean {
    return this.matrix.get(from, to) !== 0;
  }

  addArc(from: number, to: number, weight: T = 1 as T): void {
    this.matrix.set(from, to, weight);
  }

  removeArc(from: number, to: number): void {
    this.matrix.set(from, to, 0 as T);
  }

  hasEdge(from: number, to: number): boolean {
    if (this.directed) {
      return this.hasArc(from, to);
    }

    return this.hasArc(from, to) || this.hasArc(to, from);
  }

  addEdge(from: number, to: number, weight: T = 1 as T): void {
    this.addArc(from, to, weight);

    if (!this.directed) {
      this.addArc(to, from, weight);
    }
  }

  removeEdge(from: number, to: number): void {
    this.removeArc(from, to);

    if (!this.directed) {
      this.removeArc(to, from);
    }
  }

  traverse(start: number, callback: (node: TraversedNode<T>, depth: number) => void): void {
    this.matrix.get(start, start);

    const visited = new Set<number>();

    const queue: Array<{
      id: number;
      depth: number;
      weight: T;
    }> = [
      {
        id: start,
        depth: 0,
        weight: 0 as T,
      },
    ];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visited.has(current.id)) {
        continue;
      }

      visited.add(current.id);

      callback(
        {
          id: current.id,
          weight: current.weight,
        },
        current.depth
      );

      for (let to = 0; to < this.matrix.cols; to++) {
        const weight = this.matrix.get(current.id, to);

        if (weight !== 0 && !visited.has(to)) {
          queue.push({
            id: to,
            depth: current.depth + 1,
            weight,
          });
        }
      }
    }
  }

  transitiveClosure(): Graph<T> {
    const closureMatrix = new Matrix<T>(
      this.matrix.rows,
      this.matrix.cols,
      this.matrix.elementView
    );

    const closure = new Graph<T>(closureMatrix, {
      directed: true,
    });

    for (let from = 0; from < this.matrix.rows; from++) {
      for (let to = 0; to < this.matrix.cols; to++) {
        if (this.matrix.get(from, to) !== 0) {
          closure.addArc(from, to, 1 as T);
        }
      }
    }

    for (let through = 0; through < this.matrix.rows; through++) {
      for (let from = 0; from < this.matrix.rows; from++) {
        for (let to = 0; to < this.matrix.cols; to++) {
          if (closure.hasArc(from, through) && closure.hasArc(through, to)) {
            closure.addArc(from, to, 1 as T);
          }
        }
      }
    }

    return closure;
  }
}
