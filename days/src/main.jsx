import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import App from './App'
import { AppProvider } from './lib/store'
import './styles.css'

const PREVIEW = import.meta.env.VITE_PREVIEW === '1'
const Router = PREVIEW ? MemoryRouter : BrowserRouter

createRoot(document.getElementById('root')).render(
  <Router>
    <AppProvider>
      <App />
    </AppProvider>
  </Router>
)

if ('serviceWorker' in navigator && import.meta.env.PROD && !PREVIEW) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
