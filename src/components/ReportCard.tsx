'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useDogAuth } from '@/contexts/DogAuthContext'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ReportCardProps {
  analysis: any
  imageFile: File
  onCancel: () => void
}

export function ReportCard({ analysis, imageFile, onCancel }: ReportCardProps) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const [sharePhoto, setSharePhoto] = useState(false)
  const { currentDog } = useDogAuth()
  const router = useRouter()

  const handleSaveAndShare = async () => {
    if (!currentDog) return
    setLoading(true)

    try {
      // 1. Upload Image to Supabase Storage (Simplified mock for now)
      const fileName = `${currentDog.id}-${Date.now()}.jpg`
      let imageUrl = null

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('poop_images')
        .upload(fileName, imageFile)

      if (uploadError) {
        console.error("Storage error:", uploadError)
        // Optionally continue without image if storage isn't setup
      } else {
        const { data: publicUrlData } = supabase.storage.from('poop_images').getPublicUrl(fileName)
        imageUrl = publicUrlData.publicUrl
      }

      // 2. Generate a mock Health Score (1-10) based on consistency
      const score = analysis.consistency === 4 ? 10 : 
                    (analysis.consistency > 4 ? 10 - (analysis.consistency - 4) * 2 : 10 - (4 - analysis.consistency) * 2)

      // 3. Save to Database
      const { error: dbError } = await supabase.from('poops').insert([{
        dog_id: currentDog.id,
        image_url: imageUrl,
        consistency: String(analysis.consistency),
        color: analysis.color?.name || analysis.color,
        anomalies: analysis.objects_detected ? 'Yes' : 'None',
        health_score: Math.max(1, score),
        summary: analysis.summary,
        note: note || null,
        privacy_setting: sharePhoto ? 'photo_and_score' : 'score_only'
      }])

      if (dbError) throw dbError

      // Refresh page to show new feed item
      window.location.reload()
      
    } catch (err) {
      console.error(err)
      alert("Failed to save report.")
    } finally {
      setLoading(false)
    }
  }

  // Derive simple score purely for UI mock display
  const mockScore = analysis.consistency === 4 ? 10 : 8

  return (
    <div className="bg-white rounded-xl shadow-lg border border-amber-100 overflow-hidden w-full max-w-md">
      <div className="bg-amber-600 text-white p-4 text-center">
        <h2 className="text-2xl font-bold font-serif">Report Card</h2>
        <p className="text-amber-100 opacity-90 text-sm italic">{analysis.summary}</p>
      </div>
      
      <div className="p-5 space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-amber-50 p-3 rounded-lg flex flex-col items-center">
            <span className="text-gray-500 mb-1">Consistency</span>
            <span className="font-bold text-lg text-amber-800">{analysis.consistency}/7</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg flex flex-col items-center">
            <span className="text-gray-500 mb-1">Color</span>
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full border border-gray-300" 
                style={{ backgroundColor: analysis.color?.hex || '#8B4513' }}
              />
              <span className="font-bold text-amber-800 line-clamp-1">{analysis.color?.name || 'Brown'}</span>
            </div>
          </div>
        </div>

        {/* Score Banner */}
        <div className="flex justify-between items-center bg-gray-50 border p-4 rounded-lg">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Health Score</p>
            <p className="text-3xl font-black text-gray-800">{mockScore}<span className="text-lg text-gray-400">/10</span></p>
          </div>
          <div className="text-right flex flex-col items-end">
             {analysis.objects_detected && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-800 text-xs font-medium mb-1">
                  ⚠️ Anomalies Detected
                </span>
             )}
            <span className="text-gray-500 text-xs">Bristol Scale Applied</span>
          </div>
        </div>

        {/* User Input */}
        <div className="space-y-3 pt-2">
          <Label htmlFor="note">Add a note (Optional)</Label>
          <Textarea 
            id="note"
            placeholder="e.g., Ate a sock again..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="resize-none"
          />
        </div>

        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex flex-col">
            <Label htmlFor="share-photo" className="font-medium text-gray-800">Share Photo with Pack?</Label>
            <span className="text-xs text-gray-500">If off, only the score is shared.</span>
          </div>
          <Switch 
            id="share-photo" 
            checked={sharePhoto}
            onCheckedChange={setSharePhoto}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={loading}>
            Discard
          </Button>
          <Button className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleSaveAndShare} disabled={loading}>
            {loading ? 'Saving...' : 'Post to Feed'}
          </Button>
        </div>

      </div>
    </div>
  )
}
