'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const DealershipContext = createContext({})

export function DealershipProvider({ children }) {
  const [user, setUser] = useState(null)
  const [dealership, setDealership] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          setUser(authUser)
          
          // Obtener info del usuario y su dealership
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select(`
              *,
              dealerships (
                id,
                slug,
                name,
                email,
                phone,
                address,
                is_active
              )
            `)
            .eq('id', authUser.id)
            .single()

          if (userData && !userError) {
            setDealership(userData.dealerships)
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUserData()
      } else {
        setUser(null)
        setDealership(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setDealership(null)
  }

  return (
    <DealershipContext.Provider
      value={{
        user,
        dealership,
        loading,
        signOut,
      }}
    >
      {children}
    </DealershipContext.Provider>
  )
}

export const useDealership = () => {
  const context = useContext(DealershipContext)
  if (context === undefined) {
    throw new Error('useDealership must be used within a DealershipProvider')
  }
  return context
}
