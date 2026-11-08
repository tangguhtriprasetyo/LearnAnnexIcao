import type { Domain, Topic } from './schema'

export const DOMAINS: { id: Domain; title: string; blurb: string }[] = [
  { id: 'systems', title: 'Aircraft Systems', blurb: 'FCOM Vol 2 by ATA chapter' },
  { id: 'limitations', title: 'Limitations', blurb: 'FCOM Vol 1 · L' },
  { id: 'procedures', title: 'Non-Normal Procedures', blurb: 'QRH memory items and NNC logic' },
  { id: 'performance', title: 'Performance & Technique', blurb: 'FCTM and ATPL performance' },
  { id: 'airlaw', title: 'ICAO Air Law', blurb: 'Chicago Convention, Annexes, PANS' },
]

export const TOPICS: Topic[] = [
  // 737-800 systems (FCOM Vol 2 chapter numbering)
  { id: 'sys-air', title: 'Air Systems', domain: 'systems', ref: 'ATA 21/36 · FCOM 2' },
  { id: 'sys-antiice', title: 'Anti-Ice & Rain', domain: 'systems', ref: 'ATA 30 · FCOM 3' },
  { id: 'sys-afds', title: 'Automatic Flight', domain: 'systems', ref: 'ATA 22 · FCOM 4' },
  { id: 'sys-elec', title: 'Electrical', domain: 'systems', ref: 'ATA 24 · FCOM 6' },
  { id: 'sys-eng', title: 'Engines & APU', domain: 'systems', ref: 'ATA 49/70 · FCOM 7' },
  { id: 'sys-fire', title: 'Fire Protection', domain: 'systems', ref: 'ATA 26 · FCOM 8' },
  { id: 'sys-fltctl', title: 'Flight Controls', domain: 'systems', ref: 'ATA 27 · FCOM 9' },
  { id: 'sys-fuel', title: 'Fuel', domain: 'systems', ref: 'ATA 28 · FCOM 12' },
  { id: 'sys-hyd', title: 'Hydraulics', domain: 'systems', ref: 'ATA 29 · FCOM 13' },
  { id: 'sys-gear', title: 'Landing Gear', domain: 'systems', ref: 'ATA 32 · FCOM 14' },
  { id: 'sys-warn', title: 'Warning Systems', domain: 'systems', ref: 'ATA 31 · FCOM 15' },
  // Limitations
  { id: 'lim-ops', title: 'Operating Limitations', domain: 'limitations', ref: 'FCOM L.10' },
  { id: 'lim-sys', title: 'System Limitations', domain: 'limitations', ref: 'FCOM L.10' },
  // Procedures
  { id: 'qrh-memory', title: 'Memory Items', domain: 'procedures', ref: 'QRH' },
  { id: 'qrh-nnc', title: 'Non-Normal Checklist Logic', domain: 'procedures', ref: 'QRH / FCTM' },
  // Performance
  { id: 'perf-to', title: 'Takeoff Performance', domain: 'performance', ref: 'FCTM 3 / ATPL 032' },
  { id: 'perf-ldg', title: 'Approach & Landing', domain: 'performance', ref: 'FCTM 5-6 / ATPL 032' },
  // ICAO Air Law
  { id: 'al-convention', title: 'Chicago Convention', domain: 'airlaw', ref: 'Doc 7300' },
  { id: 'al-annex1', title: 'Annex 1 · Personnel Licensing', domain: 'airlaw', ref: 'Annex 1' },
  { id: 'al-annex2', title: 'Annex 2 · Rules of the Air', domain: 'airlaw', ref: 'Annex 2' },
  { id: 'al-annex6', title: 'Annex 6 · Operation of Aircraft', domain: 'airlaw', ref: 'Annex 6 Part I' },
  { id: 'al-annex7-8', title: 'Annex 7 & 8 · Registration, Airworthiness', domain: 'airlaw', ref: 'Annex 7, 8' },
  { id: 'al-annex11', title: 'Annex 11 · Air Traffic Services', domain: 'airlaw', ref: 'Annex 11' },
  { id: 'al-annex12', title: 'Annex 12 · Search and Rescue', domain: 'airlaw', ref: 'Annex 12' },
  { id: 'al-annex13', title: 'Annex 13 · Accident Investigation', domain: 'airlaw', ref: 'Annex 13' },
  { id: 'al-annex14', title: 'Annex 14 · Aerodromes', domain: 'airlaw', ref: 'Annex 14 Vol I' },
  { id: 'al-pans', title: 'PANS-OPS & PANS-ATM', domain: 'airlaw', ref: 'Doc 8168, Doc 4444' },
]

export const topicById = new Map(TOPICS.map((t) => [t.id, t]))
