'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Dog } from '@/types/database'
import { useDogAuth } from '@/contexts/DogAuthContext'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function LoginPage() {
  const [dogs, setDogs] = useState<Dog[]>([])
  const [loading, setLoading] = useState(true)
  const { loginDog, currentDog } = useDogAuth()
  const router = useRouter()

  useEffect(() => {
    if (currentDog) {
      router.push('/feed') // Redirect if already logged in
    } else {
      fetchDogs()
    }
  }, [currentDog, router])

  const fetchDogs = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setDogs(data || [])
    } catch (error) {
      console.error('Error fetching dogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (id: string) => {
    await loginDog(id)
    router.push('/feed')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-amber-600">PooPals</CardTitle>
          <CardDescription>Select your dog to log in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center text-sm text-gray-500">Sniffing around...</div>
          ) : dogs.length === 0 ? (
            <div className="text-center text-sm text-gray-500">No dogs found in the park yet.</div>
          ) : (
            <div className="grid gap-3">
              {dogs.map((dog) => (
                <Button 
                  key={dog.id} 
                  variant="outline" 
                  className="h-16 justify-start text-lg"
                  onClick={() => handleLogin(dog.id)}
                >
                  <span className="text-2xl mr-3">🐶</span>
                  <div>
                    <div className="font-semibold">{dog.name}</div>
                    <div className="text-xs text-gray-500 font-normal">{dog.breed || 'Unknown breed'}</div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t pt-4">
          <p className="text-sm text-gray-500 text-center w-full">New to the pack?</p>
          <Button 
            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => router.push('/register')}
          >
            Register a New Dog
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
