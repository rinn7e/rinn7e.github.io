import React from 'react'

// The centred column every section sits in: the side gutter is padding, so
// no margin is needed to centre it
export const centredColumnView = ({
  children,
}: {
  readonly children: React.ReactNode
}) => (
  <div className='flex w-full justify-center px-[16px]'>
    <div className='w-full max-w-[1152px]'>{children}</div>
  </div>
)
