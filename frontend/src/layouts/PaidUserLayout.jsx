import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PaidUserLayout = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { label: 'My Batches', path: '/paiduser/dashboard', icon: '📚' },
    { label: 'Profile',    path: '/paiduser/profile',   icon: '👤' },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-blue-900 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-md">JSS</span>
          <span className="text-sm font-bold text-white">Learning</span>
        </span>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-blue-300 hover:text-white text-xl">✕</button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-5 py-3 text-sm transition-colors ${
                isActive ? 'bg-blue-900 text-white border-l-2 border-orange-400' : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-blue-900">
        <p className="text-xs text-blue-400 mb-2 truncate">{user?.username}</p>
        <button onClick={handleLogout} className="w-full text-xs text-blue-300 hover:text-white py-1 transition-colors text-left">
          Sign out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex bg-blue-50/40">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full w-56 bg-blue-950 z-30 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <SidebarContent />
      </aside>
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        <div className="md:hidden bg-white border-b border-blue-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-blue-700 hover:text-blue-900 text-xl p-1">☰</button>
          <span className="text-sm font-bold text-blue-900">JSS Learning</span>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}

export default PaidUserLayout