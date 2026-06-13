/**
 * VENUE VENDORS ADMIN CONSOLE UI - MAIN.TSX
 * 
 * Purpose: Source code for Venue Vendors Admin Console UI.
 * 
 * Command lines to execute/build/test this project:
 * - Start Vite Admin Dev Server: npm run dev
 * - Build Admin Frontend bundle: npm run build
 * - Preview production build: npm run preview
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
