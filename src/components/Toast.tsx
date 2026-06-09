import { useStore } from '../store/useStore.js'
import { CheckIcon } from './Icons.js'

export function Toast(): JSX.Element | null {
  const toast = useStore((s) => s.toast)
  if (!toast) return null
  return (
    <div className="toast">
      <CheckIcon size={15} />
      <span>{toast}</span>
    </div>
  )
}
