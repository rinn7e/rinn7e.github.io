import { useLayoutEffect } from 'react'
import { type Dispatcher } from 'tea-cup-fp'

import { IS_DEBUG_PANEL_ENABLED } from '@/common/env'
import { GlobalMsgProvider } from '@/common/global-context'
import { ClientOnly } from '@/component/client-only'
import { DebugPanelMemo } from '@/component/debug-panel/component'
import { FooterMemo } from '@/component/footer'
import { PageBackdropMemo } from '@/component/page-backdrop'
import { headerScreenOf } from '@/component/profile-header'
import { ProfileHeaderMemo } from '@/component/profile-header/component'
import { AboutScreenMemo } from '@/screen/about-screen/component'
import { BlogPostScreenMemo } from '@/screen/blog-post-screen/component'
import { BlogScreenMemo } from '@/screen/blog-screen/component'
import { notFoundScreenView } from '@/screen/not-found-screen/component'
import { PrivacyScreenMemo } from '@/screen/privacy-screen/component'
import { ProductsScreenMemo } from '@/screen/products-screen/component'
import { type Model, type Msg, currentScreenOf } from '@/type'

export type RootProps = {
  readonly model: Model
  readonly dispatch: Dispatcher<Msg>
}

// Scrolls to where the move drew the screen shown (`Model.scroll`), once
// per move: after React has drawn that screen, so the page is already as
// tall as it, and before the browser paints it, so its first frame is at
// its place (a page never shows at a wrong scroll, or at one the browser
// restored too early, before its scroll comes back). Not run in Node, where
// the pages are rendered ahead of time.
const useScrollOf = (scroll: Model['scroll']) => {
  useLayoutEffect(() => {
    window.scrollTo({ top: scroll.top })
  }, [scroll.seq, scroll.top])
}

export const RootView = ({ model, dispatch }: RootProps) => {
  useScrollOf(model.scroll)
  return (
    <GlobalMsgProvider dispatch={dispatch}>
      {/* The page: up to 1457px of content in 20px side padding, the profile on
        top, then the screen, over the faint backdrop (`isolate` keeps the
        backdrop above the white and under the content) */}
      <div className='relative isolate flex min-h-dvh flex-col items-center bg-white text-[#0c1014] dark:bg-zinc-950 dark:text-zinc-100'>
        <PageBackdropMemo />
        <main className='flex w-full max-w-[93.5625rem] flex-grow flex-col px-[1rem] pt-[1.25rem] lg:px-[1.25rem] lg:pt-[1.875rem]'>
          {profileHeaderView({ model, dispatch })}
          {screenView({ model, dispatch })}
        </main>
        <FooterMemo />
      </div>
      {/* In the browser only, so a page rendered ahead of time hydrates */}
      {IS_DEBUG_PANEL_ENABLED ? (
        <ClientOnly>
          <DebugPanelMemo
            model={model.debugPanel}
            isProductsScreen={model.screenModel._tag === 'ProductsScreenModel'}
            dispatch={(subMsg) => dispatch({ _tag: 'DebugPanelMsg', subMsg })}
          />
        </ClientOnly>
      ) : null}
    </GlobalMsgProvider>
  )
}

// The header, fed only what it draws (`HeaderScreen`): the tab, and with
// the cards their category and side
const profileHeaderView = ({ model, dispatch }: RootProps) => (
  <ProfileHeaderMemo
    headerScreen={headerScreenOf(
      currentScreenOf(model.screenModel),
      model.screenModel._tag === 'ProductsScreenModel' &&
        model.screenModel.model.isFlipped,
    )}
    dispatch={(subMsg) => dispatch({ _tag: 'ProfileHeaderMsg', subMsg })}
  />
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
    case 'BlogScreenModel':
      return (
        <BlogScreenMemo
          model={screenModel.model}
          newSince={model.newSince}
          dispatch={(subMsg) => dispatch({ _tag: 'BlogScreenMsg', subMsg })}
        />
      )
    case 'BlogPostScreenModel':
      return (
        <BlogPostScreenMemo
          model={screenModel.model}
          newSince={model.newSince}
          dispatch={(subMsg) => dispatch({ _tag: 'BlogPostScreenMsg', subMsg })}
        />
      )
    case 'AboutScreenModel':
      return (
        <AboutScreenMemo
          model={screenModel.model}
          dispatch={(subMsg) => dispatch({ _tag: 'AboutScreenMsg', subMsg })}
        />
      )
    case 'PrivacyScreenModel':
      return (
        <PrivacyScreenMemo
          model={screenModel.model}
          dispatch={(subMsg) => dispatch({ _tag: 'PrivacyScreenMsg', subMsg })}
        />
      )
    case 'NotFoundScreenModel':
      return notFoundScreenView()
  }
}
