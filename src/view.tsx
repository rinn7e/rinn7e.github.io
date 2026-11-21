import { type Dispatcher } from 'tea-cup-fp'

import { IS_DEBUG_PANEL_ENABLED } from '@/common/env'
import { SetGlobalMsgContext } from '@/common/global-context'
import { DebugPanelMemo } from '@/component/debug-panel/component'
import { footerView } from '@/component/footer'
import { profileHeaderView } from '@/component/profile-header'
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
    {/* The page: up to 1457px of content in 20px side padding, the profile on
        top, then the screen */}
    <div className='flex min-h-dvh flex-col items-center bg-white text-[#0c1014] dark:bg-zinc-950 dark:text-zinc-100'>
      <main className='flex w-full max-w-[93.5625rem] flex-grow flex-col px-[1rem] pt-[1.25rem] lg:px-[1.25rem] lg:pt-[1.875rem]'>
        {profileHeaderView({ screen: currentScreenOf(model.screenModel) })}
        {screenView({ model, dispatch })}
      </main>
      {footerView()}
    </div>
    {IS_DEBUG_PANEL_ENABLED ? (
      <DebugPanelMemo
        model={model.debugPanel}
        isProductsScreen={model.screenModel._tag === 'ProductsScreenModel'}
        dispatch={(subMsg) => dispatch({ _tag: 'DebugPanelMsg', subMsg })}
      />
    ) : null}
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
