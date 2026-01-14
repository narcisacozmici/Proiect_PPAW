import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'
import './App.css'
import ConversionsHistory from './components/ConversionsHistory'
import Login from './components/Login'
import PDFToWordConverter from './components/PDFToWordConverter'
import Plans from './components/Plans'
import Sidebar from './components/Sidebar'

type Page = 'home' | 'plans' | 'conversions'

function App() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [currentPage, setCurrentPage] = useState<Page>('home')

  // Sincronizează utilizatorul cu baza de date când se autentifică
  useEffect(() => {
    if (isSignedIn && user) {
      syncUserToDatabase(user)
    }
  }, [isSignedIn, user])

  // Ascultă evenimente de navigare din Sidebar
  useEffect(() => {
    const handleNavigate = (event: CustomEvent<Page>) => {
      setCurrentPage(event.detail)
    }

    window.addEventListener('navigate', handleNavigate as EventListener)
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener)
    }
  }, [])

  const syncUserToDatabase = async (userData: any) => {
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: userData.id,
          email: userData.emailAddresses[0]?.emailAddress || '',
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          imageUrl: userData.imageUrl || null,
        }),
      })

      if (response.ok) {
        console.log('✅ Utilizator sincronizat cu baza de date')
      } else {
        console.warn('⚠️ Nu s-a putut sincroniza utilizatorul:', await response.text())
      }
    } catch (error) {
      console.error('❌ Eroare la sincronizarea utilizatorului:', error)
    }
  }

  // Show loading state while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Se încarcă...</div>
      </div>
    )
  }

  // Show login page if user is not signed in
  if (!isSignedIn) {
    return <Login />
  }

  // Show main app content with sidebar if user is signed in
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentPage === 'home' ? (
          <div className="container mx-auto px-6 py-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bun venit, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
              </h1>
              <p className="text-gray-600">Te-ai autentificat cu succes.</p>
            </div>

            {/* PDF to Word Converter */}
            <PDFToWordConverter userId={user?.id || null} />
          </div>
        ) : currentPage === 'plans' ? (
          <Plans />
        ) : (
          <ConversionsHistory />
        )}
      </main>
    </div>
  )
}

export default App
