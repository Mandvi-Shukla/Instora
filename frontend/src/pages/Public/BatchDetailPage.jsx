import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPublicBatchById } from '../../services/publicApi'
import { createBatchOrder, verifyBatchPayment } from '../../services/publicApi'
import useRazorpay from '../../hooks/useRazorpay'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const BatchDetailPage = () => {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { openCheckout } = useRazorpay()
const [showBuyModal, setShowBuyModal] = useState(false)
const [buyForm, setBuyForm] = useState({ fullName: '', email: '' })
const [buying, setBuying] = useState(false)
const [buyMessage, setBuyMessage] = useState(null)

const handleBuySubmit = async (e) => {
  e.preventDefault()
  setBuying(true)
  setBuyMessage(null)
  try {
    const orderRes = await createBatchOrder({ batchId: id, ...buyForm })
    const { orderId, amount, keyId, batchTitle, fullName, email } = orderRes.data.data
    openCheckout({
      orderId, amount, keyId, studentName: fullName, period: batchTitle,
      onSuccess: async (response) => {
        try {
          await verifyBatchPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          setBuyMessage({ type: 'success', text: `Payment successful! Login details sent to ${email}.` })
        } catch {
          setBuyMessage({ type: 'error', text: 'Payment succeeded but verification failed. Contact support.' })
        } finally {
          setBuying(false)
        }
      },
      onFailure: (msg) => {
        if (msg !== 'Payment cancelled') setBuyMessage({ type: 'error', text: msg })
        setBuying(false)
      },
    })
  } catch (err) {
    setBuyMessage({ type: 'error', text: err.response?.data?.message || 'Failed to start payment' })
    setBuying(false)
  }
}

  useEffect(() => {
    getPublicBatchById(id)
      .then(res => setBatch(res.data.data))
      .catch(() => setError('This batch is not available.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="max-w-4xl mx-auto px-6 py-20 text-center text-slate-400">Loading...</div>
  if (error || !batch) return <div className="max-w-4xl mx-auto px-6 py-20 text-center text-red-500">{error || 'Batch not found'}</div>

  return (
    <div className="font-sans text-slate-800">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center blur-sm scale-110" style={{ backgroundImage: `url(${batch.thumbnailUrl})` }} />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/95 via-blue-900/90 to-orange-700/80" />
        <div className="relative max-w-5xl mx-auto px-6 py-14 sm:py-20 flex flex-col md:flex-row gap-8 items-center">
          <img src={batch.thumbnailUrl} alt={batch.title} className="w-full md:w-72 h-44 object-cover rounded-2xl shadow-xl border-2 border-white/20" />
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">{batch.title}</h1>
            {batch.shortDescription && (
              <p className="text-blue-100 text-sm sm:text-base mb-4 max-w-xl">{batch.shortDescription}</p>
            )}
            <div className="flex items-center gap-3 justify-center md:justify-start">
              {batch.discountedPrice ? (
                <>
                  <span className="text-orange-400 font-extrabold text-3xl">{fmt(batch.discountedPrice)}</span>
                  <span className="text-blue-200 line-through text-lg">{fmt(batch.price)}</span>
                </>
              ) : (
                <span className="text-orange-400 font-extrabold text-3xl">{fmt(batch.price)}</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: details */}
        <div className="lg:col-span-2 flex flex-col gap-10">
          {batch.description && (
            <section>
              <h2 className="text-xl font-bold text-blue-900 mb-3">About this batch</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{batch.description}</p>
            </section>
          )}

          {batch.syllabus?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-blue-900 mb-4">Syllabus</h2>
              <div className="flex flex-col gap-3">
                {batch.syllabus.map((s, i) => (
                  <div key={i} className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-900 text-sm">{s.topic}</h3>
                    {s.description && <p className="text-slate-600 text-sm mt-1">{s.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {batch.curriculumPreview?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-blue-900 mb-4">Curriculum</h2>
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                {batch.curriculumPreview.map((c, i) => (
                  <div key={i} className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-blue-50/40'}`}>
                    <span className="text-slate-700">{i + 1}. {c.title}</span>
                    <span className="text-slate-400 text-xs">{c.durationMinutes} min</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {batch.faqs?.length > 0 && (
            <section>
              <h2 className="text-xl font-bold text-blue-900 mb-4">Frequently asked questions</h2>
              <div className="flex flex-col gap-3">
                {batch.faqs.map((f, i) => (
                  <details key={i} className="bg-white border border-slate-200 rounded-xl p-4 group">
                    <summary className="font-medium text-blue-900 text-sm cursor-pointer">{f.question}</summary>
                    <p className="text-slate-600 text-sm mt-2">{f.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: sticky buy card */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4">
              {batch.discountedPrice ? (
                <>
                  <span className="text-orange-600 font-extrabold text-2xl">{fmt(batch.discountedPrice)}</span>
                  <span className="text-slate-400 line-through text-sm">{fmt(batch.price)}</span>
                </>
              ) : (
                <span className="text-orange-600 font-extrabold text-2xl">{fmt(batch.price)}</span>
              )}
            </div>

            <div className="flex flex-col gap-2 text-sm text-slate-600 mb-5">
              {batch.stats?.totalLectures > 0 && <p>📹 {batch.stats.totalLectures} lectures</p>}
              {batch.stats?.totalDurationHours > 0 && <p>⏱ {batch.stats.totalDurationHours} hours of content</p>}
              {batch.stats?.videosPerDay > 0 && <p>📅 {batch.stats.videosPerDay} videos/day</p>}
              {batch.stats?.validityMonths > 0 && <p>🔓 {batch.stats.validityMonths} months access</p>}
            </div>

            <button
                onClick={() => setShowBuyModal(true)}
                className="w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                >
                Buy Batch
            </button>
            <p className="text-xs text-slate-400 text-center mt-2">Online purchases open soon</p>
          </div>
        </div>

        {showBuyModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
      <h2 className="font-bold text-blue-900 text-lg mb-1">Buy {batch.title}</h2>
      <p className="text-slate-500 text-sm mb-4">Enter your details — login access will be sent to this email.</p>
      {buyMessage && (
        <p className={`text-sm px-3 py-2 rounded-lg mb-3 ${buyMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {buyMessage.text}
        </p>
      )}
      {buyMessage?.type !== 'success' && (
        <form onSubmit={handleBuySubmit} className="flex flex-col gap-3">
          <input type="text" required placeholder="Full name" value={buyForm.fullName}
            onChange={(e) => setBuyForm({ ...buyForm, fullName: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <input type="email" required placeholder="Official email address" value={buyForm.email}
            onChange={(e) => setBuyForm({ ...buyForm, email: e.target.value })}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          <button type="submit" disabled={buying}
            className="bg-orange-500 text-white py-2.5 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50">
            {buying ? 'Processing...' : 'Proceed to pay'}
          </button>
        </form>
      )}
      <button onClick={() => { setShowBuyModal(false); setBuyMessage(null) }} className="text-xs text-slate-400 hover:text-slate-600 mt-3">
        Close
      </button>
    </div>
  </div>
)}
      </div>
    </div>
  )
}

export default BatchDetailPage