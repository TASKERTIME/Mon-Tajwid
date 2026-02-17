import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  userId: string|null; username: string|null; displayName: string|null
  isAdmin: boolean; isAuthenticated: boolean; preferredReciter: string
  activeTajwidRules: string[]
  login: (id:string,user:string,name:string|null,admin?:boolean)=>void
  logout: ()=>void; setReciter: (r:string)=>void; setTajwidRules: (r:string[])=>void
}
export const useAuthStore = create<AuthState>()(persist((set)=>({
  userId:null,username:null,displayName:null,isAdmin:false,isAuthenticated:false,
  preferredReciter:'7',
  activeTajwidRules:['noon_sakinah_ikhfa','noon_sakinah_idgham','noon_sakinah_iqlab','qalqalah','ghunnah','madd_natural','meem_sakinah_ikhfa'],
  login:(id,user,name,admin=false)=>set({userId:id,username:user,displayName:name,isAdmin:admin,isAuthenticated:true}),
  logout:()=>set({userId:null,username:null,displayName:null,isAdmin:false,isAuthenticated:false}),
  setReciter:(r)=>set({preferredReciter:r}),
  setTajwidRules:(r)=>set({activeTajwidRules:r}),
}),{name:'mtj-auth'}))

interface ProgressState {
  surahProgress: Record<number,{validated:boolean;bestScore:number;attempts:number}>
  bookmarks: Record<number,number>
  streak: number; lastPracticeDate: string|null
  setSurahProgress:(id:number,d:{validated:boolean;bestScore:number;attempts:number})=>void
  setBookmark:(s:number,v:number)=>void; removeBookmark:(s:number)=>void
  updateStreak:()=>void; getTotalStars:()=>number
}
export const useProgressStore = create<ProgressState>()(persist((set,get)=>({
  surahProgress:{},bookmarks:{},streak:0,lastPracticeDate:null,
  setSurahProgress:(id,d)=>set(s=>({surahProgress:{...s.surahProgress,[id]:d}})),
  setBookmark:(s,v)=>set(st=>({bookmarks:{...st.bookmarks,[s]:v}})),
  removeBookmark:(s)=>set(st=>{const b={...st.bookmarks};delete b[s];return{bookmarks:b}}),
  updateStreak:()=>{
    const today=new Date().toISOString().split('T')[0]
    const{lastPracticeDate:lp,streak:s}=get()
    if(lp===today)return
    const yday=new Date(Date.now()-864e5).toISOString().split('T')[0]
    set({streak:lp===yday?s+1:1,lastPracticeDate:today})
  },
  getTotalStars:()=>Object.values(get().surahProgress).filter(p=>p.validated).length,
}),{name:'mtj-progress'}))

type Tab='quran'|'duels'|'duas'|'rappels'|'settings'
interface UIState {
  activeTab:Tab; currentVerse:number|null; displayMode:'arabic'|'phonetic'|'translation'|'all'
  isPlaying:boolean; showInstall:boolean
  setTab:(t:Tab)=>void; setVerse:(v:number|null)=>void
  setDisplay:(m:'arabic'|'phonetic'|'translation'|'all')=>void
  setPlaying:(p:boolean)=>void; hideInstall:()=>void
}
export const useUIStore = create<UIState>()(persist((set)=>({
  activeTab:'quran',currentVerse:null,displayMode:'arabic',isPlaying:false,showInstall:true,
  setTab:t=>set({activeTab:t}),setVerse:v=>set({currentVerse:v}),
  setDisplay:m=>set({displayMode:m}),setPlaying:p=>set({isPlaying:p}),
  hideInstall:()=>set({showInstall:false}),
}),{name:'mtj-ui'}))
