'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Dog } from '@/types/database'
import { supabase } from '@/lib/supabase'

interface DogAuthContextType {
  currentDog: Dog | null
  loginDog: (dogId: string) => Promise<void>
  logoutDog: () => void
  isLoading: boolean
}

const DogAuthContext = createContext<DogAuthContextType | undefined>(undefined)

export function DogAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentDog, setCurrentDog] = useState<Dog | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check local storage for an existing session mockup
    const storedDogId = localStorage.getItem('poopals_dog_id')
    if (storedDogId) {
      loginDog(storedDogId)
    } else {
      setIsLoading(false)
    }
  }, [])

  const loginDog = async (dogId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('id', dogId)
        .single()
      
      if (error) throw error
      if (data) {
        setCurrentDog(data)
        localStorage.setItem('poopals_dog_id', data.id)
      }
    } catch (err) {
      console.error('Error logging in dog', err)
      localStorage.removeItem('poopals_dog_id')
    } finally {
      setIsLoading(false)
    }
  }

  const logoutDog = () => {
    setCurrentDog(null)
    localStorage.removeItem('poopals_dog_id')
  }

  return (
    <DogAuthContext.Provider value={{ currentDog, loginDog, logoutDog, isLoading }}>
      {children}
    </DogAuthContext.Provider>
  )
}

export function useDogAuth() {
  const context = useContext(DogAuthContext)
  if (context === undefined) {
    throw new Error('useDogAuth must be used within a DogAuthProvider')
  }
  return context
}
