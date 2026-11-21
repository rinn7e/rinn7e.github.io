// A branded type (also called an opaque type, or a newtype in Haskell): a
// value only its owner makes (doc/code-convention.md, "Owned values"). `T`,
// read anywhere as `T`, branded with the owner's `B`. The owner declares `B`
// next to the type and never exports it: a `declare class` with one private
// method (no value, so `_` for the unused-vars rule). An object spread drops
// a class method, so `{ ...branded, field: x }` is a plain `T` again.
export type Brand<T, B> = T & B
