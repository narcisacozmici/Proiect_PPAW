import { useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'

interface Plan {
  id: number
  name: string
  display_name: string
  max_conversions: number | null
  price: number
  features: string[]
}

interface UserPlan {
  plan_id: number
  conversions_used: number
  conversions_reset_at: string
}

function Plans() {
  const { user } = useUser()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<number | null>(null)
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPlans()
    if (user?.id) {
      loadUserPlan()
    }
  }, [user?.id])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.data)
      }
    } catch (error) {
      console.error('Eroare la încărcarea planurilor:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPlan = async () => {
    if (!user?.id) return

    try {
      const response = await fetch(`/api/users/${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data) {
          setUserPlan({
            plan_id: data.data.plan_id || 1,
            conversions_used: data.data.conversions_used || 0,
            conversions_reset_at: data.data.conversions_reset_at,
          })
        }
      }
    } catch (error) {
      console.error('Eroare la încărcarea planului utilizatorului:', error)
    }
  }

  const handleUpgrade = async (planId: number) => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Trebuie să fii autentificat pentru a upgrada planul' })
      return
    }

    setUpgrading(planId)

    try {
      // Simulare plată - în producție ar trebui să integrezi un gateway de plată real
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulare delay plată

      const response = await fetch('/api/plans/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessage({ type: 'success', text: data.message || 'Plan actualizat cu succes!' })
        await loadUserPlan() // Reîncarcă planul utilizatorului
      } else {
        const errorData = await response.json()
        setMessage({ type: 'error', text: errorData.message || 'Eroare la actualizarea planului' })
      }
    } catch (error) {
      console.error('Eroare la upgrade:', error)
      setMessage({ type: 'error', text: 'Eroare la actualizarea planului' })
    } finally {
      setUpgrading(null)
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const getCurrentPlan = () => {
    if (!userPlan) return null
    return plans.find((p) => p.id === userPlan.plan_id)
  }

  const getRemainingConversions = () => {
    if (!userPlan) return null
    const currentPlan = getCurrentPlan()
    if (!currentPlan) return null

    if (currentPlan.max_conversions === null) {
      return 'Nelimitat'
    }

    return Math.max(0, currentPlan.max_conversions - userPlan.conversions_used)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Se încarcă planurile...</div>
      </div>
    )
  }

  const currentPlan = getCurrentPlan()

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alege Planul Tău</h1>
        <p className="text-gray-600">Selectează planul care se potrivește cel mai bine nevoilor tale</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {userPlan && currentPlan && (
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Planul Tău Curent</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium text-gray-900">{currentPlan.display_name}</p>
              <p className="text-sm text-gray-600 mt-1">
                Conversii folosite: {userPlan.conversions_used} /{' '}
                {currentPlan.max_conversions === null ? '∞' : currentPlan.max_conversions}
              </p>
              <p className="text-sm text-gray-600">
                Rămase: {getRemainingConversions()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {currentPlan.price === 0 ? 'Gratuit' : `$${currentPlan.price}/lună`}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan?.id === plan.id
          const isUpgrading = upgrading === plan.id

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg border-2 p-6 ${
                isCurrentPlan
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : plan.name === 'premium'
                  ? 'border-purple-500'
                  : 'border-gray-200'
              }`}
            >
              {isCurrentPlan && (
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                    Planul Tău Curent
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.display_name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price === 0 ? 'Gratuit' : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-gray-600 ml-2">/lună</span>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <span className="text-lg font-semibold text-gray-700">
                    {plan.max_conversions === null
                      ? 'Conversii nelimitate'
                      : `${plan.max_conversions} conversii/lună`}
                  </span>
                </div>
                <ul className="space-y-2 mt-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrentPlan || isUpgrading}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                  isCurrentPlan
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : plan.name === 'premium'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : plan.name === 'pro'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-white'
                }`}
              >
                {isUpgrading
                  ? 'Se procesează...'
                  : isCurrentPlan
                  ? 'Plan Curent'
                  : plan.price === 0
                  ? 'Selectează Plan'
                  : 'Upgrade Acum'}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Notă:</strong> Pentru testare, plata este simulată. În producție, ar trebui să
          integrezi un gateway de plată real (Stripe, PayPal, etc.).
        </p>
      </div>
    </div>
  )
}

export default Plans
