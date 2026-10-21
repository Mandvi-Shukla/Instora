import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getMyPaidProfile, changeMyPaidPassword } from '../../services/paidUserApi'
import PaidUserLayout from '../../layouts/PaidUserLayout'

const PaidUserProfilePage = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getMyPaidProfile().then(res => setProfile(res.data.data)).finally(() => setLoading(false))
  }, [])

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setMessage(null)
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters' })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    setSubmitting(true)
    try {
      await changeMyPaidPassword({ currentPassword, newPassword })
      setMessage({ type: 'success', text: 'Password updated successfully' })
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PaidUserLayout>
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-blue-900 mb-6">Profile</h1>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : (
          <>
            <div className="bg-white border border-blue-100 rounded-xl p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-lg">
                  {profile?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-blue-900">{profile?.fullName}</p>
                  <p className="text-sm text-slate-500">{profile?.email}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400">{profile?.purchasedBatches?.length || 0} batch(es) purchased</p>
            </div>

            <div className="bg-white border border-blue-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-blue-900 mb-4">Change password</h2>
              {message && (
                <p className={`text-sm px-3 py-2 rounded-lg mb-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {message.text}
                </p>
              )}
              <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
                <input
                  type="password" placeholder="Current password" value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="password" required placeholder="New password" value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="password" required placeholder="Confirm new password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button type="submit" disabled={submitting}
                  className="bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 mt-1">
                  {submitting ? 'Saving...' : 'Update password'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </PaidUserLayout>
  )
}

export default PaidUserProfilePage