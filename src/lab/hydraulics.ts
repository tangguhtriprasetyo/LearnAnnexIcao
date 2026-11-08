/**
 * Simplified 737-800 hydraulic logic for teaching cause and effect.
 * NOT a certified model: no fluid quantity, no leaks, no pressure decay, no EMDP overheat.
 * Source basis: FCOM Vol 2, 13 Hydraulics (system description). Verify against your FCOM.
 */
export type FlapPos = 'UP' | '1-10' | '15+'

export interface HydInputs {
  eng1Running: boolean
  eng2Running: boolean
  acPower: boolean // AC available to the electric motor-driven pumps
  pumpEng1: boolean // system A EDP switch
  pumpElec2: boolean // system A EMDP switch
  pumpElec1: boolean // system B EMDP switch
  pumpEng2: boolean // system B EDP switch
  fltCtlA: 'ON' | 'OFF' | 'STBY RUD'
  fltCtlB: 'ON' | 'OFF' | 'STBY RUD'
  altFlapsArm: boolean
  airborne: boolean // or wheel speed > 60 kt
  flaps: FlapPos
}

export const DEFAULT_INPUTS: HydInputs = {
  eng1Running: true,
  eng2Running: true,
  acPower: true,
  pumpEng1: true,
  pumpElec2: true,
  pumpElec1: true,
  pumpEng2: true,
  fltCtlA: 'ON',
  fltCtlB: 'ON',
  altFlapsArm: false,
  airborne: true,
  flaps: '1-10',
}

export interface HydState {
  sysA: boolean
  sysB: boolean
  bEdpLow: boolean
  standby: boolean
  standbyReason: string | null
  ptu: boolean
  users: { name: string; powered: boolean; via: string }[]
}

export function evaluate(i: HydInputs): HydState {
  const aEdp = i.pumpEng1 && i.eng1Running
  const aEmdp = i.pumpElec2 && i.acPower
  const bEdp = i.pumpEng2 && i.eng2Running
  const bEmdp = i.pumpElec1 && i.acPower
  const sysA = aEdp || aEmdp
  const sysB = bEdp || bEmdp
  const flapsExtended = i.flaps !== 'UP'

  // Standby pump is an AC electric pump.
  let standbyReason: string | null = null
  if (i.fltCtlA === 'STBY RUD' || i.fltCtlB === 'STBY RUD') standbyReason = 'FLT CONTROL switch to STBY RUD'
  else if (i.altFlapsArm) standbyReason = 'ALTERNATE FLAPS master switch ARM'
  else if (
    flapsExtended &&
    i.airborne &&
    ((!sysA && i.fltCtlA === 'ON') || (!sysB && i.fltCtlB === 'ON'))
  )
    standbyReason = 'Automatic: A or B lost, flaps extended, airborne / >60 kt, FLT CONTROL ON'
  const standby = standbyReason !== null && i.acPower
  if (standbyReason && !i.acPower) standbyReason += ' (no AC: standby pump cannot run)'

  // PTU: airborne, B EDP pressure low, flaps < 15 but not up, and system A available to drive it.
  const bEdpLow = !bEdp
  const ptu = i.airborne && bEdpLow && i.flaps === '1-10' && sysA

  const rudderA = sysA && i.fltCtlA !== 'OFF' && i.fltCtlA !== 'STBY RUD'
  const rudderB = sysB && i.fltCtlB !== 'OFF' && i.fltCtlB !== 'STBY RUD'
  const via = (pairs: [boolean, string][]) => pairs.filter(([on]) => on).map(([, s]) => s).join(' + ')
  const user = (name: string, pairs: [boolean, string][], fallback = 'unpowered') => {
    const v = via(pairs)
    return { name, powered: v.length > 0, via: v || fallback }
  }

  const users = [
    user('Ailerons', [[sysA, 'A'], [sysB, 'B']], 'manual reversion'),
    user('Elevators & feel', [[sysA, 'A'], [sysB, 'B']], 'manual reversion'),
    user('Rudder', [[rudderA, 'A'], [rudderB, 'B'], [standby, 'Standby PCU']], 'NO manual reversion'),
    user('Flight spoilers', [[sysA, 'A (some)'], [sysB, 'B (some)']]),
    user('Ground spoilers', [[sysA, 'A']]),
    user('Trailing edge flaps', [[sysB, 'B']], 'alternate (electric) only'),
    user('LE flaps & slats', [[sysB, 'B'], [ptu, 'PTU (A)'], [standby, 'Standby (extend only)']]),
    user('Autoslats', [[sysB, 'B'], [ptu, 'PTU (A)']]),
    user('Landing gear', [[sysA, 'A'], [!sysA && sysB && i.airborne && !i.eng1Running, 'B via LGTU (retract)']], 'manual extension'),
    user('Nose wheel steering', [[sysA, 'A'], [sysB, 'B (alternate, if installed)']]),
    user('Normal brakes', [[sysB, 'B']]),
    user('Alternate brakes', [[sysA, 'A']], 'accumulator only'),
    user('Thrust reverser 1', [[sysA, 'A'], [standby, 'Standby (slower)']]),
    user('Thrust reverser 2', [[sysB, 'B'], [standby, 'Standby (slower)']]),
    user('Autopilot A', [[sysA, 'A']]),
    user('Autopilot B', [[sysB, 'B']]),
    user('Yaw damper', [[sysB, 'B']]),
  ]

  return { sysA, sysB, bEdpLow, standby, standbyReason, ptu, users }
}

export interface Scenario {
  id: string
  title: string
  brief: string
  inputs: Partial<HydInputs>
  question: string
}

export const SCENARIOS: Scenario[] = [
  { id: 'normal', title: 'Normal cruise', brief: 'All pumps on, both engines running.', inputs: {}, question: 'Which users have triple redundancy (A, B and standby)?' },
  { id: 'eng1-fail-to', title: 'Engine 1 failure after V1', brief: 'Engine 1 fails on takeoff, gear lever UP.', inputs: { eng1Running: false, flaps: '1-10' }, question: 'System A still has pressure. Which pump is keeping it up, and what happens if you also lose AC?' },
  { id: 'loss-a', title: 'Loss of system A', brief: 'Both system A pumps lost, approach configuration.', inputs: { pumpEng1: false, pumpElec2: false, flaps: '15+' }, question: 'Why does standby start automatically, and what is missing on landing roll?' },
  { id: 'loss-b-edp', title: 'System B EDP lost, flaps 5', brief: 'ENG 2 pump off with flaps 1-10 airborne.', inputs: { pumpEng2: false, pumpElec1: false, flaps: '1-10' }, question: 'What does the PTU now power, and why only in this flap range?' },
  { id: 'manual-rev', title: 'Loss of A and B', brief: 'Both main systems lost.', inputs: { pumpEng1: false, pumpElec2: false, pumpEng2: false, pumpElec1: false, flaps: '15+' }, question: 'Which controls are in manual reversion, and what still moves the rudder?' },
]
