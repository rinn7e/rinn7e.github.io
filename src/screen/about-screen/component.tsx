import { ArrowUpRight } from 'lucide-react'
import React from 'react'

import { newTabProps } from '@/common/util'
import { GithubIcon, LinkedinIcon } from '@/component/icon'

// No model: the About screen has nothing to change, so it is a view helper.
// It sits under the profile, so it has no title of its own.
export const aboutScreenView = () => (
  <div className='flex flex-col items-center pt-[2rem] pb-[6rem] lg:pt-[2.5rem]'>
    <div className='flex max-w-[36rem] flex-col gap-[1rem] text-left text-[0.9375rem] leading-[1.65]'>
      {/* The bio of github.com/rinn7e, as written there */}
      <p>
        Enthusiastic Functional Programmer, specialized in Haskell,
        Typescript(fp-ts), Purescript, and Elm.
      </p>
    </div>
    <ul className='grid w-full max-w-[22rem] grid-cols-1 gap-[1rem] pt-[2.5rem] lg:max-w-[32rem] lg:grid-cols-2'>
      {contactView({
        href: 'https://github.com/rinn7e',
        icon: <GithubIcon className='size-[1.75rem]' />,
        title: 'GitHub',
        caption: 'github.com/rinn7e',
      })}
      {contactView({
        href: 'https://www.linkedin.com/in/moremi-vannak/',
        icon: <LinkedinIcon className='size-[1.75rem]' />,
        title: 'LinkedIn',
        caption: 'linkedin.com/in/moremi-vannak',
      })}
    </ul>
  </div>
)

const contactView = ({
  href,
  icon,
  title,
  caption,
}: {
  readonly href: string
  readonly icon: React.ReactNode
  readonly title: string
  readonly caption: string
}) => (
  <li className='flex'>
    <a
      {...newTabProps}
      href={href}
      className='flex w-full flex-col items-center gap-[0.5rem] rounded-[0.875rem] border border-zinc-200 bg-white px-[1rem] py-[1.5rem] text-center transition-colors hover:border-blue-600 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-400'
    >
      {icon}
      <span className='flex items-center gap-[0.25rem] font-semibold'>
        {title}
        <ArrowUpRight aria-hidden='true' className='size-[1rem]' />
      </span>
      <span className='text-[0.875rem] [overflow-wrap:anywhere] text-zinc-600 dark:text-zinc-400'>
        {caption}
      </span>
    </a>
  </li>
)
