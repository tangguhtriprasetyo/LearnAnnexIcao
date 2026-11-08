/**
 * Generated scenario questions. A failure plus a flight phase are fed through the hydraulic model,
 * and the correct answer is computed from the resulting state, so questions never drift out of
 * sync with the lab. If the model is wrong, the questions are wrong too: verify hydraulics.ts.
 */
import { rng, shuffle } from '../lib/random'
import {
  DEFAULT_INPUTS, evaluate, lowPressureLights, PUMP_LIGHTS, USER_SOURCES,
  type FlapPos, type HydInputs, type HydState, type PumpLight,
} from './hydraulics'

export interface Failure { id: string; text: string; inputs: Partial<HydInputs> }
export interface Phase { id: string; text: string; airborne: boolean; groundFast: boolean; flaps: FlapPos }

export const FAILURES: Failure[] = [
  { id: 'eng1', text: 'Engine 1 fails', inputs: { eng1Running: false } },
  { id: 'eng2', text: 'Engine 2 fails', inputs: { eng2Running: false } },
  { id: 'loss-a', text: 'Both system A pumps fail (ENG 1 and ELEC 2 LOW PRESSURE)', inputs: { pumpEng1: false, pumpElec2: false } },
  { id: 'loss-b', text: 'Both system B pumps fail (ENG 2 and ELEC 1 LOW PRESSURE)', inputs: { pumpEng2: false, pumpElec1: false } },
  { id: 'eng1-elec2', text: 'Engine 1 fails, and the ELEC 2 hydraulic pump then fails', inputs: { eng1Running: false, pumpElec2: false } },
  { id: 'eng2-elec1', text: 'Engine 2 fails, and the ELEC 1 hydraulic pump then fails', inputs: { eng2Running: false, pumpElec1: false } },
  { id: 'b-edp', text: 'The ENG 2 engine-driven hydraulic pump fails (engine still running)', inputs: { pumpEng2: false } },
  { id: 'a-edp', text: 'The ENG 1 engine-driven hydraulic pump fails (engine still running)', inputs: { pumpEng1: false } },
  { id: 'no-ac', text: 'AC power to both electric hydraulic pumps is lost', inputs: { acPower: false } },
  { id: 'loss-ab', text: 'All four main hydraulic pumps fail (loss of systems A and B)', inputs: { pumpEng1: false, pumpElec2: false, pumpEng2: false, pumpElec1: false } },
]

export const PHASES: Phase[] = [
  { id: 'to-roll', text: 'on the takeoff roll above 60 kt, flaps 5', airborne: false, groundFast: true, flaps: '1-10' },
  { id: 'climb', text: 'in the initial climb, flaps 5', airborne: true, groundFast: false, flaps: '1-10' },
  { id: 'cruise', text: 'in cruise, flaps up', airborne: true, groundFast: false, flaps: 'UP' },
  { id: 'approach', text: 'on final approach, flaps 30', airborne: true, groundFast: false, flaps: '15+' },
  { id: 'taxi', text: 'while taxiing below 60 kt, flaps 5', airborne: false, groundFast: false, flaps: '1-10' },
]

export type QuizKind = 'not-available' | 'available' | 'standby' | 'ptu' | 'rudder' | 'lights'
export const KIND_LABEL: Record<QuizKind, string> = {
  'not-available': 'What is lost',
  available: 'What still works',
  standby: 'Standby system',
  ptu: 'PTU',
  rudder: 'Rudder power',
  lights: 'LOW PRESSURE lights',
}

export interface ScenarioQuestion {
  seed: number
  failure: Failure
  phase: Phase
  kind: QuizKind
  inputs: HydInputs
  state: HydState
  scenario: string
  stem: string
  options: string[]
  answer: number
  explanation: string[]
}

type Built = { stem: string; correct: string; distractors: string[]; explanation: string[] } | null

const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]

