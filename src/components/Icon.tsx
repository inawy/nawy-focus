import type { ReactNode } from 'react'

export type IconName =
  | 'more'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'volume'
  | 'volume-off'
  | 'vibrate'
  | 'coffee'
  | 'bell'
  | 'palette'
  | 'download'

const paths: Record<IconName, ReactNode> = {
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></>,
  'volume-off': <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m17 9 5 6m0-6-5 6" /></>,
  vibrate: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M3 8v8m18-8v8M4.5 5.5v13m15-13v13" /><path d="M10 17h4" /></>,
  coffee: <><path d="M10 2v2m4-2v2M4 7h13v7a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5V7Z" /><path d="M17 9h1a3 3 0 1 1 0 6h-2M3 22h16" /></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1.2a2 2 0 0 0 1.4-3.4 1.8 1.8 0 0 1 1.3-3.1H18a3 3 0 0 0 3-3c0-4.7-4-8.5-9-8.5Z" /><circle cx="7.5" cy="11" r=".8" /><circle cx="10" cy="7.5" r=".8" /><circle cx="15" cy="8" r=".8" /></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="m7 10 5 5 5-5M12 15V3" /></>,
}

export function Icon({
  name,
  size = 19,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {paths[name]}
    </svg>
  )
}
