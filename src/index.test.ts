import {
  match,
  matchOn,
  GetUnionTags,
  TaggedUnionExtract,
  TaggedUnionExclude,
} from '.'

function pipe<A, B>(x: A, a: (x: A) => B): B
function pipe<A, B, C>(x: A, a: (x: A) => B, b: (x: B) => C): C
function pipe(x: any, ...funcs: Function[]): any {
  return funcs.reduce((value, f) => f(value), x)
}

export default pipe
type SimplePerson =
  | {
      kind: 'Developer'
      name: string
      programmingLanguage: string
    }
  | {
      kind: 'Designer'
      name: string
      favoriteTool: string
    }

/*
 * Assert that given value is a subtype of given type parameter `T`.
 *
 * This just returns given value in runtime
 * TODO: Maybe wrapping an expression with this can have a side effect to cause contextual typing
 * Solution like https://github.com/SamVerschueren/tsd seem to be promising
 */
const assertType = <T>() => <U extends T>(x: U): U => {
  return x
}

// omitting return type annotation to verify type inference here
const createSimplePerson = (type: 'dev' | 'ui/ux') =>
  match(type, {
    dev: () =>
      ({
        kind: 'Developer',
        name: 'John Smith',
        programmingLanguage: 'TypeScript',
      } as const),
    'ui/ux': () =>
      ({
        kind: 'Designer',
        name: 'Lorem Ipsum',
        favoriteTool: 'React',
      } as const),
  })

const createSimplePersonOrRawVariant = (
  type: 'dev' | 'ui/ux' | 'sales' | 'artist',
): SimplePerson | 'SalesPerson' | 'Artist' =>
  matchOn('kind', type, {
    dev: createSimplePerson,
    'ui/ux': createSimplePerson,
    sales: () => 'SalesPerson' as const,
    artist: () => 'Artist' as const,
  })

test('matchOn: tagged union', () => {
  expect(
    matchOn('kind', createSimplePerson('dev'), {
      Developer: (dev) =>
        `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
      Designer: () => 'DESIGNER',
    }),
  ).toBe('Hello I am John Smith, using TypeScript')

  expect(
    pipe(
      createSimplePerson('dev'),
      matchOn('kind', {
        Developer: (dev) =>
          `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
        Designer: () => 'DESIGNER',
      }),
    ),
  ).toBe('Hello I am John Smith, using TypeScript')

  expect(
    matchOn('kind', createSimplePerson('ui/ux'), {
      Developer: (dev) =>
        `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
      Designer: () => 'DESIGNER',
    }),
  ).toBe('DESIGNER')
})

test('matchOn: tagged union with raw literals', () => {
  expect(
    assertType<string>()(
      matchOn('kind', createSimplePersonOrRawVariant('dev'), {
        Developer: (dev) =>
          `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
        Designer: () => 'DESIGNER',
        SalesPerson: () => 'sales person',
        Artist: () => 'artist',
      }),
    ),
  ).toBe('Hello I am John Smith, using TypeScript')

  try {
    // @ts-expect-error
    matchOn('wrongTagName', createSimplePersonOrRawVariant('dev'), {
      Developer: (dev) =>
        // @ts-expect-error
        `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
      Designer: () => 'DESIGNER',
      SalesPerson: () => 'sales person',
      Artist: () => 'artist',
    })
  } catch (_e) {
    // do not care runtime errors when there is TypeScript error
  }

  expect(
    matchOn('kind', createSimplePersonOrRawVariant('sales'), {
      Developer: (dev) =>
        `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
      Designer: () => 'DESIGNER',
      SalesPerson: () => 'sales person',
      Artist: () => 'artist',
    }),
  ).toBe('sales person')
})

test('matchOn: default case handling', () => {
  // missing case should cause TypeScript error
  // @ts-expect-error
  matchOn('kind', createSimplePersonOrRawVariant('dev'), {
    Developer: (dev) =>
      `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
  })

  expect(
    assertType<number | string>()(
      matchOn('kind', createSimplePersonOrRawVariant('sales'), {
        Developer: (dev) =>
          `Hello I am ${dev.name}, using ${dev.programmingLanguage}`,
        _: () => 999999999,
      }),
    ),
  ).toBe(999999999)
})

test('match', () => {
  const fn = (n: number) => (n > 0 ? 'abc' : 'xyz')
  expect(
    assertType<'ABC' | 'XYZ'>()(
      match(fn(-1), {
        abc: () => 'ABC' as const,
        xyz: () => 'XYZ' as const,
      }),
    ),
  ).toBe('XYZ')

  expect(
    assertType<'ABC' | 'XYZ'>()(
      pipe(
        fn(-1),
        match({
          abc: () => 'ABC' as const,
          xyz: () => 'XYZ' as const,
        }),
      ),
    ),
  ).toBe('XYZ')

  try {
    // missing case should cause TypeScript error
    // @ts-expect-error
    match(fn(-1), {
      abc: () => 'ABC',
    })
  } catch (_e) {
    // do not care runtime errors when there is any TypeScript error
  }

  expect(
    assertType<'ABC' | boolean>()(
      match(fn(-1), {
        abc: () => 'ABC' as const,
        _: (x) => (x === 'xyz' ? true : false),
      }),
    ),
  ).toBe(true)
})

type UnionSample =
  | {
      type: 'A'
      name: string
    }
  | { type: 'B'; age: number }
  | 'abc'
  | 'xyz'

test('TaggedUnionExclude', () => {
  type ActualType = TaggedUnionExclude<UnionSample, 'type', 'A' | 'abc'>
  type ExpectedType =
    | {
        type: 'B'
        age: number
      }
    | 'xyz'

  assertSubtypeOf<ExpectedType, ActualType>()
  assertSubtypeOf<ActualType, ExpectedType>()
})

test('TaggedUnionExtract', () => {
  type ActualType = TaggedUnionExtract<UnionSample, 'type', 'A' | 'abc'>
  type ExpectedType =
    | {
        type: 'A'
        name: string
      }
    | 'abc'

  assertSubtypeOf<ExpectedType, ActualType>()
  assertSubtypeOf<ActualType, ExpectedType>()
})

test('GetUnionTags', () => {
  type ActualType = GetUnionTags<UnionSample, 'type'>
  type ExpectedType = 'A' | 'B' | 'abc' | 'xyz'

  assertSubtypeOf<ExpectedType, ActualType>()
  assertSubtypeOf<ActualType, ExpectedType>()
})

function assertSubtypeOf<_A extends _B, _B>() {}