function notAvailable(s: HydState, r: () => number): Built {
  const lost = s.users.filter((u) => !u.powered)
  const ok = s.users.filter((u) => u.powered)
  if (lost.length < 1 || ok.length < 3) return null
  const target = pick(r, lost)
  return {
    stem: 'Which of the following has NO hydraulic power?',
    correct: target.name,
    distractors: shuffle(ok, Math.floor(r() * 1e9)).slice(0, 3).map((u) => u.name),
    explanation: [`${target.name} is unpowered (${target.via}). It is fed by ${USER_SOURCES[target.name]}.`],
  }
}

function available(s: HydState, r: () => number): Built {
  const lost = s.users.filter((u) => !u.powered)
  const ok = s.users.filter((u) => u.powered)
  if (ok.length < 1 || lost.length < 3) return null
  const target = pick(r, ok)
  return {
    stem: 'Which of the following still has hydraulic power?',
    correct: target.name,
    distractors: shuffle(lost, Math.floor(r() * 1e9)).slice(0, 3).map((u) => u.name),
    explanation: [`${target.name} is still powered via ${target.via}. It is fed by ${USER_SOURCES[target.name]}.`],
  }
}

function standby(s: HydState, i: HydInputs): Built {
  const pool = {
    run: 'Running: activated automatically',
    both: 'Off: systems A and B are both still pressurised',
    flaps: 'Off: flaps are up, so automatic activation is not armed',
    ground: 'Off: on the ground below 60 kt wheel speed',
    noac: 'Off: no AC power for the standby pump',
  }
  let key: keyof typeof pool
  if (s.standby) key = 'run'
  else if (s.sysA && s.sysB) key = 'both'
  else if (i.flaps === 'UP') key = 'flaps'
  else if (!i.airborne && !i.groundFast) key = 'ground'
  else key = 'noac'
  const why: Record<keyof typeof pool, string> = {
    run: 'Automatic standby needs: loss of system A or B, flaps extended, airborne or wheel speed above 60 kt, and the FLT CONTROL switch for the failed system ON. All are met.',
    both: 'Automatic standby only starts when system A or B is lost. Both still have pressure here.',
    flaps: 'With flaps up, automatic standby is not armed, even though a system is lost. The crew can still start it manually with FLT CONTROL STBY RUD or ALTERNATE FLAPS ARM.',
    ground: 'Automatic activation needs airborne or wheel speed above 60 kt. Taxiing below 60 kt does not qualify.',
    noac: 'The activation conditions are met, but the standby pump is an AC electric pump. With no AC it cannot run.',
  }
  return {
    stem: 'What is the status of the standby hydraulic system?',
    correct: pool[key],
    distractors: Object.entries(pool).filter(([k]) => k !== key).map(([, v]) => v),
    explanation: [why[key]],
  }
}

function ptu(s: HydState, i: HydInputs): Built {
  if (!s.bEdpLow) return null // PTU questions are only interesting when the B EDP is lost
  const pool = {
    run: 'Operating: system A drives the LE flaps, slats and autoslats',
    edp: 'Off: the system B engine-driven pump is still producing pressure',
    ground: 'Off: the aircraft is on the ground',
    flaps: 'Off: flaps are outside the PTU range (up, or 15 and greater)',
    noa: 'Off: system A is not available to drive it',
  }
  let key: keyof typeof pool
  if (s.ptu) key = 'run'
  else if (!i.airborne) key = 'ground'
  else if (i.flaps !== '1-10') key = 'flaps'
  else key = 'noa'
  return {
    stem: 'Is the power transfer unit (PTU) operating?',
    correct: pool[key],
    distractors: Object.entries(pool).filter(([k]) => k !== key).map(([, v]) => v),
    explanation: [
      'The PTU runs when: airborne, system B engine-driven pump pressure low, flaps less than 15 but not up, and system A pressurised to drive it.',
      key === 'run' ? 'All conditions are met. It backs up the autoslat function.' : `Not met here: ${pool[key].replace('Off: ', '')}.`,
    ],
  }
}

