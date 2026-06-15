export type SearchValue = number | string;
export type Selector<T> = (item: T) => SearchValue;

export function indexOf<T>(arr: T[], target: SearchValue, selector?: Selector<T>): number {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const current = selector ? selector(arr[mid]) : arr[mid];

    if (current === target) {
      result = mid;
      right = mid - 1;
    } else if (current < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}

export function lastIndexOf<T>(arr: T[], target: SearchValue, selector?: Selector<T>): number {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    const current = selector ? selector(arr[mid]) : arr[mid];

    if (current === target) {
      result = mid;
      left = mid + 1;
    } else if (current < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return result;
}
