import { type Screen } from '@/common/type/destination'

import { type HeaderScreen } from './type'

// The header of `screen`; `isFlipped` is the side of the cards, read only
// on the products screen
export const headerScreenOf = (
  screen: Screen,
  isFlipped: boolean,
): HeaderScreen => {
  switch (screen._tag) {
    case 'ProductsScreen':
      return { _tag: 'ProductsHeader', category: screen.category, isFlipped }
    case 'BlogScreen':
    case 'BlogPostScreen':
      return { _tag: 'BlogHeader' }
    case 'AboutScreen':
      return { _tag: 'AboutHeader' }
    case 'PrivacyScreen':
    case 'NotFoundScreen':
      return { _tag: 'NoTabHeader' }
  }
}
