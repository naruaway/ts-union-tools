# ts-union-tools

**NOTE: https://github.com/gvergnaud/ts-pattern seems to be much better alternative.**

![Overview](https://user-images.githubusercontent.com/2931577/90972783-0363a980-e557-11ea-8996-1a36182e0d2f.png)
ts-union-tools is a set of minimal utilities to work with union types and tagged unions (a.k.a. discriminated unions) in TypeScript.
The main API is pattern matching utility functions called `match` and `matchOn` to do type-safe pattern-match against unions and tagged unions elegantly without `if-else` or `switch`.
It also provides useful type utilities to work with tagged union types.

## Features

- No opaque objects / classes. It just provides simple utility functions and type utilities to work seamlessly with existing union types in _your codebase_ such as `type Person = {role: 'Dev', language: string} | {role: 'UX', tool: string} | 'Sales'`
- Each utility function is overloaded with data-last curried version, which can be nicely used with other functional composition utilities like [flow in Lodash](https://lodash.com/docs/4.17.15#flow) or [pipe in Ramda](https://ramdajs.com/docs/#pipe)

## How to use

Make sure you run `npm install ts-union-tools` to make it available in your project.

### `matchOn` function for pattern-match against tagged unions

`matchOn` does pattern-match against tagged-unions, even mixed with raw literals like `'Sales'` in the following example.
You can use any name (e.g. `kind`, `type` and `role`) for the name of the "tag" in tagged unions by specifying the first argument of `matchOn`.

```typescript
import { matchOn } from 'ts-union-tools'

type Person =
  | { role: 'Dev'; language: string }
  | { role: 'UX'; tool: string }
  | 'Sales'
  | 'PM'

const person: Person =
  Math.random() > 0.5
    ? {
        role: 'Dev',
        language: 'TypeScript',
      }
    : Math.random() > 0.5
    ? {
        role: 'UX',
        tool: 'Photoshop',
      }
    : Math.random() > 0.5
    ? 'Sales'
    : 'PM'

const message = matchOn('role', person, {
  Dev: (dev) => `I am a dev using ${dev.language}`,
  UX: (ux) => `I am a UI/UX designer using ${ux.tool}`,
  Sales: () => 'I am a salesperson',
  // "_" (underscore) can be used as catch-all case
  _: () => 'I have some other role',
})

console.log(message)
```

### `match` function for pattern-match against simple unions

When a union type does not contain "tagged union", it does not make sense to specify the name of "tag" (e.g. `kind`, `type` and `role`)
In that case, we can use a simpler function, `match`.

```typescript
import { match } from 'ts-union-tools'

type Person = 'Dev' | 'UX' | 'Sales' | 'PM'

const person: Person =
  Math.random() > 0.5
    ? 'Dev'
    : Math.random() > 0.5
    ? 'UX'
    : Math.random() > 0.5
    ? 'Sales'
    : 'PM'

const message = match(person, {
  Dev: () => 'I am a dev',
  UX: () => 'I am a UI/UX designer',
  Sales: () => 'I am a salesperson',
  PM: () => 'I have some other role',
})

console.log(message)
```

### Type utilities (to be documented)

- `GetUnionTags<UnionType>`
- `TaggedUnionExtract<UnionType>`
- `TaggedUnionExclude<UnionType>`

## Why not just use `switch` or `if-else`?

TBD

## License

See [LICENSE](./LICENSE)

## Contributions

See [CONTRIBUTING](./CONTRIBUTING.md)
