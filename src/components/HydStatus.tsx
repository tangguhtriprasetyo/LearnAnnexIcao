import type { HydState } from '../lab/hydraulics'

export function HydStatusPanel({ s }: { s: HydState }) {
  return (
    <div className="ovhd">
      <div className="ovhd-title">System status</div>
      <div className="sys-lights">
        <div className={`syslight ${s.sysA ? 'press' : 'nopress'}`}><b>A</b>{s.sysA ? '3000 PSI' : 'NO PRESS'}</div>
        <div className={`syslight ${s.sysB ? 'press' : 'nopress'}`}><b>B</b>{s.sysB ? '3000 PSI' : 'NO PRESS'}</div>
        <div className={`syslight ${s.standby ? 'press' : 'idle'}`}><b>STBY</b>{s.standby ? 'RUNNING' : 'OFF'}</div>
        <div className={`syslight ${s.ptu ? 'press' : 'idle'}`}><b>PTU</b>{s.ptu ? 'OPERATING' : 'OFF'}</div>
      </div>
      {s.standbyReason && <p className="mono" style={{ fontSize: '0.75rem', color: '#c9d1d8' }}>Standby: {s.standbyReason}</p>}
    </div>
  )
}

export function HydUsersTable({ s, highlight }: { s: HydState; highlight?: string[] }) {
  return (
    <div className="panel table-wrap" style={{ padding: 12 }}>
      <table className="users">
        <thead><tr><th>User</th><th>Powered by</th></tr></thead>
        <tbody>
          {s.users.map((u) => (
            <tr key={u.name} className={highlight?.includes(u.name) ? 'hl' : undefined}>
              <td><span className={`dot ${u.powered ? 'on' : ''}`} aria-hidden="true" />{u.name}</td>
              <td className="via" style={{ color: u.powered ? undefined : 'var(--bad)' }}>{u.via}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
