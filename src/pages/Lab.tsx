import { useState } from 'react'
import { DEFAULT_INPUTS, evaluate, SCENARIOS, type FlapPos, type HydInputs } from '../lab/hydraulics'

function Toggle({ id, name, sub, on, onChange, lamp }: { id: string; name: string; sub?: string; on: boolean; onChange: (v: boolean) => void; lamp?: boolean }) {
  return (
    <div className="sw">
      {lamp !== undefined && <span className={`lamp-lo ${lamp ? 'on' : ''}`}>LOW<br />PRESSURE</span>}
      <button id={id} type="button" className="toggle" aria-pressed={on} aria-label={`${name} ${on ? 'ON' : 'OFF'}`} onClick={() => onChange(!on)} />
      <span className="name">{name}</span>
      {sub && <span className="sub">{sub}</span>}
    </div>
  )
}

export function Lab() {
  const [inp, setInp] = useState<HydInputs>(DEFAULT_INPUTS)
  const [scenario, setScenario] = useState<string>('normal')
  const s = evaluate(inp)
  const set = <K extends keyof HydInputs>(k: K, v: HydInputs[K]) => { setInp({ ...inp, [k]: v }); setScenario('') }
  const active = SCENARIOS.find((x) => x.id === scenario)

  // A pump's LOW PRESSURE light is on when that pump is not producing pressure.
  const lowEng1 = !(inp.pumpEng1 && inp.eng1Running)
  const lowElec2 = !(inp.pumpElec2 && inp.acPower)
  const lowElec1 = !(inp.pumpElec1 && inp.acPower)
  const lowEng2 = !(inp.pumpEng2 && inp.eng2Running)

  return (
    <>
      <section className="section">
        <span className="label">Systems lab · ATA 29</span>
        <h1>Hydraulics: what still works?</h1>
        <p className="muted" style={{ maxWidth: '66ch' }}>
          Turn pumps off, fail engines, change flaps, and watch which users lose pressure. Answer the scenario question before you look at the table. This is a simplified teaching model of the logic in FCOM 13 (no fluid quantity, leaks or pressure decay), so verify details in your FCOM.
        </p>
      </section>

      <div className="row">
        {SCENARIOS.map((sc) => (
          <button key={sc.id} className="chip" aria-pressed={scenario === sc.id} onClick={() => { setInp({ ...DEFAULT_INPUTS, ...sc.inputs }); setScenario(sc.id) }}>{sc.title}</button>
        ))}
      </div>
      {active && (
        <div className="panel">
          <span className="label">Scenario · {active.title}</span>
          <p>{active.brief}</p>
          <p style={{ marginTop: 8 }}><b>Question:</b> {active.question}</p>
        </div>
      )}

      <div className="grid-2">
        <div className="ovhd">
          <div className="ovhd-title">Hydraulic pumps</div>
          <div className="ovhd-row">
            <Toggle id="sw-eng1" name="ENG 1" sub="Sys A" on={inp.pumpEng1} onChange={(v) => set('pumpEng1', v)} lamp={lowEng1} />
            <Toggle id="sw-elec2" name="ELEC 2" sub="Sys A" on={inp.pumpElec2} onChange={(v) => set('pumpElec2', v)} lamp={lowElec2} />
            <Toggle id="sw-elec1" name="ELEC 1" sub="Sys B" on={inp.pumpElec1} onChange={(v) => set('pumpElec1', v)} lamp={lowElec1} />
            <Toggle id="sw-eng2" name="ENG 2" sub="Sys B" on={inp.pumpEng2} onChange={(v) => set('pumpEng2', v)} lamp={lowEng2} />
          </div>
          <div className="ovhd-title">Flight control</div>
          <div className="ovhd-row three">
            <label className="sw"><span className="name">FLT CONTROL A</span>
              <select id="sel-fca" className="sel" value={inp.fltCtlA} onChange={(e) => set('fltCtlA', e.target.value as HydInputs['fltCtlA'])}>
                <option>STBY RUD</option><option>OFF</option><option>ON</option>
              </select></label>
            <label className="sw"><span className="name">FLT CONTROL B</span>
              <select id="sel-fcb" className="sel" value={inp.fltCtlB} onChange={(e) => set('fltCtlB', e.target.value as HydInputs['fltCtlB'])}>
                <option>STBY RUD</option><option>OFF</option><option>ON</option>
              </select></label>
            <Toggle id="sw-altflaps" name="ALT FLAPS" sub="Arm" on={inp.altFlapsArm} onChange={(v) => set('altFlapsArm', v)} />
          </div>
          <div className="ovhd-title">Conditions</div>
          <div className="ovhd-row">
            <Toggle id="sw-e1run" name="Engine 1" sub="Running" on={inp.eng1Running} onChange={(v) => set('eng1Running', v)} />
            <Toggle id="sw-e2run" name="Engine 2" sub="Running" on={inp.eng2Running} onChange={(v) => set('eng2Running', v)} />
            <Toggle id="sw-ac" name="AC power" sub="To EMDPs" on={inp.acPower} onChange={(v) => set('acPower', v)} />
            <Toggle id="sw-air" name="Airborne" sub="or >60 kt" on={inp.airborne} onChange={(v) => set('airborne', v)} />
          </div>
          <label className="sw"><span className="name">Flap lever</span>
            <select id="sel-flaps" className="sel" value={inp.flaps} onChange={(e) => set('flaps', e.target.value as FlapPos)}>
              <option value="UP">UP</option><option value="1-10">1 to 10</option><option value="15+">15 and greater</option>
            </select></label>
        </div>

        <div className="section" style={{ gap: 12, minWidth: 0 }}>
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
          <div className="panel table-wrap" style={{ padding: 12 }}>
            <table className="users">
              <thead><tr><th>User</th><th>Powered by</th></tr></thead>
              <tbody>
                {s.users.map((u) => (
                  <tr key={u.name}>
                    <td><span className={`dot ${u.powered ? 'on' : ''}`} aria-hidden="true" />{u.name}</td>
                    <td className="via" style={{ color: u.powered ? undefined : 'var(--bad)' }}>{u.via}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <p className="source">Model basis: FCOM Vol 2, 13 Hydraulics. Unverified: check users and activation logic against your airline's FCOM revision.</p>
    </>
  )
}
