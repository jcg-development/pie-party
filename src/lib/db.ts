// src/lib/db.ts
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Category } from './config'

// ---------- Collection refs ----------
export const piesCol    = () => collection(db, 'pies')
export const votesCol   = () => collection(db, 'votes')      // doc id == user uid
export const winnersCol = () => collection(db, 'winners')
export const settingsDocRef = () => doc(db, 'settings', 'global')

// ---------- Types ----------
export type PieType = 'sweet' | 'savory'
export interface Pie {
  id: string
  name: string
  baker: string
  description: string
  photoURL: string
  type?: PieType               // older docs might not have this yet
  createdAt?: Timestamp
}

// ---------- Pies ----------
export async function listPies(): Promise<Pie[]> {
  // Newest first (by serverTimestamp). Docs without createdAt will still return;
  // Firestore will treat missing as null and they’ll sort last.
  const snap = await getDocs(query(piesCol(), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => {
    const data = d.data() as Omit<Pie, 'id'>
    return { id: d.id, ...data }
  })
}


// ---------- Settings (voting open/closed) ----------
export async function getSettings(): Promise<{ votingOpen: boolean }> {
  const s = await getDoc(settingsDocRef())
  if (!s.exists()) return { votingOpen: true }
  const data = s.data() as { votingOpen?: boolean }
  return { votingOpen: !!data.votingOpen }
}

export async function setSettings(data: { votingOpen: boolean }) {
  await setDoc(settingsDocRef(), data, { merge: true })
}

// ---------- Voting ----------
export async function saveVote(uid: string, pieId: string, category: Category) {
  // one vote doc per user; store per-category selection
  const ref = doc(db, 'votes', uid)
  const prev = await getDoc(ref)
  const payload = prev.exists() ? prev.data() as Record<string, any> : {}
  payload[category] = pieId
  payload.updatedAt = serverTimestamp()
  await setDoc(ref, payload, { merge: true })
}

export async function getAllVotes() {
  const snap = await getDocs(votesCol())
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
}

// ---------- Winners ----------
export async function markWinner(year: string, pie: Pie) {
  return addDoc(winnersCol(), {
    year,
    pieId: pie.id,
    title: pie.name,
    baker: pie.baker,
    photoURL: pie.photoURL,
    createdAt: serverTimestamp(),
  })
}

export async function listWinners() {
  const snap = await getDocs(query(winnersCol(), orderBy('year', 'desc')))
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
}

// …imports…
export interface Pie { /* … */ photoURL: string; photoPath?: string; /* … */ }

export async function submitPie(data: {
  name: string; baker: string; description: string; photoURL: string; photoPath: string; type: 'sweet'|'savory'
}) {
  return addDoc(piesCol(), { ...data, createdAt: serverTimestamp() })
}

export async function deletePieDoc(pieId: string) {
  await deleteDoc(doc(db, 'pies', pieId))
}

export async function cleanupVotesForPie(pieId: string, categories: readonly string[]) {
  const snap = await getDocs(votesCol())
  const tasks: Promise<any>[] = []
  snap.forEach(v => {
    const data = v.data() as Record<string, any>
    let changed = false
    for (const c of categories) {
      if (data[c] === pieId) { delete data[c]; changed = true }
    }
    if (changed) tasks.push(setDoc(doc(db, 'votes', v.id), data, { merge: true }))
  })
  await Promise.all(tasks)
}

// ---------- RSVPs ----------
export interface RSVP {
  id: string
  name: string
  email: string | null
  guests: number
  pieType: 'sweet' | 'savory'
  notes: string | null
  createdAt?: Timestamp
}

export async function listRSVPs(): Promise<RSVP[]> {
  const snap = await getDocs(query(collection(db, 'rsvps'), orderBy('createdAt', 'desc')))
  return snap.docs.map(d => {
    const data = d.data() as Omit<RSVP, 'id'>
    return { id: d.id, ...data }
  })
}

export async function getPieTypeCounts(): Promise<{ sweet: number; savory: number }> {
  const rsvps = await listRSVPs()
  const counts = { sweet: 0, savory: 0 }
  rsvps.forEach(rsvp => {
    if (rsvp.pieType === 'sweet') counts.sweet++
    else if (rsvp.pieType === 'savory') counts.savory++
  })
  return counts
}
