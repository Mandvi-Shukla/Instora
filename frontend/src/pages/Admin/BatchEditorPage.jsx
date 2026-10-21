import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import AdminLayout from '../../layouts/AdminLayout'
import {
  getAdminBatchById, updateBatchOverview, updateBatchCurriculum, updateBatchFaqs,
} from '../../services/paidBatchApi'
import { getLecturesAdmin, getLectureUploadUrl, createLecture, deleteLecture } from '../../services/lectureApi'
import { getNotesAdmin, getNoteUploadUrl, createNote, deleteNote } from '../../services/lectureApi'

const TABS = ['Overview', 'Curriculum', 'Lectures', 'FAQs', 'Notes']

const BatchEditorPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [batch, setBatch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  const [lectures, setLectures] = useState([])
  const [lectureTitle, setLectureTitle] = useState('')
  const [lectureDuration, setLectureDuration] = useState('')
  const [lectureFile, setLectureFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const [notes, setNotes] = useState([])
const [noteTitle, setNoteTitle] = useState('')
const [noteFile, setNoteFile] = useState(null)
const [noteUploading, setNoteUploading] = useState(false)

  // Overview tab state
  const [shortDescription, setShortDescription] = useState('')
  const [description, setDescription] = useState('')
  const [totalLectures, setTotalLectures] = useState(0)
  const [totalDurationHours, setTotalDurationHours] = useState(0)
  const [videosPerDay, setVideosPerDay] = useState(0)
  const [validityMonths, setValidityMonths] = useState(12)
  const [syllabus, setSyllabus] = useState([])

  // Curriculum tab state
  const [curriculumPreview, setCurriculumPreview] = useState([])

  // FAQs tab state
  const [faqs, setFaqs] = useState([])

  const fetchBatch = async () => {
  try {
    // Load batch details
    const res = await getAdminBatchById(id)
    const b = res.data.data
    setBatch(b)
    setShortDescription(b.shortDescription || '')
    setDescription(b.description || '')
    setTotalLectures(b.stats?.totalLectures || 0)
    setTotalDurationHours(b.stats?.totalDurationHours || 0)
    setVideosPerDay(b.stats?.videosPerDay || 0)
    setValidityMonths(b.stats?.validityMonths || 12)
    setSyllabus(b.syllabus?.length ? b.syllabus : [{ topic: '', description: '' }])
    setCurriculumPreview(b.curriculumPreview?.length ? b.curriculumPreview : [{ title: '', durationMinutes: '' }])
    setFaqs(b.faqs?.length ? b.faqs : [{ question: '', answer: '' }])

    // --- HOOKED IN: Load lectures right here at the same time ---
    const lecturesRes = await getLecturesAdmin(id)
    setLectures(lecturesRes.data.data)
    // ------------------------------------------------------------

  } catch {
    setMessage({ type: 'error', text: 'Failed to load batch or lectures' })
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { fetchBatch() }, [id])

  const flash = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const saveOverview = async () => {
    setSaving(true)
    try {
      await updateBatchOverview(id, {
        shortDescription,
        description,
        stats: {
          totalLectures: Number(totalLectures),
          totalDurationHours: Number(totalDurationHours),
          videosPerDay: Number(videosPerDay),
          validityMonths: Number(validityMonths),
        },
        syllabus: syllabus.filter(s => s.topic.trim()),
      })
      flash('success', 'Overview saved')
    } catch {
      flash('error', 'Failed to save overview')
    } finally {
      setSaving(false)
    }
  }

  const handleLectureUpload = async (e) => {
  e.preventDefault()
  if (!lectureFile || !lectureTitle) {
    flash('error', 'Title and video file are required')
    return
  }
  setUploading(true)
  setUploadProgress(0)
  try {
    // Step 1: get presigned URL
    const urlRes = await getLectureUploadUrl(id, lectureFile.name, lectureFile.type)
    const { uploadUrl, key } = urlRes.data.data

    // Step 2: PUT directly to R2 with progress tracking (raw XHR needed for progress events — axios PUT works too but XHR gives upload progress easily)
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', lectureFile.type)
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      }
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed')))
      xhr.onerror = () => reject(new Error('Upload failed'))
      xhr.send(lectureFile)
    })

    // Step 3: confirm — create the Lecture record
    await createLecture(id, {
      title: lectureTitle,
      durationMinutes: Number(lectureDuration) || 0,
      videoKey: key,
      order: lectures.length + 1,
    })

    flash('success', 'Lecture uploaded successfully')
    setLectureTitle(''); setLectureDuration(''); setLectureFile(null); setUploadProgress(0)
    fetchLectures()
  } catch {
    flash('error', 'Upload failed — please try again')
  } finally {
    setUploading(false)
  }
}

const handleDeleteLecture = async (lectureId) => {
  if (!window.confirm('Delete this lecture? Students will lose access to it immediately.')) return
  try {
    await deleteLecture(lectureId)
    fetchLectures()
  } catch {
    flash('error', 'Failed to delete lecture')
  }
}

const fetchNotes = async () => {
  try {
    const res = await getNotesAdmin(id)
    setNotes(res.data.data)
  } catch {
    flash('error', 'Failed to load notes')
  }
}

