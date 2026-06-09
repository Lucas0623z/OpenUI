/// <reference types="vite/client" />
import type { OpenUiApi } from '../electron/preload'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

declare global {
  interface Window {
    openui: OpenUiApi
  }

  namespace JSX {
    interface IntrinsicElements {
      webview: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string
        preload?: string
        webpreferences?: string
        partition?: string
        allowpopups?: string
      }
    }
  }
}

export {}
