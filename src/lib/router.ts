import { useEffect, useState } from 'react'

// Plain "#name" routes: work on any static host, and inside sandboxed embeds that only pass simple hashes.
export const ROUTES = ['home', 'practice', 'cards', 'exam', 'lab', 'library', 'data'] as const
export type Route = (typeof ROUTES)[number]

const parse = (): Route => {
  const h = location.hash.replace(/^#/, '') as Route
  return ROUTES.includes(h) ? h : 'home'
}

export function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse)
  useEffect(() => {
    const on = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return [route, (r) => (location.hash = r)]
}
