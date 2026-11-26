import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'

import '@/asset/index.css'

import { AppProgram } from './program'

const app = (
  <StrictMode>
    <AppProgram />
  </StrictMode>
)

// A page rendered ahead of time (`src/prerender.tsx`) already holds the
// app: React takes it over as it is. Any other is drawn from nothing: the
// dev server, `404.html`, and an address with a query (a product opened, a
// category picked), whose HTML is the plain page of its path.
const container = document.getElementById('root')
if (container !== null) {
  if (container.hasChildNodes() && window.location.search === '') {
    hydrateRoot(container, app)
  } else {
    container.replaceChildren()
    createRoot(container).render(app)
  }
}
