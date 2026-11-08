import { useProgress } from './lib/progress'
import { useRoute, type Route } from './lib/router'
import { Home } from './pages/Home'
import { Practice } from './pages/Practice'
import { Cards } from './pages/Cards'
import { Exam } from './pages/Exam'
import { Lab } from './pages/Lab'
import { Library } from './pages/Library'
import { DataPage } from './pages/Data'

const NAV: { id: Route; label: string }[] = [
  { id: 'home', label: 'Overview' },
  { id: 'practice', label: 'Practice' },
  { id: 'cards', label: 'Flashcards' },
  { id: 'exam', label: 'Mock Exam' },
  { id: 'lab', label: 'Systems Lab' },
  { id: 'library', label: 'Library' },
  { id: 'data', label: 'Progress Data' },
]

export function App() {
  const [route] = useRoute()
  const { ready, persistent } = useProgress()
  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#home">
            <b>DEP PREP</b>
            <span>B737-800</span>
          </a>
          <nav className="nav" aria-label="Sections">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} aria-current={route === n.id ? 'page' : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      <main className="page">
        {ready && !persistent && (
          <div className="annunciator" role="status">
            <span className="lamp">NO STORE</span>
            <p>This browser is blocking local storage, so progress lasts only until you close the tab. Export a backup from Progress Data before leaving, or open the site in a normal (not private) window.</p>
          </div>
        )}
        {!ready ? <p className="muted">Loading your progress…</p> : <Page route={route} />}
      </main>
    </>
  )
}

function Page({ route }: { route: Route }) {
  switch (route) {
    case 'practice': return <Practice />
    case 'cards': return <Cards />
    case 'exam': return <Exam />
    case 'lab': return <Lab />
    case 'library': return <Library />
    case 'data': return <DataPage />
    default: return <Home />
  }
}
