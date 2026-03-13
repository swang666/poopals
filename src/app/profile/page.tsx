'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useDogAuth } from '@/contexts/DogAuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function ProfilePage() {
  const { currentDog, isLoading } = useDogAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    primary_food_brand: ''
  })
  
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load current dog data into the form
  useEffect(() => {
    if (!isLoading) {
      if (!currentDog) {
        router.push('/login')
      } else {
        setFormData({
          name: currentDog.name || '',
          breed: currentDog.breed || '',
          age: currentDog.age ? String(currentDog.age) : '',
          weight: currentDog.weight ? String(currentDog.weight) : '',
          primary_food_brand: currentDog.primary_food_brand || ''
        })
        setPreviewUrl(currentDog.profile_picture_url || null)
      }
    }
  }, [currentDog, isLoading, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => setPreviewUrl(event.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentDog) return

    setLoading(true)

    try {
      let profile_picture_url = currentDog.profile_picture_url

      if (imageFile) {
        const fileName = `${currentDog.id}-${Date.now()}.jpg`
        const { error: uploadError } = await supabase
          .storage
          .from('profile_images')
          .upload(fileName, imageFile)

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage.from('profile_images').getPublicUrl(fileName)
          profile_picture_url = publicUrlData.publicUrl
        } else {
          console.error("Image upload failed:", uploadError)
        }
      }

      const { error } = await supabase
        .from('dogs')
        .update({
          name: formData.name,
          breed: formData.breed || null,
          age: formData.age ? parseInt(formData.age) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          primary_food_brand: formData.primary_food_brand || null,
          profile_picture_url
        })
        .match({ id: currentDog.id })

      if (error) throw error
      
      alert('Profile updated successfully! Refreshing session...')
      
      // Force a full reload to make context refetch the fresh profile image and data
      window.location.href = '/feed'
    } catch (error: unknown) {
      console.error('Error updating dog:', error)
      alert(error instanceof Error ? error.message : 'Failed to update dog')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading || !currentDog) {
    return <div className="p-8 text-center text-gray-500">Loading profile...</div>
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 p-4 pb-20">
      <header className="mb-6 flex items-center justify-between">
         <Button variant="ghost" onClick={() => router.push('/feed')}>
            &larr; Back to Feed
         </Button>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-amber-600">Edit Profile</CardTitle>
              <CardDescription>Update {currentDog.name}&apos;s details</CardDescription>

              <div className="flex flex-col items-center mt-6">
                 <div 
                   className="w-24 h-24 rounded-full bg-amber-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden cursor-pointer relative group"
                   onClick={() => fileInputRef.current?.click()}
                 >
                    {previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">🐶</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                      <span className="text-white text-xs mt-1 font-medium">Upload</span>
                    </div>
                 </div>
                 <input 
                   type="file" 
                   accept="image/*" 
                   className="hidden" 
                   ref={fileInputRef} 
                   onChange={handleImageChange}
                 />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input 
                  id="name" 
                  name="name" 
                  required 
                  placeholder="e.g. Buster"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="breed">Breed</Label>
                <Input 
                  id="breed" 
                  name="breed" 
                  list="breeds-list"
                  placeholder="e.g. Golden Retriever"
                  value={formData.breed}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <datalist id="breeds-list">
                  <option value="Golden Retriever" />
                  <option value="Labrador Retriever" />
                  <option value="German Shepherd" />
                  <option value="French Bulldog" />
                  <option value="Bulldog" />
                  <option value="Poodle" />
                  <option value="Beagle" />
                  <option value="Rottweiler" />
                  <option value="Dachshund" />
                  <option value="Corgi" />
                  <option value="Mixed/Mutt" />
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age (Years)</Label>
                  <Input 
                    id="age" 
                    name="age" 
                    type="number" 
                    min="0"
                    step="0.1"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input 
                    id="weight" 
                    name="weight" 
                    type="number" 
                    min="0"
                    step="0.1"
                    value={formData.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_food_brand">Primary Food Brand</Label>
                <Input 
                  id="primary_food_brand" 
                  name="primary_food_brand" 
                  list="foods-list"
                  placeholder="e.g. Purina Pro Plan"
                  value={formData.primary_food_brand}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <datalist id="foods-list">
                  <option value="Purina Pro Plan" />
                  <option value="Hill's Science Diet" />
                  <option value="Royal Canin" />
                  <option value="Blue Buffalo" />
                  <option value="IAMS" />
                  <option value="Pedigree" />
                  <option value="Orijen" />
                  <option value="Acana" />
                  <option value="Taste of the Wild" />
                  <option value="The Farmer's Dog" />
                </datalist>
              </div>

            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t pt-4">
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={loading || !formData.name}
              >
                {loading ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}
