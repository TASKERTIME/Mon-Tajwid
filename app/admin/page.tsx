'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/supabase/client'
import { ArrowLeft, Users, Star, Swords, Shield, TrendingUp } from 'lucide-react'

export default function AdminPage() {
  const { isAdmin, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated||!isAdmin) { router.replace('/'); return }
    supabase.from('profiles').select('*').order('created_at',{ascending:false}).then(({data})=>{setUsers(data||[]);setLoading(false)})
  }, [isAdmin, isAuthenticated, router])

  if (!isAdmin) return null
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={()=>router.push('/')} className="p-2.5 rounded-xl glass hover:bg-white/[0.05] transition"><ArrowLeft className="w-5 h-5 text-white/60"/></button>
        <div className="flex items-center gap-2"><Shield className="w-5 h-5 text-red-400"/><h1 className="heading text-xl font-bold text-white">Administration</h1></div>
      </div>

      {loading?<p className="text-white/20 text-center py-12">Chargement...</p>:<>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass p-5 text-center"><Users className="w-6 h-6 text-[#34d399] mx-auto mb-2"/><p className="text-2xl font-bold text-white heading">{users.length}</p><p className="text-white/20 text-[11px]">Utilisateurs</p></div>
          <div className="glass p-5 text-center"><TrendingUp className="w-6 h-6 text-[#c9a84c] mx-auto mb-2"/><p className="text-2xl font-bold text-white heading">{users.filter(u=>u.last_practice_date===today).length}</p><p className="text-white/20 text-[11px]">Actifs aujourd&apos;hui</p></div>
        </div>
        <h3 className="text-white/20 text-[10px] font-semibold uppercase tracking-[0.2em] mb-3">Utilisateurs ({users.length})</h3>
        <div className="space-y-1.5">
          {users.map((u:any)=>(
            <div key={u.id} className="glass p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#34d399]/8 flex items-center justify-center text-[#34d399] text-sm font-bold">{(u.username||'?')[0].toUpperCase()}</div>
              <div className="flex-1">
                <p className="text-white/60 text-sm font-medium">{u.username||u.email}</p>
                <p className="text-white/15 text-[10px]">{u.display_name} &middot; streak: {u.streak||0}j &middot; {new Date(u.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              {u.is_admin&&<span className="pill-red text-[10px]">Admin</span>}
            </div>
          ))}
        </div>
      </>}
    </div>
  )
}
