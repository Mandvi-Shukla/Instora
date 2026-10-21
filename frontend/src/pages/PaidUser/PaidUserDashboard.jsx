import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getMyPaidProfile } from '../../services/paidUserApi'
import PaidUserLayout from '../../layouts/PaidUserLayout'
import ForcedPasswordChangeModal from '../../components/ForcedPasswordChangeModal'
import { getMyProgressSummary } from '../../services/paidLearnerApi'

const PaidUserDashboard = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [progressSummary, setProgressSummary] = useState({})

  useEffect(() => {
    getMyProgressSummary()
      .then(res => setProgressSummary(res.data.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    getMyPaidProfile()
      .then(res => setProfile(res.data.data))
      .catch(() => setError('Failed to load your batches'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <PaidUserLayout>
      {user?.mustChangePassword && <ForcedPasswordChangeModal />}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">My Batches</h1>
        <p className="text-slate-500 text-sm mb-8">Welcome back, {profile?.fullName || user?.username}</p>

        {error && <p className="text-red-500 text-sm mb-6">{error}</p>}

        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : !profile?.purchasedBatches?.length ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No batches purchased yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profile.purchasedBatches.map((batch) => {
              // Extract progress metrics or fall back to 0 if not loaded yet
              const prog = progressSummary[batch._id] || { percent: 0, total: 0, completed: 0 }
              
              return (
                <Link
                  key={batch._id}
                  to={`/paiduser/batches/${batch._id}`}
                  className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <img src={batch.thumbnailUrl} alt={batch.title} className="w-full h-36 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-blue-900 mb-2">{batch.title}</h3>
                    
                    {/* Dynamic Progress Bar */}
                    <div className="w-full bg-blue-50 rounded-full h-1.5 mb-1.5">
                      <div 
                        className="h-1.5 rounded-full bg-emerald-500 transition-all duration-300" 
                        style={{ width: `${prog.percent}%` }} 
                      />
                    </div>
                    
                    {/* Dynamic Text Information */}
                    <p className="text-xs text-slate-400">
                      {prog.percent}% complete · {prog.total} lecture{prog.total !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </PaidUserLayout>
  )
}

export default PaidUserDashboard