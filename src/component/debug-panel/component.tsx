import { Bug, X } from 'lucide-react'
import { memo } from 'react'

import { type Props, PropsEq } from './type'

const buttonClass =
  'rounded-[0.5rem] border border-zinc-300 px-[0.75rem] py-[0.375rem] text-left text-[0.8125rem] text-zinc-900 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-50 dark:hover:border-zinc-400'

// A small panel in the bottom right corner for checking the site: it opens
// over every card, or back.  Shown only on a local server.
const DebugPanel = ({ model, isProductsScreen, dispatch }: Props) => (
  <div className='fixed right-[1rem] bottom-[1rem] z-50 flex flex-col items-end gap-[0.5rem]'>
    {model.isOpen ? (
      <section
        aria-label='Debug panel'
        className='flex w-[12.5rem] flex-col gap-[0.5rem] rounded-[0.75rem] border border-zinc-200 bg-white p-[0.75rem] shadow-[0_2px_8px_rgb(0_0_0/0.12)] dark:border-zinc-700 dark:bg-zinc-900'
      >
        <h2 className='text-[0.75rem] font-semibold tracking-[0.08em] text-zinc-500 uppercase dark:text-zinc-400'>
          Debug
        </h2>
        <button
          type='button'
          disabled={!isProductsScreen}
          className={buttonClass}
          onClick={() => dispatch({ _tag: 'FlipAllCards' })}
        >
          Flip all cards
        </button>
        <button
          type='button'
          disabled={!isProductsScreen}
          className={buttonClass}
          onClick={() => dispatch({ _tag: 'UnflipAllCards' })}
        >
          Unflip all cards
        </button>
      </section>
    ) : null}
    <button
      type='button'
      aria-label={
        model.isOpen ? 'Hide the debug panel' : 'Show the debug panel'
      }
      aria-expanded={model.isOpen}
      className='flex size-[2.5rem] items-center justify-center rounded-full border border-zinc-300 bg-white text-zinc-700 shadow-[0_2px_6px_rgb(0_0_0/0.12)] transition-colors hover:border-zinc-500 hover:text-zinc-950 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-400 dark:hover:text-zinc-50'
      onClick={() => dispatch({ _tag: 'TogglePanel' })}
    >
      {model.isOpen ? (
        <X aria-hidden='true' className='size-[1.125rem]' />
      ) : (
        <Bug aria-hidden='true' className='size-[1.125rem]' />
      )}
    </button>
  </div>
)

export const DebugPanelMemo = memo(DebugPanel, PropsEq.equals)
