## Benchmark: реализации `PixelStream`

### Цель

Цель эксперимента - сравнить производительность разных способов
хранения пикселей и проверить, как на неё влияют:

- представление данных в памяти;
- порядок обхода (`RowMajor` vs `ColMajor`);
- тип доступа (последовательный vs случайный);
- наличие JIT-оптимизаций.

Сравнивались четыре реализации `PixelStream`:

- `TypedArray`
- `FlatArray`
- `ArrayOfArrays`
- `ArrayOfObjects`

### Методология

| Реализация | Представление |
| --- | --- |
| `TypedArray` | плоский `Uint8Array` |
| `FlatArray` | плоский `number[]` |
| `ArrayOfArrays` | массив `RGBA[]` |
| `ArrayOfObjects` | массив объектов |

**Размеры данных**

- 256x256
- 512x512
- 1024x1024
- 2048x2048

**Сценарии**

- forEach (RowMajor / ColMajor)
- setPixel (RowMajor / ColMajor)
- getPixel (RowMajor / ColMajor / Random)

### Основные выводы

**RowMajor vs ColMajor**

RowMajor быстрее за счёт лучшей локальности доступа к памяти.

**TypedArray vs FlatArray**

Обе реализации эффективны. FlatArray часто быстрее в чистых JS-циклах,
тогда как TypedArray лучше подходит для реальных задач за счёт
фиксированного формата хранения данных.

**ArrayOfArrays**

Самый медленный вариант из-за неудачного размещения данных в памяти.

**ArrayOfObjects**

Средний по производительности вариант, но проигрывает из-за частого создания объектов.

**Random доступ**

Самый дорогой сценарий - разрушает кеширование.

**JIT vs JITless**

JIT ускоряет выполнение, но не меняет общую картину.

### Фактические результаты (выборка)

Ниже — краткая выжимка по замерам (с JIT):

**2048x2048, forEach (col/row):**

| Реализация | Col/Row |
| --- | --- |
| TypedArray | ~1.33x |
| FlatArray | ~2.18x |
| ArrayOfArrays | ~4.44x |
| ArrayOfObjects | ~2.58x |

**2048x2048, getPixel (col/row):**

| Реализация | Col/Row |
| --- | --- |
| TypedArray | ~1.54x |
| FlatArray | ~2.54x |
| ArrayOfArrays | ~3.77x |
| ArrayOfObjects | ~1.35x |

**Random getPixel (2048x2048, avg ms):**

| Реализация | Avg ms |
| --- | --- |
| TypedArray | ~9.9 ms |
| FlatArray | ~16.2 ms |
| ArrayOfArrays | ~44.4 ms |
| ArrayOfObjects | ~30.6 ms |

JITless прогон дал те же тренды, но с ожидаемым, хотя и небольшим общим замедлением.

### Итог

- порядок обхода критичен
- плотные структуры выигрывают
- случайный доступ дорогой
- структура данных важнее JIT
