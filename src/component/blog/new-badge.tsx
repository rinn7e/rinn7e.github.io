// The badge New of a post published in the last 30 days (`isNewPost`): a
// small pill in the ink of the site (the color of the current tab and of
// the highlight picked, the other way round in dark mode), set on the axis
export const newBadgeView = () => (
  <span className='rounded-full bg-[#0c1014] px-[0.5rem] py-[0.0625rem] text-[0.625rem] leading-[1rem] font-semibold tracking-[0.08em] text-white uppercase dark:bg-zinc-50 dark:text-[#0c1014]'>
    New
  </span>
)
