import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCallback, useEffect, useRef, useState } from 'react'
import Logo from './Logo'
import {
  fetchUnreadCount,
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '../lib/api'

const NOTIF_ICONS: Record<string, string> = {
  child_account_created: '🎉',
  assignment_created: '📚',
  assignment_completed: '✅',
  assignment_completed_child: '🎉',
  child_started: '📝',
  child_question: '💬',
  parent_reply: '💬',
  new_assignment: '📚',
  high_score: '🌟',
  low_score: '⚠️',
  perfect_score: '🏆',
  badge_earned: '🥇',
  new_badge: '🥇',
  no_activity: '😴',
  deadline_approaching: '⏰',
  assignment_overdue: '🚨',
  weekly_report: '📊',
  monthly_report: '🏆',
  new_module_available: '✨',
  continue_learning: '📖',
  assignment_almost_due: '⏰',
  study_streak: '🔥',
  streak_lost: '💤',
  achievement_unlocked: '⭐',
  encouragement: '💪',
  daily_reminder: '📅',
}

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const notifPanelRef = useRef<HTMLDivElement>(null)

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await fetchUnreadCount()
      setUnreadCount(res.count)
    } catch {
      // silently fail — backend might not be up yet
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    try {
      const notifs = await fetchNotifications()
      setNotifications(notifs.slice(0, 20))
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    if (!user) return
    loadUnreadCount()
    loadNotifications()
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)
    return () => clearInterval(interval)
  }, [user, loadUnreadCount, loadNotifications])

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
      if (
        notifPanelRef.current &&
        !notifPanelRef.current.contains(event.target as Node)
      ) {
        setShowNotifPanel(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await markNotificationRead(notif.id)
        setUnreadCount((c) => Math.max(0, c - 1))
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
        )
      } catch {
        // silently fail
      }
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // silently fail
    }
  }

  const showBell = user && (user.role === 'PARENT' || user.role === 'STUDENT')

  return (
    <div className='topbar'>
      <Logo />
      {user && (
        <div className='topbar-operator'>
          {showBell && (
            <div
              ref={notifPanelRef}
              style={{ position: 'relative', marginRight: 8 }}
            >
              <button
                type='button'
                onClick={() => setShowNotifPanel((p) => !p)}
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  fontSize: 20,
                  position: 'relative',
                  padding: '4px 8px',
                }}
                title='Notifikasi'
              >
                🔔
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 4px',
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifPanel && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    width: 340,
                    maxHeight: 420,
                    overflowY: 'auto',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                    border: '1px solid #e5e7eb',
                    zIndex: 1000,
                    padding: 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: '1px solid #f3f4f6',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: 14 }}>
                      Notifikasi
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type='button'
                        onClick={handleMarkAllRead}
                        style={{
                          fontSize: 12,
                          color: '#6366f1',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p
                      style={{
                        textAlign: 'center',
                        color: '#9ca3af',
                        padding: 24,
                        fontSize: 13,
                      }}
                    >
                      Belum ada notifikasi
                    </p>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid #f9fafb',
                          cursor: 'pointer',
                          background: n.read ? '#fff' : '#f0f0ff',
                          transition: 'background 0.15s',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f5f5ff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = n.read
                            ? '#fff'
                            : '#f0f0ff'
                        }}
                      >
                        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>
                          {NOTIF_ICONS[n.type] || '📌'}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontWeight: n.read ? 500 : 700,
                              fontSize: 13,
                              margin: 0,
                              color: '#1f2937',
                            }}
                          >
                            {n.title}
                          </p>
                          <p
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              margin: '2px 0 0',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {n.message}
                          </p>
                          <p
                            style={{
                              fontSize: 11,
                              color: '#9ca3af',
                              margin: '2px 0 0',
                            }}
                          >
                            {new Date(n.createdAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        {!n.read && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#6366f1',
                              flexShrink: 0,
                              marginTop: 6,
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <span className='topbar-operator-name'>
            {user.role !== 'TEACHER' && user.name}
          </span>
          <span className='topbar-operator-role'>
            {user.role === 'TEACHER'
              ? 'Operator'
              : user.role === 'PARENT'
                ? 'Orang Tua'
                : 'Murid'}
          </span>
          <span className='topbar-operator-avatar'>
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div ref={dropdownRef} className='topbar-dropdown-container'>
            <button
              type='button'
              onClick={() => {
                setShowDropdown((prev) => !prev)
              }}
              style={{ cursor: 'pointer', border: 'none', background: 'none' }}
            >
              ▼
            </button>
            {showDropdown && (
              <div className='topbar-dropdown'>
                <button
                  type='button'
                  onClick={() => {
                    navigate('/settings')
                    setShowDropdown(false)
                  }}
                >
                  Setting
                </button>

                <button
                  type='button'
                  onClick={async () => {
                    await logout()
                    navigate('/')
                    setShowDropdown(false)
                  }}
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