useEffect(() => {
  if (activeTab === 'Notes') fetchNotes()
}, [activeTab])

const handleNoteUpload = async (e) => {
  e.preventDefault()
  if (!noteFile || !noteTitle) {
    flash('error', 'Title and file are required')
    return
  }
  setNoteUploading(true)
  try {
    const urlRes = await getNoteUploadUrl(id, noteFile.name, noteFile.type)
    const { uploadUrl, key } = urlRes.data.data

    await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': noteFile.type }, body: noteFile })

    await createNote(id, { title: noteTitle, fileKey: key, fileType: noteFile.type })
    flash('success', 'Note uploaded')
    setNoteTitle(''); setNoteFile(null)
    fetchNotes()
  } catch {
    flash('error', 'Upload failed')
  } finally {
    setNoteUploading(false)
  }
}

const handleDeleteNote = async (noteId) => {
  if (!window.confirm('Delete this note?')) return
  try {
    await deleteNote(noteId)
    fetchNotes()
  } catch {
    flash('error', 'Failed to delete note')
  }
}

  const saveCurriculum = async () => {
    setSaving(true)
    try {
      await updateBatchCurriculum(id, curriculumPreview
        .filter(c => c.title.trim())
        .map(c => ({ title: c.title, durationMinutes: Number(c.durationMinutes) || 0 })))
      flash('success', 'Curriculum saved')
    } catch {
      flash('error', 'Failed to save curriculum')
    } finally {
      setSaving(false)
    }
  }

  const saveFaqs = async () => {
    setSaving(true)
    try {
      await updateBatchFaqs(id, faqs.filter(f => f.question.trim()))
      flash('success', 'FAQs saved')
    } catch {
      flash('error', 'Failed to save FAQs')
    } finally {
      setSaving(false)
    }
  }

  // Generic row helpers for repeatable add/remove lists
  const updateRow = (list, setList, index, field, value) => {
    const copy = [...list]
    copy[index] = { ...copy[index], [field]: value }
    setList(copy)
  }
  const addRow = (list, setList, emptyRow) => setList([...list, emptyRow])
  const removeRow = (list, setList, index) => setList(list.filter((_, i) => i !== index))

  if (loading) return (
    <AdminLayout><div className="p-8 text-slate-400">Loading batch...</div></AdminLayout>
  )
  if (!batch) return (
    <AdminLayout><div className="p-8 text-red-500">Batch not found</div></AdminLayout>
  )

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-4xl">
        <button onClick={() => navigate('/admin/paid-batches')} className="text-sm text-blue-500 hover:text-blue-700 mb-4">
          ← Back to Paid Batches
        </button>

        <div className="flex items-center gap-4 mb-6">
          <img src={batch.thumbnailUrl} alt={batch.title} className="w-20 h-14 object-cover rounded-lg border border-blue-100" />
          <div>
            <h1 className="text-xl font-bold text-blue-900">{batch.title}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              batch.isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {batch.isPublished ? 'Live' : 'Draft'}
            </span>
          </div>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-blue-100 mb-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-blue-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Short description (shown on landing page card)</label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="e.g. Complete Class 10th syllabus with daily live-recorded lectures"
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-slate-700">Full description (shown on detail page)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe what this batch covers, who it's for, teaching approach..."
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Batch stats</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Total lectures</label>
                  <input type="number" value={totalLectures} onChange={(e) => setTotalLectures(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Total hours</label>
                  <input type="number" value={totalDurationHours} onChange={(e) => setTotalDurationHours(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Videos/day</label>
                  <input type="number" value={videosPerDay} onChange={(e) => setVideosPerDay(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-slate-500">Validity (months)</label>
                  <input type="number" value={validityMonths} onChange={(e) => setValidityMonths(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Syllabus</label>
              <div className="flex flex-col gap-3">
                {syllabus.map((row, i) => (
                  <div key={i} className="flex gap-2 items-start bg-blue-50/40 p-3 rounded-lg">
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        type="text"
                        value={row.topic}
                        onChange={(e) => updateRow(syllabus, setSyllabus, i, 'topic', e.target.value)}
                        placeholder="Topic (e.g. Mechanics)"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateRow(syllabus, setSyllabus, i, 'description', e.target.value)}
                        placeholder="Short description of this topic"
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <button onClick={() => removeRow(syllabus, setSyllabus, i)} className="text-red-400 hover:text-red-600 text-sm px-2 py-2">✕</button>
                  </div>
                ))}
                <button
                  onClick={() => addRow(syllabus, setSyllabus, { topic: '', description: '' })}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium self-start"
                >
                  + Add topic
                </button>
              </div>
            </div>

            <button
              onClick={saveOverview}
              disabled={saving}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 self-start"
            >
              {saving ? 'Saving...' : 'Save overview'}
            </button>
          </div>
        )}

        {/* CURRICULUM TAB */}
        {activeTab === 'Curriculum' && (
          <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            <p className="text-sm text-slate-500">
              A preview list of lectures buyers will see. Actual video upload happens later once this batch has paying students.
            </p>
            {curriculumPreview.map((row, i) => (
              <div key={i} className="flex gap-2 items-center bg-blue-50/40 p-3 rounded-lg">
                <span className="text-xs text-slate-400 w-6">{i + 1}.</span>
                <input
                  type="text"
                  value={row.title}
                  onChange={(e) => updateRow(curriculumPreview, setCurriculumPreview, i, 'title', e.target.value)}
                  placeholder="Lecture title"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <input
                  type="number"
                  value={row.durationMinutes}
                  onChange={(e) => updateRow(curriculumPreview, setCurriculumPreview, i, 'durationMinutes', e.target.value)}
                  placeholder="Mins"
                  className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button onClick={() => removeRow(curriculumPreview, setCurriculumPreview, i)} className="text-red-400 hover:text-red-600 text-sm px-2">✕</button>
              </div>
            ))}
            <button
              onClick={() => addRow(curriculumPreview, setCurriculumPreview, { title: '', durationMinutes: '' })}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium self-start"
            >
              + Add lecture
            </button>
            <button
              onClick={saveCurriculum}
              disabled={saving}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 self-start mt-2"
            >
              {saving ? 'Saving...' : 'Save curriculum'}
            </button>
          </div>
        )}

        {/* FAQS TAB */}
        {activeTab === 'FAQs' && (
          <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col gap-4">
            {faqs.map((row, i) => (
              <div key={i} className="flex gap-2 items-start bg-blue-50/40 p-3 rounded-lg">
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    type="text"
                    value={row.question}
                    onChange={(e) => updateRow(faqs, setFaqs, i, 'question', e.target.value)}
                    placeholder="Question"
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <textarea
                    value={row.answer}
                    onChange={(e) => updateRow(faqs, setFaqs, i, 'answer', e.target.value)}
                    placeholder="Answer"
                    rows={2}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <button onClick={() => removeRow(faqs, setFaqs, i)} className="text-red-400 hover:text-red-600 text-sm px-2 py-2">✕</button>
              </div>
            ))}
            <button
              onClick={() => addRow(faqs, setFaqs, { question: '', answer: '' })}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium self-start"
            >
              + Add FAQ
            </button>
            <button
              onClick={saveFaqs}
              disabled={saving}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 self-start mt-2"
            >
              {saving ? 'Saving...' : 'Save FAQs'}
            </button>
          </div>
        )}

        {activeTab === 'Lectures' && (
  <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col gap-6">
    <div>
      <h3 className="font-semibold text-blue-900 mb-3">Upload new lecture</h3>
      <form onSubmit={handleLectureUpload} className="flex flex-col gap-3">
        <input
          type="text"
          value={lectureTitle}
          onChange={(e) => setLectureTitle(e.target.value)}
          placeholder="Lecture title"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="number"
          value={lectureDuration}
          onChange={(e) => setLectureDuration(e.target.value)}
          placeholder="Duration in minutes"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setLectureFile(e.target.files[0])}
          className="text-sm"
        />
        {uploading && (
          <div className="w-full bg-blue-50 rounded-full h-2">
            <div className="h-2 rounded-full bg-orange-500 transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}
        <button
          type="submit"
          disabled={uploading}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 self-start"
        >
          {uploading ? `Uploading... ${uploadProgress}%` : 'Upload lecture'}
        </button>
      </form>
    </div>

    <div>
      <h3 className="font-semibold text-blue-900 mb-3">Existing lectures ({lectures.length})</h3>
      {lectures.length === 0 ? (
        <p className="text-slate-400 text-sm">No lectures uploaded yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lectures.map((lec, i) => (
            <div key={lec._id} className="flex items-center justify-between bg-blue-50/40 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">{lec.title}</p>
                  <p className="text-xs text-slate-400">{lec.durationMinutes} min</p>
                </div>
              </div>
              <button onClick={() => handleDeleteLecture(lec._id)} className="text-xs text-red-400 hover:text-red-600">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

        {/* NOTES TAB — placeholder for phase 3 */}
        {activeTab === 'Notes' && (
  <div className="bg-white border border-blue-100 rounded-xl p-6 shadow-sm flex flex-col gap-6">
    <div>
      <h3 className="font-semibold text-blue-900 mb-3">Upload new note</h3>
      <form onSubmit={handleNoteUpload} className="flex flex-col gap-3">
        <input
          type="text"
          value={noteTitle}
          onChange={(e) => setNoteTitle(e.target.value)}
          placeholder="Note title"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setNoteFile(e.target.files[0])} className="text-sm" />
        <button type="submit" disabled={noteUploading}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 self-start">
          {noteUploading ? 'Uploading...' : 'Upload note'}
        </button>
      </form>
    </div>
    <div>
      <h3 className="font-semibold text-blue-900 mb-3">Existing notes ({notes.length})</h3>
      {notes.length === 0 ? (
        <p className="text-slate-400 text-sm">No notes uploaded yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {notes.map((note) => (
            <div key={note._id} className="flex items-center justify-between bg-blue-50/40 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium text-blue-900">{note.title}</p>
              <button onClick={() => handleDeleteNote(note._id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}
      </div>
    </AdminLayout>
  )
}

export default BatchEditorPage