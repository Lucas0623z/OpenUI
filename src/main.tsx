import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App.js'
import { setupI18n } from './i18n/index.js'
import { useStore } from './store/useStore.js'
import '@fontsource-variable/fraunces'
import './styles.css'

async function bootstrap(): Promise<void> {
  const settings = await window.openui.getSettings()
  setupI18n(settings.language)
  useStore.getState().setSettings(settings)

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

bootstrap()
