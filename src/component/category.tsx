import { Gamepad2, Globe, Puzzle, Wrench } from 'lucide-react'

import { type ProductCategory } from '@/common/data/product'

// The name and the icon of a category: a highlight of the profile, and the
// "suit" in the corners of a card

export const categoryLabelOf = (category: ProductCategory): string => {
  switch (category) {
    case 'WebApp':
      return 'Web apps'
    case 'BrowserExtension':
      return 'Extensions'
    case 'Game':
      return 'Games'
    case 'DeveloperTool':
      return 'Dev tools'
  }
}

export const categoryIconView = ({
  category,
  className,
}: {
  readonly category: ProductCategory
  readonly className: string
}) => {
  switch (category) {
    case 'WebApp':
      return <Globe aria-hidden='true' className={className} />
    case 'BrowserExtension':
      return <Puzzle aria-hidden='true' className={className} />
    case 'Game':
      return <Gamepad2 aria-hidden='true' className={className} />
    case 'DeveloperTool':
      return <Wrench aria-hidden='true' className={className} />
  }
}
