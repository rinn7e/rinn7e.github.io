import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@/asset/index.css'

import { AppProgram } from './program'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProgram />
  </StrictMode>,
)
