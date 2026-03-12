'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function RegisterPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    age: '',
    weight: '',
    primary_food_brand: ''
  })
  
  const { loginDog } = useDogAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('dogs')
        .insert([
          {
            name: formData.name,
            breed: formData.breed || null,
            age: formData.age ? parseInt(formData.age) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            primary_food_brand: formData.primary_food_brand || null
          }
        ])
        .select()
        .single()

      if (error) throw error
      
      if (data) {
        await loginDog(data.id)
        router.push('/feed')
      }
    } catch (error: unknown) {
      console.error('Error registering dog:', error)
      alert(error instanceof Error ? error.message : 'Failed to register dog')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-amber-600">Join the Pack</CardTitle>
            <CardDescription>Register your dog to start logging</CardDescription>
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
                placeholder="e.g. Golden Retriever"
                value={formData.breed}
                onChange={handleChange}
              />
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
                placeholder="e.g. Purina Pro Plan"
                value={formData.primary_food_brand}
                onChange={handleChange}
              />
            </div>

          </CardContent>
          <CardFooter className="flex flex-col gap-4 border-t pt-4">
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              disabled={loading || !formData.name}
            >
              {loading ? 'Registering...' : 'Register Dog'}
            </Button>
            <Button 
              type="button"
              variant="link" 
              className="text-gray-500 w-full"
              onClick={() => router.push('/login')}
            >
              Back to Login
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
