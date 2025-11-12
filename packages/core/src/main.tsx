import { createRoot } from 'react-dom/client'

// @ts-ignore - CSS import handled by Vite
import './styles/index.css'
import App from './App'

// Suppress harmless browser extension errors
// This error occurs when browser extensions (like React DevTools, Redux DevTools, etc.)
// try to communicate with the page but the message channel closes before a response
window.addEventListener('error', (event) => {
  if (
    event.message?.includes('message channel closed') ||
    event.message?.includes('asynchronous response')
  ) {
    event.preventDefault()
    return false
  }
})

// Suppress unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('message channel closed') ||
    event.reason?.message?.includes('asynchronous response')
  ) {
    event.preventDefault()
    return false
  }
})

createRoot(document.getElementById('root')!).render(
  <App />
)
