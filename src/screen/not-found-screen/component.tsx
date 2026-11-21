import { defaultDestination } from '@/common/type/destination'
import { Link } from '@/component/link'

export const notFoundScreenView = () => (
  <div className='flex flex-col items-center gap-[1rem] pt-[6rem] pb-[7.5rem] text-center'>
    <h1 className='text-[2rem] font-semibold'>Page not found</h1>
    <p className='text-zinc-600 dark:text-zinc-400'>
      There is nothing at this address.
    </p>
    <Link
      destination={defaultDestination()}
      className='rounded-[0.5rem] border border-zinc-300 px-[0.875rem] py-[0.4375rem] text-[0.875rem] transition-colors hover:border-blue-600 hover:text-blue-700 dark:border-zinc-700 dark:hover:border-blue-400 dark:hover:text-blue-300'
    >
      See the open-source work
    </Link>
  </div>
)
