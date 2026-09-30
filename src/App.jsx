import { useEffect, useState, useCallback } from 'react'
import { LayoutDashboard, Mail, PlusCircle, LogOut, Search, FileText, Send, ParkingCircle, CalendarDays, Inbox, UserCheck, Crown, Users, Building2, ChevronRight, Trash2, Archive } from 'lucide-react'
import { supabase, ROLE_LABEL, BAGIAN_LABEL, STATUS_LABEL, NEXT_ROLES } from './lib/supabase'
import LetterTracker from './components/LetterTracker'
import LetterModal from './components/LetterModal'
import Arsip from './components/Arsip'

const ORDER = ['di_resepsionis', 'di_sekretaris', 'di_dirut', 'di_direksi', 'di_bagian']
const ICON = { di_resepsionis: Inbox, di_sekretaris: UserCheck, di_dirut: Crown, di_direksi: Users, di_bagian: Building2 }
const TONE = {
  di_resepsionis: ['bg-slate-100 text-slate-700', 'border-slate-400'],
  di_sekretaris: ['bg-sky-100 text-sky-800', 'border-sky-500'],
  di_dirut: ['bg-amber-100 text-amber-800', 'border-amber-500'],
  di_direksi: ['bg-violet-100 text-violet-800', 'border-violet-500'],
  di_bagian: ['bg-blue-100 text-blue-800', 'border-blue-600'],
  selesai: ['bg-emerald-100 text-emerald-800', 'border-emerald-500'],
}
const ctl = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20'

