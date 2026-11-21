import { ArrowUpRight } from 'lucide-react'
import React, { memo } from 'react'

import { newTabProps } from '@/common/util'

import { type Props, PropsEq } from './type'

// Static for now: its model is empty (`type.ts`), so the memo draws it
// once. It lists every party that sees a visit and everything the site
// keeps in the browser, so it changes in the same commit as the code or the
// hosting (see "The privacy page" in `doc/code-convention.md`).

const externalLinkView = ({
  href,
  label,
}: {
  readonly href: string
  readonly label: string
}) => (
  <a
    {...newTabProps}
    href={href}
    className='inline-flex items-center gap-[0.125rem] text-[#0c1014] underline decoration-zinc-300 underline-offset-[0.1875rem] hover:decoration-zinc-900 dark:text-zinc-50 dark:decoration-zinc-600 dark:hover:decoration-zinc-50'
  >
    {label}
    <ArrowUpRight aria-hidden='true' className='size-[0.875rem]' />
  </a>
)

// One party or one kind of data: its name on the left on a wide screen,
// above on a phone, and what it sees or keeps
const rowView = ({
  label,
  children,
}: {
  readonly label: string
  readonly children: React.ReactNode
}) => (
  <div className='flex flex-col gap-[0.25rem] border-b border-zinc-200 px-[1.125rem] py-[0.875rem] last:border-b-0 lg:grid lg:grid-cols-[8.5rem_1fr] lg:gap-[1rem] dark:border-zinc-800'>
    <span className='text-[0.875rem] font-semibold'>{label}</span>
    <span className='text-[0.875rem] leading-[1.6] text-zinc-600 dark:text-zinc-400'>
      {children}
    </span>
  </div>
)

const sectionTitleView = (title: string) => (
  <h2 className='text-center text-[0.75rem] font-semibold tracking-[0.06em] text-[#6a717a] uppercase dark:text-zinc-400'>
    {title}
  </h2>
)

const PrivacyScreen = (_props: Props) => (
  <div className='flex flex-col items-center pt-[2rem] pb-[6rem] lg:pt-[2.5rem]'>
    <div className='flex w-full max-w-[40rem] flex-col gap-[2rem]'>
      <section className='flex flex-col items-center gap-[0.5rem] text-center'>
        <h1 className='text-[1.5rem] leading-[1.25] font-semibold'>Privacy</h1>
        <p className='text-[0.9375rem] leading-[1.6] text-balance text-zinc-600 dark:text-zinc-400'>
          This site is a list of open-source projects. It does not know who you
          are, and it keeps nothing about you; it only counts visits, in total.
        </p>
      </section>

      <section className='flex flex-col gap-[0.75rem]'>
        {sectionTitleView('What the site uses')}
        <div className='rounded-[0.875rem] border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950'>
          {rowView({
            label: 'Hosting',
            children: (
              <>
                The site is served by GitHub Pages, which handles each request
                (and so sees your IP address) to deliver the page, under the{' '}
                {externalLinkView({
                  href: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement',
                  label: 'GitHub privacy statement',
                })}
                .
              </>
            ),
          })}
          {rowView({
            label: 'Analytics',
            children: (
              <>
                Cloudflare Web Analytics counts visits: the page, the referring
                site, the country, the browser and the kind of device. It sets
                no cookie, does not fingerprint you and does not follow you
                across sites, and the counts are only ever seen in total, under
                the{' '}
                {externalLinkView({
                  href: 'https://www.cloudflare.com/privacypolicy/',
                  label: 'Cloudflare privacy policy',
                })}
                .
              </>
            ),
          })}
          {rowView({
            label: 'Your browser',
            children:
              'Nothing is kept in your browser: no cookies, no local storage. The pictures, the icons and the text all come from the site itself, the fonts are the ones of your device, and the one script from elsewhere is the counter of Cloudflare above.',
          })}
          {rowView({
            label: 'Links out',
            children:
              'The links to GitHub, LinkedIn, the browser stores and the live projects open those sites in a new tab. What they see from then on is under their own privacy policies.',
          })}
        </div>
      </section>

      <section className='flex flex-col gap-[0.75rem]'>
        {sectionTitleView('What it does not do')}
        <p className='text-center text-[0.875rem] leading-[1.6] text-balance text-zinc-600 dark:text-zinc-400'>
          No cookies, no accounts, no forms, no ads and no third-party trackers.
          Nothing about you is collected, sold or shared.
        </p>
      </section>

      <section className='flex flex-col gap-[0.75rem]'>
        {sectionTitleView('Questions')}
        <p className='text-center text-[0.875rem] leading-[1.6] text-balance text-zinc-600 dark:text-zinc-400'>
          Open an issue on{' '}
          {externalLinkView({
            href: 'https://github.com/rinn7e/rinn7e.github.io/issues',
            label: 'GitHub',
          })}
          . This page changes with the site, and its history is in the
          repository.
        </p>
      </section>
    </div>
  </div>
)

export const PrivacyScreenMemo = memo(PrivacyScreen, PropsEq.equals)
