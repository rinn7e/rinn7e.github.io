import { type Dispatcher } from 'tea-cup-fp'

import { SetGlobalMsgContext } from '@/common/global-context'
import { footerView } from '@/component/footer'
import { headerView } from '@/component/header'
import { aboutScreenView } from '@/screen/about-screen/component'
import { notFoundScreenView } from '@/screen/not-found-screen/component'
import { ProductsScreenMemo } from '@/screen/products-screen/component'
import { type Model, type Msg, currentScreenOf } from '@/type'

export type RootProps = {
  readonly model: Model
  readonly dispatch: Dispatcher<Msg>
}

export const RootView = ({ model, dispatch }: RootProps) => (
  <SetGlobalMsgContext value={dispatch}>
    <div className='flex min-h-dvh flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100'>
      {headerView({ screen: currentScreenOf(model.screenModel) })}
      <main className='flex-grow'>{screenView({ model, dispatch })}</main>
      {footerView()}
    </div>
  </SetGlobalMsgContext>
)

const screenView = ({ model, dispatch }: RootProps) => {
  const { screenModel } = model
  switch (screenModel._tag) {
    case 'ProductsScreenModel':
      return (
        <ProductsScreenMemo
          model={screenModel.model}
          dispatch={(subMsg) => dispatch({ _tag: 'ProductsScreenMsg', subMsg })}
        />
      )
    case 'AboutScreenModel':
      return aboutScreenView()
    case 'NotFoundScreenModel':
      return notFoundScreenView()
  }
}
