'use client'
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, PrimaryButton, SecondaryButton } from '@/components/ui'
import { ensureAnonAuth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export default function FeedbackPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [scoringFeedback, setScoringFeedback] = useState('')
  const [flowFeedback, setFlowFeedback] = useState('')
  const [generalFeedback, setGeneralFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [userReady, setUserReady] = useState(false)

  useEffect(() => {
    (async () => {
      await ensureAnonAuth()
      setUserReady(true)
    })()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!scoringFeedback.trim() && !flowFeedback.trim() && !generalFeedback.trim()) {
      alert('Please provide at least one type of feedback.')
      return
    }

    setLoading(true)
    try {
      await addDoc(collection(db, 'feedback'), {
        name: name.trim() || 'Anonymous',
        email: email.trim() || null,
        scoringFeedback: scoringFeedback.trim() || null,
        flowFeedback: flowFeedback.trim() || null,
        generalFeedback: generalFeedback.trim() || null,
        createdAt: serverTimestamp()
      })
      
      setSubmitted(true)
      // Clear form
      setName('')
      setEmail('')
      setScoringFeedback('')
      setFlowFeedback('')
      setGeneralFeedback('')
      
      // Reset submitted state after 5 seconds
      setTimeout(() => setSubmitted(false), 5000)
    } catch (e) {
      console.error('Feedback submission failed:', e)
      alert('Failed to submit feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💭 Party Feedback & Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 border-2 border-blue-200 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">We Want Your Input!</h3>
              <p className="text-sm text-blue-800">
                Help us make future Pie Parties even better! Share your thoughts on the scoring system, 
                event flow, or any other suggestions you have. All feedback is welcome and appreciated.
              </p>
            </div>

            {submitted && (
              <div className="rounded-xl bg-emerald-50 border-2 border-emerald-200 p-4">
                <p className="font-semibold text-emerald-900">✅ Thank you for your feedback!</p>
                <p className="text-sm text-emerald-800 mt-1">We appreciate you taking the time to share your thoughts.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Info (Optional) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-neutral-900">Your Info (Optional)</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <input
                    className="input"
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className="input"
                    type="email"
                    placeholder="Email (optional - for follow-up)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Leave blank to submit anonymously
                </p>
              </div>

              {/* Scoring System Feedback */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">🏆</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900">Scoring System Thoughts</h4>
                    <p className="text-sm text-neutral-600 mt-1">
                      Current system: Winners determined by combined votes across PieZaz, Taste, and Presentation. 
                      What do you think? Any suggestions for improvement?
                    </p>
                  </div>
                </div>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Share your thoughts on the scoring system... (e.g., too simple? too complex? fair? alternative ideas?)"
                  value={scoringFeedback}
                  onChange={(e) => setScoringFeedback(e.target.value)}
                />
              </div>

              {/* Party Flow Feedback */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">🎉</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900">Party Flow & Organization</h4>
                    <p className="text-sm text-neutral-600 mt-1">
                      Timing, tasting format, voting process, announcements, etc. What worked well? What could be better?
                    </p>
                  </div>
                </div>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Share your thoughts on the party flow... (e.g., timing, tasting format, voting process, etc.)"
                  value={flowFeedback}
                  onChange={(e) => setFlowFeedback(e.target.value)}
                />
              </div>

              {/* General Feedback */}
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-2xl">💡</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900">Other Suggestions</h4>
                    <p className="text-sm text-neutral-600 mt-1">
                      Anything else on your mind? Categories, prizes, format, activities, etc.
                    </p>
                  </div>
                </div>
                <textarea
                  className="textarea"
                  rows={4}
                  placeholder="Any other ideas or suggestions..."
                  value={generalFeedback}
                  onChange={(e) => setGeneralFeedback(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3">
                <PrimaryButton 
                  type="submit" 
                  disabled={loading || !userReady}
                  className="flex-1 md:flex-initial"
                >
                  {loading ? 'Submitting...' : '📝 Submit Feedback'}
                </PrimaryButton>
                {!submitted && (scoringFeedback || flowFeedback || generalFeedback) && (
                  <SecondaryButton
                    type="button"
                    onClick={() => {
                      setScoringFeedback('')
                      setFlowFeedback('')
                      setGeneralFeedback('')
                    }}
                  >
                    Clear
                  </SecondaryButton>
                )}
              </div>

              {!userReady && (
                <p className="text-xs text-amber-700">Signing you in anonymously...</p>
              )}
            </form>

            {/* Example Prompts */}
            <div className="rounded-xl bg-neutral-50 border p-4 mt-6">
              <h4 className="font-semibold text-neutral-900 mb-2">💭 Things to Consider:</h4>
              <ul className="text-sm text-neutral-700 space-y-1">
                <li>• Should we have separate categories for different types of pies?</li>
                <li>• Would it be better to have one winner overall vs. sweet/savory winners?</li>
                <li>• Should voting be blind (no names shown)?</li>
                <li>• More time for tasting? Different schedule?</li>
                <li>• Additional awards (e.g., "Most Creative", "Best Crust")?</li>
                <li>• Better way to display/present the pies?</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
