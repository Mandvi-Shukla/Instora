import { useState } from 'react'
import { changeMyPaidPassword } from '../services/paidUserApi'
import { useAuth } from '../context/AuthContext'

const ForcedPasswordChangeModal = () => {
  const { updateUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setSubmitting(true)
    try {
      await changeMyPaidPassword({ newPassword })
      updateUser({ mustChangePassword: false })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-blue-950/80 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
        <h2 className="font-bold text-blue-900 text-lg mb-1">Set your password</h2>
        <p className="text-slate-500 text-sm mb-5">For security, please set a new password before continuing.</p>
        {error && <p className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            {submitting ? 'Saving...' : 'Set password & continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ForcedPasswordChangeModal