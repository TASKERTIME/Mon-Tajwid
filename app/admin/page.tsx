'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/supabase/client'
import { ArrowLeft, Users, Star, Swords, BarChart3, Shield } from 'lucide-react'

export default function AdminPage() {
  const { isAdmin, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) { router.replace('/'); return }
    loadData()
  }, [isAdmin, isAuthenticated, router])

  async function loadData() {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(profiles || [])
      const { data: progressData } = await supabase.from('user_progress').select('*')
      const totalValidations = (progressData || []).filter((p:any) => p.is_validated).length
      setStats({
        totalUsers: (profiles || []).length,
        totalValidations,
        activeToday: (profiles || []).filter((p:any) => p.last_practice_date === new Date().toISOString().split('T')[0]).length,
      })
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  if (!isAdmin) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition"><ArrowLeft className="w-5 h-5 text-white" /></button>
        <div className="flex-1 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-400" />
          <h1 className="text-xl font-bold text-white">Administration</h1>
        </div>
      </div>

      {loading ? <p className="text-white/30 text-center py-8">Chargement...</p> : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="card p-4 text-center"><Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" /><p className="text-xl font-bold text-white">{stats?.totalUsers || 0}</p><p className="text-white/25 text-[10px]">Utilisateurs</p></div>
            <div className="card p-4 text-center"><Star className="w-5 h-5 text-amber-400 mx-auto mb-1" /><p className="text-xl font-bold text-white">{stats?.totalValidations || 0}</p><p className="text-white/25 text-[10px]">Validations</p></div>
            <div className="card p-4 text-center"><BarChart3 className="w-5 h-5 text-orange-400 mx-auto mb-1" /><p className="text-xl font-bold text-white">{stats?.activeToday || 0}</p><p className="text-white/25 text-[10px]">Actifs today</p></div>
          </div>

          {/* Users list */}
          <h3 className="text-white/30 text-xs font-medium uppercase tracking-wider mb-3">Utilisateurs ({users.length})</h3>
          <div className="space-y-1.5">
            {users.map((u:any) => (
              <div key={u.id} className="card p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-sm font-bold">
                  {(u.username || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white/70 text-sm font-medium">{u.username || u.email}</p>
                  <p className="text-white/20 text-[10px]">{u.display_name} &middot; streak: {u.streak || 0}j &middot; {new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                {u.is_admin && <span className="badge-red text-[10px]">Admin</span>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
