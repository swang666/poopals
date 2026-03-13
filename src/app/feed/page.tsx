'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDogAuth } from '@/contexts/DogAuthContext'
import { Button } from '@/components/ui/button'
import { ScatScanner } from '@/components/ScatScanner'
import { ReportCard, AIAnalysisResult } from '@/components/ReportCard'
import { analyzeScatImage } from '@/app/actions/gemini'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface FeedItem {
  id: string
  created_at: string
  health_score: number
  privacy_setting: string
  image_url?: string
  summary?: string
  note?: string
  consistency?: string
  color?: string
  anomalies?: string
  dogs?: {
    id: string
    name: string
    breed: string | null
    profile_picture_url?: string | null
  }
}

interface DogSearchResult {
  id: string
  name: string
  breed: string | null
  profile_picture_url?: string | null
}

export default function FeedPage() {
  const { currentDog, logoutDog, isLoading } = useDogAuth()
  const router = useRouter()
  
  const [isScanning, setIsScanning] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [capturedImage, setCapturedImage] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [feedItems, setFeedItems] = useState<FeedItem[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  // Friend Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DogSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Image Reveal State
  const [revealedImages, setRevealedImages] = useState<Record<string, boolean>>({})

  const toggleImageReveal = (id: string) => {
    setRevealedImages(prev => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    if (!isLoading && !currentDog) {
      router.push('/login')
    } else if (currentDog) {
      fetchFeed()
    }
  }, [isLoading, currentDog, router])

  const fetchFeed = async () => {
    setLoadingFeed(true)
    try {
      // In a real app we'd filter by friendships. For now, we grab all public poops 
      // where privacy_setting allows it, or it belongs to the current dog.
      const { data, error } = await supabase
        .from('poops')
        .select(`
          *,
          dogs ( id, name, breed, profile_picture_url )
        `)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setFeedItems(data || [])
    } catch (err) {
      console.error("Error fetching feed:", err)
    } finally {
      setLoadingFeed(false)
    }
  }

  const handleSearchFriends = async (query: string) => {
    setSearchQuery(query)
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('id, name, breed, profile_picture_url')
        .ilike('name', `%${query}%`)
        .neq('id', currentDog?.id)
        .limit(5)

      if (error) throw error
      setSearchResults(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFriend = async (friendId: string) => {
    if (!currentDog) return
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          dog_id_1: currentDog.id,
          dog_id_2: friendId,
          status: 'accepted' // Auto-accepting for the prototype
        })
      
      if (error) {
        if (error.code === '23505') {
          alert("Already in your pack!")
        } else {
          throw error
        }
      } else {
         alert("Added to pack successfully!")
         setSearchQuery('')
         setSearchResults([])
      }
    } catch (err) {
      console.error(err)
      alert("Failed to add friend.")
    }
  }

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading your pack...</div>
  if (!currentDog) return null

  const handleImageCaptured = async (file: File) => {
    setIsScanning(false)
    setIsAnalyzing(true)
    setCapturedImage(file)

    try {
      // Convert file to base64 for server action
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = reader.result as string;
        // Strip out the data url prefix for Gemini API
        const base64Data = base64String.split(',')[1];
        
        const result = await analyzeScatImage(base64Data)
        setAnalysisResult(result)
        setIsAnalyzing(false)
      };
    } catch (error) {
       console.error(error)
       alert("AI Analysis failed!")
       setIsAnalyzing(false)
       setCapturedImage(null)
    }
  }

  const handleCancelLogging = () => {
    setIsScanning(false)
    setAnalysisResult(null)
    setCapturedImage(null)
    setIsAnalyzing(false)
  }

  // Full Screen Overlays
  if (isScanning && !analysisResult && !isAnalyzing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <ScatScanner onImageCaptured={handleImageCaptured} onCancel={handleCancelLogging} />
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Analyzing Sample...</h2>
        <p className="text-gray-500 text-sm">Our AI Vet is taking a close look at the provided business trip.</p>
      </div>
    )
  }

  if (analysisResult && capturedImage) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ReportCard 
          analysis={analysisResult} 
          imageFile={capturedImage} 
          onCancel={handleCancelLogging} 
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold leading-tight text-amber-600">PooPals Feed</h1>
          <p className="text-sm text-gray-500 font-medium">Dog Park</p>
        </div>
        <div className="flex gap-2">
           <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-8 px-3">
              Find Pack
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Find other dogs</DialogTitle>
                <DialogDescription>
                  Search for friends by name to add them to your pack.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <Input 
                  placeholder="Search names (e.g., Buster)..." 
                  value={searchQuery}
                  onChange={(e) => handleSearchFriends(e.target.value)}
                />
                
                <div className="space-y-2">
                  {isSearching ? (
                    <p className="text-sm text-center text-gray-500">Sniffing...</p>
                  ) : searchResults.length > 0 ? (
                    searchResults.map(dog => (
                      <div key={dog.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          {dog.profile_picture_url ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={dog.profile_picture_url} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs">🐶</div>
                          )}
                          <div>
                            <p className="font-medium text-sm">{dog.name}</p>
                            <p className="text-xs text-gray-500">{dog.breed || 'Unknown breed'}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddFriend(dog.id)}>
                          Add
                        </Button>
                      </div>
                    ))
                  ) : searchQuery.length > 1 ? (
                    <p className="text-sm text-center text-gray-500">No dogs found.</p>
                  ) : null}
                </div>
              </div>
            </DialogContent>
          </Dialog>
           <Button variant="outline" size="sm" onClick={() => router.push('/profile')}>Edit Profile</Button>
           <Button variant="outline" size="sm" onClick={() => logoutDog()}>Logout</Button>
        </div>
      </header>
      
      <main className="max-w-md mx-auto p-4 space-y-6">
        <div className="bg-amber-100 rounded-lg p-4 text-amber-800 text-center flex flex-col items-center">
          {currentDog.profile_picture_url ? (
             /* eslint-disable-next-line @next/next/no-img-element */
             <img src={currentDog.profile_picture_url} alt="Profile" className="w-16 h-16 rounded-full border-2 border-white mb-2 object-cover" />
          ) : (
             <div className="w-16 h-16 rounded-full bg-white border-2 border-amber-200 mb-2 flex items-center justify-center text-3xl">🐶</div>
          )}
          <p className="font-semibold mb-1">Welcome back, {currentDog.name}!</p>
          <p className="text-sm opacity-80">This is where the magic happens.</p>
        </div>
        
        {/* Feed Items */}
        {loadingFeed ? (
          <div className="text-center py-10 text-gray-500">Loading feed...</div>
        ) : feedItems.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p>No business trips logged yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {feedItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="p-4 flex items-center justify-between border-b">
                  <div className="flex items-center gap-2">
                    {item.dogs?.profile_picture_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.dogs.profile_picture_url} alt={item.dogs.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-lg">
                        🐶
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">{item.dogs?.name}</p>
                      <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-bold text-sm">
                    Score: {item.health_score}/10
                  </div>
                </div>
                
                {item.privacy_setting === 'photo_and_score' && item.image_url ? (
                  <div className="aspect-[4/3] w-full bg-gray-100 relative overflow-hidden group">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.image_url} 
                      alt="Business Trip" 
                      className={`w-full h-full object-cover transition-all duration-300 ${!revealedImages[item.id] ? 'blur-xl scale-110 brightness-75' : ''}`} 
                    />
                    
                    {!revealedImages[item.id] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity">
                        <Button 
                          variant="secondary" 
                          className="rounded-full shadow-lg bg-white/90 hover:bg-white text-gray-700 font-medium"
                          onClick={() => toggleImageReveal(item.id)}
                        >
                          👁️ View Photo
                        </Button>
                      </div>
                    )}
                    
                    {revealedImages[item.id] && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="absolute top-2 right-2 rounded-full bg-black/40 text-white hover:bg-black/60 hover:text-white"
                        onClick={() => toggleImageReveal(item.id)}
                      >
                        Hide
                      </Button>
                    )}
                  </div>
                ) : (
                   <div className="bg-amber-50 p-6 text-center text-amber-800/60 italic text-sm">
                     Photo hidden by privacy settings
                   </div>
                )}
                
                <div className="p-4">
                  <p className="font-medium text-gray-800 mb-2">{item.summary}</p>
                  {item.note && (
                    <p className="text-sm text-gray-600 border-l-2 border-amber-200 pl-3 italic mb-3">&quot;{String(item.note)}&quot;</p>
                  )}
                  
                  <div className="flex gap-2 text-xs mt-3">
                    <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                      Vibe: {item.consistency}/7
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded flex items-center gap-1 text-gray-600">
                      <span className="w-2 h-2 rounded-full inline-block" style={{backgroundColor: item.color || '#000'}} />
                      {item.color}
                    </span>
                     {item.anomalies !== 'None' && (
                        <span className="bg-red-50 text-red-600 px-2 py-1 rounded">⚠️ Anomalies</span>
                     )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* Floating Action Button (Log Business) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <Button 
          className="rounded-full h-14 px-8 shadow-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg"
          onClick={() => setIsScanning(true)}
        >
          💩 Log Business
        </Button>
      </div>
    </div>
  )
}