function Brand({ dark, big }) {
  const [ok, setOk] = useState(true)
  return (
    <div className="flex items-center gap-3">
      <span className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ${big ? 'h-24 w-20 p-2' : 'h-12 w-10 p-1'}`}>
        {ok ? <img src="/logo-perumda-parkir.png" alt="Logo Perumda Parkir" className="h-full w-full object-contain" onError={() => setOk(false)} />
            : <ParkingCircle className="text-[#14202E]" size={26} />}
      </span>
      <div className="leading-tight">
        <p className={`${big ? 'text-xl' : 'text-base'} font-extrabold tracking-tight ${dark ? 'text-white' : 'text-[#14202E]'}`}>SIMARA</p>
        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Perumda Parkir</p>
      </div>
    </div>
  )
}

function Login() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const go = async (e) => { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setErr(error.message); setBusy(false) }
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#14202E] p-12 lg:flex">
        <Brand dark big />
        <div>
          <h1 className="max-w-md text-4xl font-extrabold leading-tight text-white">Setiap surat masuk, terpantau sampai ke meja tujuan.</h1>
          <p className="mt-4 max-w-md text-slate-400">Dari resepsionis hingga kepala bagian, lihat posisi dan disposisi surat secara langsung.</p>
        </div>
        <div className="absolute bottom-20 left-0 right-0 border-t-4 border-dashed border-[#FFC61A]/30" />
        <p className="text-xs text-slate-500">Sistem Informasi Manajemen Arsip &amp; Surat Masuk</p>
      </div>
      <div className="flex items-center justify-center bg-slate-50 p-6">
        <form onSubmit={go} className="w-full max-w-sm space-y-4">
          <div className="lg:hidden"><Brand /></div>
          <div><h2 className="text-2xl font-extrabold text-[#14202E]">Masuk</h2><p className="text-sm text-slate-500">Gunakan akun pegawai Perumda Parkir.</p></div>
          <input className={ctl + ' w-full'} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={ctl + ' w-full'} type="password" placeholder="Kata sandi" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-blue-700 py-3 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60">{busy ? 'Memproses…' : 'Masuk'}</button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null), [profile, setProfile] = useState(null)
  const [letters, setLetters] = useState([]), [all, setAll] = useState([]), [history, setHistory] = useState([])
  const [view, setView] = useState('dashboard'), [sel, setSel] = useState(null), [modal, setModal] = useState(null)
  const [q, setQ] = useState(''), [status, setStatus] = useState(''), [bagian, setBagian] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    if (session) supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => setProfile(data))
    else setProfile(null)
  }, [session])

  const load = useCallback(async () => {
    let r = supabase.from('letters').select('*').order('created_at', { ascending: false })
    if (status) r = r.eq('status', status)
    if (bagian) r = r.eq('target_bagian', bagian)
    if (from) r = r.gte('letter_date', from)
    if (to) r = r.lte('letter_date', to)
    if (q) r = r.or(`letter_number.ilike.%${q}%,sender.ilike.%${q}%,subject.ilike.%${q}%`)
    const { data } = await r; setLetters(data || [])
    const { data: a } = await supabase.from('letters').select('status'); setAll(a || [])
  }, [status, bagian, from, to, q])
  useEffect(() => { if (profile) load() }, [profile, load])

  async function openLetter(l) {
    const { data: fresh } = await supabase.from('letters').select('*').eq('id', l.id).single()
    const { data } = await supabase.from('dispositions').select('*').eq('letter_id', l.id).order('created_at')
    setSel(fresh || l); setHistory(data || [])
  }
  useEffect(() => {
    if (!profile) return
    const ch = supabase.channel('simara').on('postgres_changes', { event: '*', schema: 'public' }, () => { load(); if (sel) openLetter(sel) }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile, load, sel?.id])
  async function openPdf(path) {
    const { data } = await supabase.storage.from('letters').createSignedUrl(path, 300)
    if (data) window.open(data.signedUrl, '_blank')
  }

  async function deleteLetter(l) {
    if (!window.confirm(`Hapus surat ${l.letter_number}? Riwayat disposisi dan file PDF ikut terhapus permanen.`)) return
    const { error } = await supabase.from('letters').delete().eq('id', l.id)
    if (error) return window.alert('Gagal menghapus: ' + error.message)
    if (l.file_url) await supabase.storage.from('letters').remove([l.file_url])
    setSel(null); setHistory([]); load()
  }

  if (!session) return <Login />
  if (!profile) return <p className="p-8 text-slate-500">Memuat profil…</p>
  const canForward = !!NEXT_ROLES[profile.role]
  const count = (s) => all.filter((l) => l.status === s).length
  const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  const first = profile.full_name.split(' ')[0]

  return (
    <div className="flex min-h-screen bg-[#F3F5F8] text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#14202E] md:flex">
        <div className="p-5"><Brand dark /></div>
        <div className="mx-5 border-t-2 border-dashed border-[#FFC61A]/30" />
        <nav className="flex-1 space-y-1 p-3 text-sm">
          {[['dashboard', 'Dashboard', LayoutDashboard], ['arsip', 'Arsip', Archive]].map(([k, label, I]) => (
            <button key={k} onClick={() => setView(k)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${view === k ? 'border-l-4 border-[#FFC61A] bg-white/10 font-semibold text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}><I size={17} /> {label}</button>))}
        </nav>
        <div className="m-3 rounded-xl bg-white/5 p-4">
          <p className="text-sm font-semibold text-white">{profile.full_name}</p>
          <p className="mt-0.5 text-xs text-slate-400">{ROLE_LABEL[profile.role]}{profile.bagian ? ` · ${BAGIAN_LABEL[profile.bagian]}` : ''}</p>
          <button onClick={() => supabase.auth.signOut()} className="mt-3 flex items-center gap-2 text-xs text-slate-400 hover:text-white"><LogOut size={14} /> Keluar</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="flex items-center justify-between bg-[#14202E] px-4 py-3 md:hidden">
          <Brand dark />
          <div className="flex gap-4 text-slate-300"><button onClick={() => setView(view === 'dashboard' ? 'arsip' : 'dashboard')} aria-label="Ganti menu"><Archive size={18} /></button><button onClick={() => supabase.auth.signOut()} aria-label="Keluar"><LogOut size={18} /></button></div>
        </div>

        {view === 'arsip' ? <Arsip profile={profile} /> : <div className="p-4 md:p-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#14202E]">Halo, {first}</h1>
              <p className="text-sm text-slate-500">{ROLE_LABEL[profile.role]} · {letters.length} surat sesuai filter</p>
            </div>
            {profile.role === 'resepsionis' && (
              <button onClick={() => setModal({ mode: 'create' })} className="flex items-center gap-2 rounded-xl bg-[#FFC61A] px-5 py-3 text-sm font-bold text-[#14202E] shadow-sm hover:bg-[#ffd24d]"><PlusCircle size={18} /> Catat surat masuk</button>)}
          </header>

          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {ORDER.map((k) => { const I = ICON[k]; const on = status === k; return (
              <button key={k} onClick={() => setStatus(on ? '' : k)} className={`rounded-2xl border-2 bg-white p-4 text-left transition ${on ? 'border-blue-600 shadow-md' : 'border-transparent shadow-sm hover:border-slate-200'}`}>
                <span className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${TONE[k][0]}`}><I size={18} /></span>
                <p className="text-3xl font-extrabold leading-none text-[#14202E]">{count(k)}</p>
                <p className="mt-1 text-xs text-slate-500">{STATUS_LABEL[k]}</p>
              </button>) })}
          </div>

          <div className="mb-5 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
            <div className="relative min-w-[200px] flex-1"><Search size={15} className="absolute left-3 top-3.5 text-slate-400" />
              <input className={ctl + ' w-full pl-9'} placeholder="Cari nomor, pengirim, perihal" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <select className={ctl} value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Semua status</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <select className={ctl} value={bagian} onChange={(e) => setBagian(e.target.value)}><option value="">Semua bagian</option>{Object.entries(BAGIAN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <input type="date" className={ctl} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal" />
            <input type="date" className={ctl} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal" />
          </div>

          <div className="grid items-start gap-5 xl:grid-cols-5">
            <div className="space-y-3 xl:col-span-3">
              {letters.map((l) => {
                const pos = ORDER.indexOf(l.status)
                return (
                  <button key={l.id} onClick={() => openLetter(l)} className={`flex w-full items-center gap-4 rounded-2xl border-l-[6px] bg-white p-4 text-left shadow-sm transition hover:shadow-md ${TONE[l.status][1]} ${sel?.id === l.id ? 'ring-2 ring-blue-600' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-[#14202E]">{l.letter_number}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE[l.status][0]}`}>{STATUS_LABEL[l.status]}</span>
                      </div>
                      <p className="mt-1 truncate text-sm text-slate-700">{l.subject}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={12} /> {fmtDate(l.letter_date)} · {l.sender}</p>
                      <div className="mt-3 flex gap-1">{ORDER.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= pos || l.status === 'selesai' ? 'bg-blue-600' : 'bg-slate-200'}`} />)}</div>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-slate-300" />
                  </button>)
              })}
              {!letters.length && (
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
                  <Inbox className="mx-auto mb-3 text-slate-300" size={36} />
                  <p className="font-semibold text-slate-700">Belum ada surat yang cocok</p>
                  <p className="text-sm text-slate-500">Ubah filter, atau catat surat masuk baru.</p>
                </div>)}
            </div>

            <section className="overflow-hidden rounded-2xl bg-white shadow-sm xl:sticky xl:top-6 xl:col-span-2">
              {sel ? (<>
                <div className="bg-[#14202E] p-5">
                  <p className="text-xs text-[#FFC61A]">{sel.letter_number}</p>
                  <h2 className="mt-1 text-lg font-bold leading-snug text-white">{sel.subject}</h2>
                  <p className="mt-1 text-sm text-slate-400">Dari {sel.sender} · {fmtDate(sel.letter_date)}</p>
                </div>
                <div className="p-5">
                  <LetterTracker position={sel.current_position} locationNote={sel.location_note} history={history} />
                  <div className="mt-6 flex flex-wrap gap-2">
                    {sel.file_url && <button onClick={() => openPdf(sel.file_url)} className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><FileText size={15} /> Buka PDF</button>}
                    {profile.role === 'admin' && <button onClick={() => deleteLetter(sel)} className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 size={15} /> Hapus surat</button>}
                    {canForward && <button onClick={() => setModal({ mode: 'disposition', letter: sel })} className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"><Send size={15} /> Teruskan / disposisi</button>}
                  </div>
                </div>
              </>) : (
                <div className="p-12 text-center"><ParkingCircle className="mx-auto mb-3 text-slate-300" size={40} />
                  <p className="text-sm text-slate-500">Pilih satu surat untuk melihat posisi dan riwayat disposisinya.</p></div>)}
            </section>
          </div>
        </div>}
      </main>

      {modal && <LetterModal {...modal} profile={profile} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); if (sel) openLetter(sel) }} />}
    </div>
  )
}
