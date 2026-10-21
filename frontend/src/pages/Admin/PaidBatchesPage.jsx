import { useEffect, useState } from 'react'
import AdminLayout from '../../layouts/AdminLayout'
import { Link } from 'react-router-dom'
import {
  getAllPaidBatchesAdmin, createPaidBatch, updatePaidBatch, togglePublishBatch,
} from '../../services/paidBatchApi'
import { deletePaidBatch } from '../../services/paidBatchApi'

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`

const PaidBatchesPage = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [discountedPrice, setDiscountedPrice] = useState('')
  const [thumbnail, setThumbnail] = useState(null)
  const [thumbnailPreview, setThumbnailPreview] = useState('')

  const fetchAll = async () => {
    try {
      const res = await getAllPaidBatchesAdmin()
      setBatches(res.data.data)
    } catch {
      setError('Failed to load batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const resetForm = () => {
    setTitle(''); setPrice(''); setDiscountedPrice(''); setThumbnail(null); setThumbnailPreview('')
    setEditingId(null); setShowForm(false)
  }

  const startEdit = (batch) => {
    setEditingId(batch._id)
    setTitle(batch.title)
    setPrice(batch.price)
    setDiscountedPrice(batch.discountedPrice || '')
    setThumbnailPreview(batch.thumbnailUrl)
    setThumbnail(null)
    setShowForm(true)
  }

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setThumbnail(file)
    setThumbnailPreview(URL.createObjectURL(file))
  }

  const handleDeleteBatch = async (batchId, title) => {
  if (!window.confirm(`Delete "${title}"? This permanently removes its thumbnail, lectures, and notes. This cannot be undone.`)) return
  try {
    await deletePaidBatch(batchId)
    fetchAll()
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to delete batch')
  }
}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('price', price)
      if (discountedPrice) formData.append('discountedPrice', discountedPrice)
      if (thumbnail) formData.append('thumbnail', thumbnail)

      if (editingId) {
        await updatePaidBatch(editingId, formData)
      } else {
        if (!thumbnail) {
          setError('Thumbnail image is required')
          setSubmitting(false)
          return
        }
        await createPaidBatch(formData)
      }
      resetForm()
      fetchAll()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save batch')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTogglePublish = async (id) => {
    try {
      await togglePublishBatch(id)
      fetchAll()
    } catch {
      setError('Failed to update publish status')
    }
  }

  return (
    <AdminLayout>
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-blue-900">Paid Batches</h1>
            <p className="text-slate-500 text-sm mt-1">{batches.length} batches created</p>
          </div>
          <button
            onClick={() => { showForm ? resetForm() : setShowForm(true); setError('') }}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Create batch'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white border border-blue-100 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="font-semibold text-blue-900 mb-4">{editingId ? 'Edit batch' : 'Create new batch'}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Batch title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Class 10th Crash Course"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Price (₹)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. 4999"
                  required
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Discounted price (optional)</label>
                <input
                  type="number"
                  value={discountedPrice}
                  onChange={(e) => setDiscountedPrice(e.target.value)}
                  placeholder="e.g. 3999"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Thumbnail image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="text-sm"
                />
              </div>

              {thumbnailPreview && (
                <div className="md:col-span-2">
                  <img src={thumbnailPreview} alt="preview" className="w-40 h-24 object-cover rounded-lg border border-slate-200" />
                </div>
              )}

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Save changes' : 'Create batch'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <p className="text-slate-400 text-sm">Loading batches...</p>
        ) : batches.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg">No batches yet — click "Create batch" to add your first one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((batch) => (
              <div key={batch._id} className="bg-white border border-blue-100 rounded-xl overflow-hidden shadow-sm">
                <img src={batch.thumbnailUrl} alt={batch.title} className="w-full h-36 object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-blue-900">{batch.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                      batch.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {batch.isPublished ? 'Live' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-sm mb-3">
                    {batch.discountedPrice ? (
                      <>
                        <span className="text-orange-600 font-bold">{fmt(batch.discountedPrice)}</span>
                        <span className="text-slate-400 line-through ml-2 text-xs">{fmt(batch.price)}</span>
                      </>
                    ) : (
                      <span className="text-orange-600 font-bold">{fmt(batch.price)}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(batch)} className="flex-1 text-xs bg-blue-50 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                        Edit basics
                    </button>
                    <Link to={`/admin/paid-batches/${batch._id}/edit`} className="flex-1 text-xs bg-orange-50 text-orange-700 py-2 rounded-lg font-medium hover:bg-orange-100 transition-colors text-center">
                        Edit details
                    </Link>
                    <button onClick={() => handleTogglePublish(batch._id)} className={`flex-1 text-xs py-2 rounded-lg font-medium transition-colors ${
                        batch.isPublished ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}>
                        {batch.isPublished ? 'Unpublish' : 'Publish'}
                    </button>
                    </div>
                    <button
                      onClick={() => handleDeleteBatch(batch._id, batch.title)}
                      className="w-full text-xs text-red-400 hover:text-red-600 transition-colors mt-2"
                    >
                      Delete batch
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default PaidBatchesPage