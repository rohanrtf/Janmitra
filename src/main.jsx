import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './janmitra-platform.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
