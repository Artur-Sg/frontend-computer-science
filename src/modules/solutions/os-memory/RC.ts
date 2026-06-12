import { Pointer } from './memory';

export interface RcState {
  pointer: Pointer;
  count: number;
}

export class Rc {
  private readonly state: RcState;

  private disposed = false;

  constructor(pointerOrState: Pointer | RcState) {
    if (pointerOrState instanceof Pointer) {
      if (pointerOrState.region !== 'heap') {
        throw new Error('Rc можно создать только для указателя из кучи');
      }

      this.state = {
        pointer: pointerOrState,
        count: 1,
      };

      return;
    }

    this.state = pointerOrState;
  }

  get refCount(): number {
    return this.state.count;
  }

  deref(): ArrayBuffer {
    if (this.disposed) {
      throw new Error('Rc уже освобождён');
    }

    return this.state.pointer.deref();
  }

  change(data: ArrayBuffer): void {
    if (this.disposed) {
      throw new Error('Rc уже освобождён');
    }

    this.state.pointer.change(data);
  }

  clone(): Rc {
    if (this.disposed) {
      throw new Error('Нельзя клонировать освобождённый Rc');
    }

    this.state.count += 1;

    return new Rc(this.state);
  }

  [Symbol.dispose](): void {
    if (this.disposed) {
      throw new Error('Rc уже освобождён');
    }

    this.disposed = true;
    this.state.count -= 1;

    if (this.state.count === 0) {
      this.state.pointer.free();
    }
  }
}
