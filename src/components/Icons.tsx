import type { ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Icon({ size = 16, children, ...rest }: IconProps & { children: ReactNode }): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Claude 风格的品牌星芒标记（实心） */
export function BurstIcon({ size = 18, ...rest }: IconProps): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
      <path d="M12 1.6c.42 3.18.96 4.98 2.02 6.06 1.07 1.07 2.93 1.62 6.38 1.94-3.45.33-5.31.87-6.38 1.95-1.06 1.08-1.6 2.94-2.02 6.25-.42-3.31-.96-5.17-2.03-6.25-1.06-1.08-2.92-1.62-6.37-1.95 3.45-.32 5.31-.87 6.37-1.94C11.04 6.58 11.58 4.78 12 1.6Z" />
    </svg>
  )
}

export function FolderIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </Icon>
  )
}

export function CrosshairIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="2.5" x2="12" y2="6" />
      <line x1="12" y1="18" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="6" y2="12" />
      <line x1="18" y1="12" x2="21.5" y2="12" />
      <circle cx="12" cy="12" r="2.4" />
    </Icon>
  )
}

export function RefreshIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M21 12a9 9 0 1 1-9-9c2.6 0 5 1.06 6.74 2.81" />
      <path d="M21 3v5h-5" />
    </Icon>
  )
}

export function SettingsIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <line x1="21" y1="5" x2="14" y2="5" />
      <line x1="10" y1="5" x2="3" y2="5" />
      <line x1="21" y1="12" x2="12" y2="12" />
      <line x1="8" y1="12" x2="3" y2="12" />
      <line x1="21" y1="19" x2="16" y2="19" />
      <line x1="12" y1="19" x2="3" y2="19" />
      <line x1="14" y1="3" x2="14" y2="7" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <line x1="16" y1="17" x2="16" y2="21" />
    </Icon>
  )
}

export function ArrowUpIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </Icon>
  )
}

export function SparkleIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M12 3l1.6 4.9L18.5 9.5l-4.9 1.6L12 16l-1.6-4.9L5.5 9.5l4.9-1.6z" />
      <path d="M18.5 14l.7 2.1 2.1.7-2.1.7-.7 2.1-.7-2.1-2.1-.7 2.1-.7z" />
    </Icon>
  )
}

export function CloseIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  )
}

export function CheckIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  )
}

export function CodeIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="m18 16 4-4-4-4" />
      <path d="m6 8-4 4 4 4" />
      <path d="m14.5 4-5 16" />
    </Icon>
  )
}

export function ChatIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </Icon>
  )
}

export function MenuIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
      <line x1="3.5" y1="12" x2="20.5" y2="12" />
      <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
    </Icon>
  )
}

export function SidebarIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <line x1="9" y1="4" x2="9" y2="20" />
    </Icon>
  )
}

export function SearchIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </Icon>
  )
}

export function ArrowLeftIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </Icon>
  )
}

export function ArrowRightIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  )
}

export function MinimizeIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </Icon>
  )
}

export function MaximizeIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <rect x="5" y="5" width="14" height="14" rx="1.5" />
    </Icon>
  )
}

export function RestoreIcon(p: IconProps): JSX.Element {
  return (
    <Icon {...p}>
      <rect x="7.5" y="7.5" width="11" height="11" rx="1.5" />
      <path d="M5.5 16.5V6A1.5 1.5 0 0 1 7 4.5h10.5" />
    </Icon>
  )
}
