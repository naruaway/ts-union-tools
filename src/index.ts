type StringOrNumber = string | number

function isStringOrNumber(x: unknown): x is StringOrNumber {
  const t = typeof x
  return t === 'number' || t === 'string'
}

type Matchers<
  TagName extends StringOrNumber,
  TaggedUnion extends { [k in TagName]: StringOrNumber } | StringOrNumber
> =
  // handle every variant explicitly
  | {
      [Tag in GetUnionTags<TaggedUnion, TagName>]: (
        x: TaggedUnionExtract<TaggedUnion, TagName, Tag>,
      ) => any
    }
  // optional variant handling with default fallback
  | ({
      [Tag in GetUnionTags<TaggedUnion, TagName>]?: (
        x: TaggedUnionExtract<TaggedUnion, TagName, Tag>,
      ) => any
      // "_" (underscore) here is intentionally not using constant like `const DEFAULT_CASE_NAME = "_"` to avoid string like "DEFAULT_CASE_NAME" as a part of TypeScript error to users
      // TODO `x` shold be refined to be unspesified variants rather than the whole TaggedUnion type
    } & { _: (x: TaggedUnion) => any })

export function match<
  Variants extends StringOrNumber,
  M extends Matchers<never, Variants>
>(variant: Variants, matchers: M): ReturnType<Exclude<M[keyof M], undefined>>

export function match<
  Variants extends StringOrNumber,
  M extends Matchers<never, Variants>
>(
  matchers: M,
): (variant: Variants) => ReturnType<Exclude<M[keyof M], undefined>>

export function match(a: any, b?: any): any {
  if (b) {
    const data = a
    const matchers = b
    return applyMatcher(matchers, data)
  } else {
    const matchers = a
    return (data: any) => applyMatcher(matchers, data)
  }
}

export function matchOn<
  K extends StringOrNumber,
  UnionType extends { [k in K]: StringOrNumber } | StringOrNumber,
  U extends Matchers<K, UnionType>
>(k: K, x: UnionType, patterns: U): ReturnType<Exclude<U[keyof U], undefined>>

export function matchOn<
  K extends StringOrNumber,
  UnionType extends { [k in K]: StringOrNumber } | StringOrNumber,
  U extends Matchers<K, UnionType>
>(
  k: K,
  patterns: U,
): (x: UnionType) => ReturnType<Exclude<U[keyof U], undefined>>

export function matchOn(tagName: any, a: any, b?: any): any {
  if (b) {
    const data = a
    const matchers = b
    return applyMatcher(matchers, data, tagName)
  } else {
    const matchers = a
    return (data: any) => applyMatcher(matchers, data, tagName)
  }
}

function applyMatcher(matchers: any, data: any, tagName?: string): any {
  if (tagName === undefined) {
    return (matchers[data] || matchers['_'])(data)
  }
  return (
    matchers[isStringOrNumber(data) ? data : data[tagName]] || matchers['_']
  )(data)
}

// get tag type from a union type
export type GetUnionTags<
  UnionType extends { [tagName in TagName]: StringOrNumber } | StringOrNumber,
  TagName extends StringOrNumber
> =
  | Exclude<UnionType, StringOrNumber>[TagName]
  | Extract<UnionType, StringOrNumber>

export type TaggedUnionExtract<
  UnionType extends { [k in Key]: StringOrNumber } | StringOrNumber,
  Key extends StringOrNumber,
  Types extends
    | Exclude<UnionType, StringOrNumber>[Key]
    | Extract<UnionType, StringOrNumber>
> = UnionType extends { [k in Key]: Types }
  ? UnionType
  : UnionType extends Types
  ? UnionType
  : never

export type TaggedUnionExclude<
  UnionType extends { [k in Key]: StringOrNumber } | StringOrNumber,
  Key extends StringOrNumber,
  Types extends
    | Exclude<UnionType, StringOrNumber>[Key]
    | Extract<UnionType, StringOrNumber>
> = UnionType extends { [k in Key]: Types }
  ? never
  : UnionType extends Types
  ? never
  : UnionType
