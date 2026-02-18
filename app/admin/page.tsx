'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/supabase/client'
import { ArrowLeft, Users, TrendingUp, Shield, Calendar, UserPlus, Clock, ChevronRight } from 'lucide-react'

interface UserProfile {
  id: string; username: string; display_name: string | null
  is_admin: boolean; streak: number; created_at: string
  last_practice_date: string | null
}

export default function AdminPage() {
  const { isAdmin, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { router.replace('/'); return }
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setUsers((data as UserProfile[]) || []); setLoading(false) })
  }, [isAdmin, isAuthenticated, router])

  if (!isAdmin) return null

  const today = new Date().toISOString().split('T')[0]
  const thisWeek = new Date(Date.now() - 7 * 864e5).toISOString()
  const thisMonth = new Date(Date.now() - 30 * 864e5).toISOString()

  const activeToday = users.filter(u => u.last_practice_date === today).length
  const newThisWeek = users.filter(u => u.created_at >= thisWeek).length
  const newThisMonth = users.filter(u => u.created_at >= thisMonth).length
  const avgStreak = users.length > 0 ? Math.round(users.reduce((s, u) => s + (u.streak || 0), 0) / users.length) : 0

  // Group by signup date
  const byDate: Record<string, number> = {}
  users.forEach(u => {
    const d = new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
    byDate[d] = (byDate[d] || 0) + 1
  })
  const chartData = Object.entries(byDate).reverse().slice(0, 14).reverse()
  const maxChart = Math.max(...chartData.map(([, v]) => v), 1)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="p-2.5 rounded-xl glass hover:bg-white/[0.05] transition">
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Shield className="w-5 h-5 text-red-400" />
          <h1 className="heading text-xl font-bold text-white">Administration</h1>
        </div>
        <span className="text-white/10 text-[10px] font-mono">{new Date().toLocaleDateString('fr-FR')}</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#34d399] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="glass p-5 anim-fade-up">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#34d399]/8 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#34d399]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white heading">{users.length}</p>
              <p className="text-white/20 text-[11px] mt-1">Inscrits total</p>
            </div>

            <div className="glass p-5 anim-fade-up delay-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-[#c9a84c]/8 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-[#c9a84c]" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white heading">{activeToday}</p>
              <p className="text-white/20 text-[11px] mt-1">Actifs aujourd&apos;hui</p>
            </div>

            <div className="glass p-5 anim-fade-up delay-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/8 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white heading">{newThisWeek}</p>
              <p className="text-white/20 text-[11px] mt-1">Nouveaux (7j)</p>
            </div>

            <div className="glass p-5 anim-fade-up delay-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/8 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-orange-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white heading">{avgStreak}<span className="text-lg text-white/20">j</span></p>
              <p className="text-white/20 text-[11px] mt-1">Streak moyen</p>
            </div>
          </div>

          {/* Inscriptions chart */}
          {chartData.length > 1 && (
            <div className="glass p-5 mb-6 anim-fade-up">
              <h3 className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.2em] mb-4">Inscriptions (14 derniers jours)</h3>
              <div className="flex items-end gap-1 h-24">
                {chartData.map(([date, count], i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-white/20">{count}</span>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-[#34d399]/20 to-[#34d399]/50 transition-all"
                      style={{ height: `${Math.max((count / maxChart) * 100, 8)}%`, minHeight: 4 }}
                    />
                    <span className="text-[8px] text-white/10 truncate w-full text-center">{date.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Users list */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-white/25 text-[10px] font-semibold uppercase tracking-[0.2em]">
              Utilisateurs ({users.length})
            </h3>
          </div>

          <div className="space-y-1.5">
            {users.map((u, i) => (
              <div key={u.id} className="glass p-3.5 flex items-center gap-3 anim-fade-up" style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#34d399]/15 to-[#c9a84c]/8 flex items-center justify-center text-[#34d399] text-sm font-bold heading shrink-0">
                  {(u.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-white/60 text-sm font-medium truncate">{u.username}</p>
                    {u.is_admin && <span className="pill-red text-[9px] py-0.5 px-1.5">Admin</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {u.display_name && u.display_name !== u.username && (
                      <span className="text-white/20 text-[11px]">{u.display_name}</span>
                    )}
                    <span className="text-white/10 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-orange-400/50 text-xs font-medium">{u.streak || 0}j</p>
                  <p className="text-white/8 text-[10px]">streak</p>
                </div>
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-white/6 mx-auto mb-3" />
              <p className="text-white/20 text-sm">Aucun utilisateur inscrit</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
