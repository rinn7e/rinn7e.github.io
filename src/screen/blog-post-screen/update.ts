import { Cmd } from 'tea-cup-fp'

import { type BlogPost } from '@/common/type/blog-post'

import { type Model, type Msg } from './type'

export const init = (post: BlogPost): Model => ({ post })

export const update = (msg: Msg, model: Model): [Model, Cmd<Msg>] => {
  switch (msg._tag) {
    case 'NoOp':
      return [model, Cmd.none()]
  }
}
