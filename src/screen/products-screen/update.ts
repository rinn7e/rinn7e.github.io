import { type Option } from 'fp-ts/Option'
import { Cmd } from 'tea-cup-fp'

import { type ProductCategory } from '@/common/data/product'

import { type Model, type Msg } from './type'

export const init = (category: Option<ProductCategory>): [Model, Cmd<Msg>] => [
  { category },
  Cmd.none(),
]

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'SelectCategory':
      return selectCategoryHandler(msg.category)(model)
  }
}

export const selectCategoryHandler =
  (category: Option<ProductCategory>) =>
  (model: Model): [Model, Cmd<Msg>] => [{ ...model, category }, Cmd.none()]
