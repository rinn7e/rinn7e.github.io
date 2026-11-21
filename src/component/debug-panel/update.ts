import { Cmd } from 'tea-cup-fp'

import { type Model, type Msg } from './type'

export const init = (): Model => ({ isOpen: false })

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'TogglePanel':
      return [{ ...model, isOpen: !model.isOpen }, Cmd.none()]
    case 'FlipAllCards':
    case 'UnflipAllCards':
      // Handled by the app, which owns the products screen
      return [model, Cmd.none()]
  }
}
