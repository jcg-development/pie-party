'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, PrimaryButton } from '@/components/ui'
import { ensureAnonAuth } from '@/lib/firebase'
import { listPies, submitPie, getSettings } from '@/lib/db'
import { uploadPieImage } from '@/lib/storage'

type PieType = 'sweet' | 'savory'
type SortKey = 'newest' | 'oldest' | 'az' | 'za' | 'sweetFirst' | 'savoryFirst'

export default function SubmitPage() {
  const [userReady, setUserReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submissionsOpen, setSubmissionsOpen] = useState(false)
  const [loadingSettings, setLoadingSettings] = useState(true)

  // form
  const [name, setName] = useState('')
  const [baker, setBaker] = useState('')
  const [desc, setDesc] = useState('')
  const [type, setType] = useState<PieType>('sweet')
  const [file, setFile] = useState<File | null>(null)

  // list / ui
  const [pies, setPies] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | PieType>('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  useEffect(() => {
    (async () => {
      await ensureAnonAuth()
      setUserReady(true)
      const settings = await getSettings()
      setSubmissionsOpen(settings.submissionsOpen)
      setLoadingSettings(false)
      await refreshList()
    })()
  }, [])

  async function refreshList() {
    try {
      const items = await listPies() // newest-first from DB helper
      setPies(items)
    } catch (e) {
      console.error('Failed to load pies', e)
      alert('Could not load current entries. Check your network or Firestore rules.')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return alert('Please attach a photo of your pie.')
    if (!name.trim() || !baker.trim()) return alert('Name and Baker are required.')
    setLoading(true)
    try {
      const {url,path} = await uploadPieImage(file)
      await submitPie({
        name: name.trim(),
        baker: baker.trim(),
        description: desc.trim(),
        photoURL: url,
        photoPath: path,
        type
      })
      setName(''); setBaker(''); setDesc(''); setFile(null); setType('sweet')
      await refreshList()
      alert('Pie submitted! 🍰')
    } catch (e) {
      console.error(e); alert('Upload failed. Check Firebase config & rules.')
    } finally {
      setLoading(false)
    }
  }

  // ——— filtering, searching, sorting ———
  const norm = (s: any) => (s ?? '').toString().toLowerCase()
  const tokens = useMemo(() => norm(search).split(/\s+/).filter(Boolean), [search])

  const filtered = useMemo(() => {
    return pies.filter((p) => {
      // filter by type
      if (filter !== 'all' && (p?.type ?? 'unspecified') !== filter) return false
      // search: name, baker, description, type
      if (tokens.length === 0) return true
      const hay = `${norm(p?.name)} ${norm(p?.baker)} ${norm(p?.description)} ${norm(p?.type)}`
      return tokens.every(t => hay.includes(t))
    })
  }, [pies, filter, tokens])

  const sorted = useMemo(() => {
    const arr = [...filtered]
    switch (sortKey) {
      case 'oldest':
        arr.sort((a,b) => (a.createdAt?.seconds ?? 0) - (b.createdAt?.seconds ?? 0))
        break
      case 'az':
        arr.sort((a,b) => norm(a.name).localeCompare(norm(b.name)))
        break
      case 'za':
        arr.sort((a,b) => norm(b.name).localeCompare(norm(a.name)))
        break
      case 'sweetFirst':
        arr.sort((a,b) => (norm(a.type) === 'sweet' ? -1 : 1) - (norm(b.type) === 'sweet' ? -1 : 1) || norm(a.name).localeCompare(norm(b.name)))
        break
      case 'savoryFirst':
        arr.sort((a,b) => (norm(a.type) === 'savory' ? -1 : 1) - (norm(b.type) === 'savory' ? -1 : 1) || norm(a.name).localeCompare(norm(b.name)))
        break
      case 'newest':
      default:
        arr.sort((a,b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        break
    }
    return arr
  }, [filtered, sortKey])

  return (
    <div className="space-y-6">
      {/* Current Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>Current Entries</span>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="input w-56"
                placeholder="Search pies, bakers, notes…"
                value={search}
                onChange={e=>setSearch(e.target.value)}
              />
              <select className="select" value={filter} onChange={e=>setFilter(e.target.value as any)}>
                <option value="all">All types</option>
                <option value="sweet">🍰 Sweet</option>
                <option value="savory">🥟 Savory</option>
              </select>
              <select className="select" value={sortKey} onChange={e=>setSortKey(e.target.value as SortKey)}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A–Z (name)</option>
                <option value="za">Z–A (name)</option>
                <option value="sweetFirst">🍰 Sweet first</option>
                <option value="savoryFirst">🥟 Savory first</option>
              </select>
              <button className="btn btn-secondary" onClick={refreshList}>Refresh</button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-neutral-600">No pies match your filters—try clearing search or switching filters.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sorted.map((p:any) => (
                <div key={p.id} className="card overflow-hidden">
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-neutral-600">by {p.baker}</div>
                    </div>
                    <span className={`badge ${p?.type === 'savory' ? 'border-emerald-300' : 'border-amber-300'}`}>
                      {p?.type === 'savory' ? '🥟 Savory' : p?.type === 'sweet' ? '🍰 Sweet' : '❓ Unspecified'}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    {p.photoURL
                      ? <img src={p.photoURL} className="w-full h-44 object-cover rounded-xl" alt={p.name}/>
                      : <div className="h-44 bg-neutral-100 rounded-xl grid place-items-center text-neutral-400">No photo</div>}
                    <p className="text-sm text-neutral-700 line-clamp-3">{p.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Form */}
      <Card>
        <CardHeader><CardTitle>Submit Your Pie</CardTitle></CardHeader>
        <CardContent>
          {loadingSettings ? (
            <p className="text-sm text-neutral-600">Loading...</p>
          ) : !submissionsOpen ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-6xl">🥧</div>
              <h3 className="text-xl font-semibold">Submissions Coming Soon!</h3>
              <p className="text-neutral-600">
                You can submit your pie on the night of the party.
              </p>
              <p className="text-neutral-600">
                See you soon! ❤️
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <input className="input" placeholder="Pie name (e.g., Maple Pecan)" value={name} onChange={e=>setName(e.target.value)} />
                <input className="input" placeholder="Baker name" value={baker} onChange={e=>setBaker(e.target.value)} />
                {/* Pie type selector */}
                <div className="flex flex-wrap items-center gap-4">
                  <label className="text-sm text-neutral-700">Type:</label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="sweet" checked={type==='sweet'} onChange={()=>setType('sweet')} />
                    <span>🍰 Sweet</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="savory" checked={type==='savory'} onChange={()=>setType('savory')} />
                    <span>🥟 Savory</span>
                  </label>
                </div>
                <textarea className="textarea" placeholder="Short description (ingredients, story, allergens)" rows={6} value={desc} onChange={e=>setDesc(e.target.value)} />
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border p-4 bg-neutral-50">
                  <p className="text-sm text-neutral-600 mb-2">Photo (JPG/PNG)</p>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={e=>setFile(e.target.files?.[0]||null)} 
                  />
                  <div className="text-xs text-neutral-500 mt-2">Take a photo or upload from your device. Max ~10MB recommended.</div>
                </div>
                <PrimaryButton type="submit" disabled={loading || !userReady} className="w-full">
                  {loading ? 'Uploading…' : 'Submit Pie'}
                </PrimaryButton>
                {!userReady && <p className="text-xs text-amber-700">Signing you in anonymously…</p>}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
