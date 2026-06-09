import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './en.js'
import { zh } from './zh.js'
import { fr } from './fr.js'
import { de } from './de.js'
import { hi } from './hi.js'
import { id } from './id.js'
import { it } from './it.js'
import { ja } from './ja.js'
import { ko } from './ko.js'
import { ptBR } from './ptBR.js'
import { es419 } from './es419.js'
import { es } from './es.js'

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  fr: { translation: fr },
  de: { translation: de },
  hi: { translation: hi },
  id: { translation: id },
  it: { translation: it },
  ja: { translation: ja },
  ko: { translation: ko },
  'pt-BR': { translation: ptBR },
  'es-419': { translation: es419 },
  es: { translation: es }
}

export function setupI18n(language: string): typeof i18n {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'en',
      interpolation: { escapeValue: false }
    })
  } else {
    i18n.changeLanguage(language)
  }
  return i18n
}

export default i18n