const RUDDER_LABEL: Record<string, string> = {
  'A + B': 'Systems A and B',
  'A + B + Standby PCU': 'Systems A and B, plus the standby PCU',
  'A + Standby PCU': 'System A and the standby PCU',
  'B + Standby PCU': 'System B and the standby PCU',
  A: 'System A only',
  B: 'System B only',
  'Standby PCU': 'Standby rudder PCU only',
  'NO manual reversion': 'No hydraulic power, and no manual reversion',
}

function rudder(s: HydState): Built {
  const u = s.users.find((x) => x.name === 'Rudder')!
  const correct = RUDDER_LABEL[u.via]
  if (!correct) return null
  return {
    stem: 'What is powering the rudder?',
    correct,
    distractors: Object.values(RUDDER_LABEL).filter((v) => v !== correct),
    explanation: [
      `Rudder: ${u.via}.`,
      'The rudder has no manual reversion, which is why the standby rudder PCU on the standby system exists. The standby system powers it only when standby is running.',
    ],
  }
}

const lightLabel = (set: PumpLight[]) => (set.length === 0 ? 'None' : set.join(', '))

function lights(i: HydInputs, r: () => number): Built {
  const on = lowPressureLights(i)
  const correctSet = PUMP_LIGHTS.filter((p) => on[p])
  const correct = lightLabel(correctSet)
  // Distractors: the classic confusions first (ELEC pumps cross-wired to the wrong system), then random sets.
  const swap = (p: PumpLight): PumpLight => (p === 'ELEC 1' ? 'ELEC 2' : p === 'ELEC 2' ? 'ELEC 1' : p)
  const candidates = new Set<string>([lightLabel(PUMP_LIGHTS.filter((p) => correctSet.map(swap).includes(p)))])
  while (candidates.size < 12) {
    candidates.add(lightLabel(PUMP_LIGHTS.filter(() => r() < 0.5)))
  }
  candidates.delete(correct)
  return {
    stem: 'Which hydraulic pump LOW PRESSURE lights are illuminated?',
    correct,
    distractors: [...candidates],
    explanation: [
      'A pump LOW PRESSURE light comes on when that pump is not producing pressure: switch off, pump failed, engine not running (EDP), or no AC (EMDP).',
      'System A is ENG 1 + ELEC 2. System B is ELEC 1 + ENG 2. The electric pumps are crossed so that one engine failure never removes both pumps of one system.',
    ],
  }
}

const KINDS: QuizKind[] = ['not-available', 'available', 'standby', 'ptu', 'rudder', 'lights']

export function generateScenarioQuestion(seed: number, kinds: QuizKind[] = KINDS): ScenarioQuestion {
  const r = rng(seed)
  for (let attempt = 0; attempt < 50; attempt++) {
    const failure = pick(r, FAILURES)
    const phase = pick(r, PHASES)
    const kind = pick(r, kinds)
    const inputs: HydInputs = { ...DEFAULT_INPUTS, ...failure.inputs, airborne: phase.airborne, groundFast: phase.groundFast, flaps: phase.flaps }
    const state = evaluate(inputs)
    const built: Built =
      kind === 'not-available' ? notAvailable(state, r)
      : kind === 'available' ? available(state, r)
      : kind === 'standby' ? standby(state, inputs)
      : kind === 'ptu' ? ptu(state, inputs)
      : kind === 'rudder' ? rudder(state)
      : lights(inputs, r)
    if (!built) continue
    const distractors = [...new Set(built.distractors.filter((d) => d !== built.correct))]
    const chosen = shuffle(distractors, Math.floor(r() * 1e9)).slice(0, 3)
    if (chosen.length < 2) continue
    const options = shuffle([built.correct, ...chosen], Math.floor(r() * 1e9))
    return {
      seed, failure, phase, kind, inputs, state,
      scenario: `${failure.text} ${phase.text}. All other switches are in their normal positions.`,
      stem: built.stem,
      options,
      answer: options.indexOf(built.correct),
      explanation: built.explanation,
    }
  }
  throw new Error(`could not generate a scenario question for seed ${seed}`)
}
