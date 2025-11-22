'use client'
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { listWinners } from '@/lib/db'

export default function WinnersPage() {
  const [winners, setWinners] = useState<any[]>([])
  useEffect(()=>{ (async()=> setWinners(await listWinners()))() },[])

  return (
    <section className="space-y-4">
      <h3 className="text-xl font-semibold">Winners Gallery</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {winners.map(w => (
          <div key={w.id} className="card overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">{w.title}</div>
              <span className="badge">{w.year}</span>
            </div>
            <div className="p-4">
              {w.photoURL ? <img src={w.photoURL} className="w-full h-48 object-cover rounded-xl" /> : <div className="h-48 bg-neutral-100 rounded-xl" />}
              <div className="text-sm text-neutral-600 mt-2">by {w.baker}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
