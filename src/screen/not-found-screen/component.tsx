import { defaultDestination } from '@/common/type/destination'
import { centredColumnView } from '@/component/layout'
import { Link } from '@/component/link'

export const notFoundScreenView = () =>
  centredColumnView({
    children: (
      <div className='flex flex-col items-center gap-[16px] pt-[96px] pb-[120px] text-center'>
        <h1 className='text-[2rem] font-semibold'>Page not found</h1>
        <p className='text-zinc-600 dark:text-zinc-400'>
          There is nothing at this address.
        </p>
        <Link
          destination={defaultDestination()}
          className='rounded-[8px] border border-zinc-300 px-[14px] py-[7px] text-[0.875rem] transition-colors hover:border-blue-600 hover:text-blue-700 dark:border-zinc-700 dark:hover:border-blue-400 dark:hover:text-blue-300'
        >
          See the products
        </Link>
      </div>
    ),
  })
