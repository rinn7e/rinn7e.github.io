import 'react'

// Lets a `style` set CSS custom properties (`--card-color`), the one thing
// views pass through `style`: a value known only at runtime, which a
// Tailwind class then reads
declare module 'react' {
  interface CSSProperties {
    [name: `--${string}`]: string | number
  }
}
