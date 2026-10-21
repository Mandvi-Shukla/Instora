import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMyPaidProfile } from '../../services/paidUserApi'
import { getLecturesForLearner, getWatchUrl, updateProgress, getNotesForLearner } from '../../services/paidLearnerApi'
import PaidUserLayout from '../../layouts/PaidUserLayout'

const PaidBatchViewPage = () => {
  const { id } = useParams()
  const [batch, setBatch] = useState(null)
  const [lectures, setLectures] = useState([])
  const [percentComplete, setPercentComplete] = useState(0)
  const [notes, setNotes] = useState([])
  const [activeLecture, setActiveLecture] = useState(null)
  const [watchUrl, setWatchUrl] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('lectures')

  const videoRef = useRef(null)
  const progressIntervalRef = useRef(null)

  const fetchAll = async () => {
    try {
      const profileRes = await getMyPaidProfile()
      const found = profileRes.data.data.purchasedBatches.find(b => b._id === id)
      if (!found) { setError('You do not have access to this batch'); setLoading(false); return }
      setBatch(found)

      const [lecRes, noteRes] = await Promise.all([
        getLecturesForLearner(id),
        getNotesForLearner(id).catch(() => ({ data: { data: [] } })),
      ])
      setLectures(lecRes.data.data.lectures)
      setPercentComplete(lecRes.data.data.percentComplete)
      setNotes(noteRes.data.data)
    } catch {
      setError('Failed to load batch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  const openLecture = async (lecture) => {
    setActiveLecture(lecture)
    setVideoLoading(true)
    setWatchUrl('')
    try {
      const res = await getWatchUrl(lecture._id)
      setWatchUrl(res.data.data.watchUrl)
    } catch {
      setError('Failed to load video')
    } finally {
      setVideoLoading(false)
    }
  }

  // Periodically report watch progress while playing
  useEffect(() => {
    if (!activeLecture || !videoRef.current) return

    const reportProgress = () => {
      const video = videoRef.current
      if (!video || !video.duration) return
      updateProgress(activeLecture._id, video.currentTime, video.duration).catch(() => {})
    }

    progressIntervalRef.current = setInterval(reportProgress, 10000) // every 10s

    return () => {
      clearInterval(progressIntervalRef.current)
      reportProgress() // final report when switching away/unmounting
    }
  }, [activeLecture])

  const handleVideoEnded = async () => {
    if (!activeLecture || !videoRef.current) return
    await updateProgress(activeLecture._id, videoRef.current.duration, videoRef.current.duration).catch(() => {})
    fetchAll() // refresh completion state + percent
  }

  if (loading) return <PaidUserLayout><div className="p-8 text-slate-400">Loading...</div></PaidUserLayout>
  if (error) return <PaidUserLayout><div className="p-8 text-red-500">{error}</div></PaidUserLayout>

  return (
    <PaidUserLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <Link to="/paiduser/dashboard" className="text-sm text-blue-500 hover:text-blue-700 mb-4 inline-block">
          ← Back to My Batches
        </Link>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-xl font-bold text-blue-900">{batch.title}</h1>
          <div className="flex items-center gap-2">
            <div className="w-32 bg-blue-50 rounded-full h-2">
              <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${percentComplete}%` }} />
            </div>
            <span className="text-xs text-slate-500 font-medium">{percentComplete}% complete</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: video player */}
          <div className="lg:col-span-2">
            {activeLecture ? (
              <div className="bg-black rounded-xl overflow-hidden mb-4 aspect-video flex items-center justify-center">
                {videoLoading ? (
                  <p className="text-slate-400 text-sm">Loading video...</p>
                ) : (
                  <video
                    ref={videoRef}
                    src={watchUrl}
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    onEnded={handleVideoEnded}
                    className="w-full h-full"
                  />
                )}
              </div>
            ) : (
              <div className="bg-blue-50 rounded-xl aspect-video flex items-center justify-center mb-4">
                <p className="text-slate-400 text-sm">Select a lecture to start watching</p>
              </div>
            )}
            {activeLecture && (
              <h2 className="font-semibold text-blue-900">{activeLecture.title}</h2>
            )}
          </div>

          {/* Right: lecture list + notes tabs */}
          <div className="lg:col-span-1">
            <div className="flex gap-1 border-b border-blue-100 mb-3">
              <button onClick={() => setTab('lectures')}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === 'lectures' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>
                Lectures
              </button>
              <button onClick={() => setTab('notes')}
                className={`px-3 py-2 text-sm font-medium border-b-2 ${tab === 'notes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500'}`}>
                Notes
              </button>
            </div>

            {tab === 'lectures' && (
              <div className="flex flex-col gap-1.5 max-h-[500px] overflow-y-auto">
                {lectures.length === 0 ? (
                  <p className="text-slate-400 text-sm">No lectures uploaded yet — check back soon.</p>
                ) : (
                  lectures.map((lec, i) => (
                    <button
                      key={lec._id}
                      onClick={() => openLecture(lec)}
                      className={`flex items-center justify-between text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                        activeLecture?._id === lec._id ? 'bg-orange-50 text-orange-700' : 'bg-white border border-blue-100 hover:bg-blue-50 text-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {lec.isCompleted ? (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">✓</span>
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                        )}
                        <span>{i + 1}. {lec.title}</span>
                      </span>
                      <span className="text-xs text-slate-400 flex-shrink-0">{lec.durationMinutes}m</span>
                    </button>
                  ))
                )}
              </div>
            )}

            {tab === 'notes' && (
              <div className="flex flex-col gap-1.5">
                {notes.length === 0 ? (
                  <p className="text-slate-400 text-sm">No notes uploaded yet.</p>
                ) : (
                  notes.map((note) => (
                    <a
                      key={note._id}
                      href={note.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm bg-white border border-blue-100 hover:bg-blue-50 text-slate-700"
                    >
                      <span>📄 {note.title}</span>
                      <span className="text-xs text-blue-500">Download</span>
                    </a>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PaidUserLayout>
  )
}

export default PaidBatchViewPage