import { ArrowUpRight, House } from 'lucide-react'
import React from 'react'

import { GithubIcon, LinkedinIcon } from '@/component/icon'
import { centredColumnView } from '@/component/layout'

// No model: the About screen has nothing to change, so it is a view helper
export const aboutScreenView = () =>
  centredColumnView({
    children: (
      <div className='flex flex-col items-center pt-[48px] pb-[80px] lg:pt-[80px]'>
        <img
          src='/favicon.svg'
          alt='The R7 logo'
          width={80}
          height={80}
          className='size-[80px]'
        />
        <div className='flex flex-col items-center gap-[8px] pt-[20px] text-center'>
          <h1 className='text-[2rem] font-semibold lg:text-[2.25rem]'>About</h1>
          <p className='text-[1.125rem] text-zinc-600 dark:text-zinc-400'>
            Moremi Vannak, rinn7e on the web
          </p>
        </div>
        <div className='flex max-w-[576px] flex-col gap-[16px] pt-[40px] text-left text-[1rem] leading-[1.65]'>
          <p>
            I am a software engineer who enjoys functional programming and The
            Elm Architecture. I write Haskell for servers, TypeScript with
            react-tea-cup for the web, and Scala with Indigo for games.
          </p>
          <p>
            This site shows the open source products I build in my own time:
            browser extensions, web apps, games and developer tools. Each one
            links to its code on GitHub.
          </p>
          <p>
            My work history is on LinkedIn, and the casual side of me lives on
            my personal site.
          </p>
        </div>
        <ul className='grid w-full max-w-[352px] grid-cols-1 gap-[16px] pt-[48px] lg:max-w-[768px] lg:grid-cols-3'>
          {contactView({
            href: 'https://www.linkedin.com/in/moremi-vannak/',
            icon: <LinkedinIcon className='size-[28px]' />,
            title: 'LinkedIn',
            caption: 'linkedin.com/in/moremi-vannak',
          })}
          {contactView({
            href: 'https://github.com/rinn7e',
            icon: <GithubIcon className='size-[28px]' />,
            title: 'GitHub',
            caption: 'github.com/rinn7e',
          })}
          {contactView({
            href: 'https://me.rinn7e.com/',
            icon: <House aria-hidden='true' className='size-[28px]' />,
            title: 'Personal site',
            caption: 'me.rinn7e.com',
          })}
        </ul>
      </div>
    ),
  })

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
      href={href}
      className='flex w-full flex-col items-center gap-[8px] rounded-[14px] border border-zinc-200 px-[16px] py-[24px] text-center transition-colors hover:border-blue-600 dark:border-zinc-800 dark:hover:border-blue-400'
    >
      {icon}
      <span className='flex items-center gap-[4px] font-semibold'>
        {title}
        <ArrowUpRight aria-hidden='true' className='size-[16px]' />
      </span>
      <span className='text-[0.875rem] [overflow-wrap:anywhere] text-zinc-600 dark:text-zinc-400'>
        {caption}
      </span>
    </a>
  </li>
)
