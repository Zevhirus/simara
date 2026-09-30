import { useEffect, useState, useCallback } from 'react'
import { FileInput, FileOutput, Search, FileText, Trash2, PlusCircle, Upload, X, Archive, ArrowDownLeft, ArrowUpRight, CalendarDays } from 'lucide-react'
import { supabase, STATUS_LABEL } from '../lib/supabase'

const ctl = 'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20'
const fmt = (d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const today = () => new Date().toISOString().slice(0, 10)

function OutModal({ profile, onClose, onDone }) {
  const [f, setF] = useState({ letter_number: '', recipient: '', subject: '', letter_date: today(), notes: '', file: null })
  const [busy, setBusy] = useState(false), [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'file' ? e.target.files[0] : e.target.value })
  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      let path = null
      if (f.file) {
        if (f.file.type !== 'application/pdf') throw new Error('File harus berformat PDF.')
        path = `keluar/${Date.now()}-${f.file.name.replace(/[^\w.-]/g, '_')}`
        const up = await supabase.storage.from('letters').upload(path, f.file)
        if (up.error) throw up.error
      }
      const { error } = await supabase.from('outgoing_letters').insert({ letter_number: f.letter_number, recipient: f.recipient, subject: f.subject, letter_date: f.letter_date, notes: f.notes || null, file_url: path, created_by: profile.id })
      if (error) throw error
      onDone()
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b-4 border-[#FFC61A] px-5 py-4">
          <h2 className="font-semibold text-slate-900">Catat surat keluar</h2>
          <button type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <input required className={ctl + ' w-full'} placeholder="Nomor surat" value={f.letter_number} onChange={set('letter_number')} />
          <input required className={ctl + ' w-full'} placeholder="Tujuan / penerima" value={f.recipient} onChange={set('recipient')} />
          <input required className={ctl + ' w-full'} placeholder="Perihal" value={f.subject} onChange={set('subject')} />
          <input required type="date" className={ctl + ' w-full'} value={f.letter_date} onChange={set('letter_date')} />
          <textarea rows={2} className={ctl + ' w-full'} placeholder="Keterangan (opsional)" value={f.notes} onChange={set('notes')} />
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
            <Upload size={16} /> {f.file ? f.file.name : 'Unggah file PDF surat'}
            <input type="file" accept="application/pdf" className="hidden" onChange={set('file')} />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Batal</button>
          <button disabled={busy} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60">{busy ? 'Menyimpan…' : 'Simpan arsip'}</button>
        </div>
      </form>
    </div>
  )
}

export default function Arsip({ profile }) {
  const [tab, setTab] = useState('masuk'), [rows, setRows] = useState([]), [stats, setStats] = useState({ masuk: 0, keluar: 0, bulan: 0 })
  const [q, setQ] = useState(''), [from, setFrom] = useState(''), [to, setTo] = useState(''), [modal, setModal] = useState(false)
  const masuk = tab === 'masuk', table = masuk ? 'letters' : 'outgoing_letters', party = masuk ? 'sender' : 'recipient'
  const isAdmin = profile.role === 'admin'
  const canAdd = !masuk && ['sekretaris', 'admin'].includes(profile.role)

  const loadStats = useCallback(async () => {
    const [a, b] = await Promise.all([supabase.from('letters').select('letter_date'), supabase.from('outgoing_letters').select('letter_date')])
    const ym = today().slice(0, 7), inMonth = (x) => (x.data || []).filter((r) => r.letter_date?.startsWith(ym)).length
    setStats({ masuk: a.data?.length || 0, keluar: b.data?.length || 0, bulan: inMonth(a) + inMonth(b) })
  }, [])
  const load = useCallback(async () => {
    let r = supabase.from(table).select('*').order('letter_date', { ascending: false }).order('created_at', { ascending: false })
    if (from) r = r.gte('letter_date', from)
    if (to) r = r.lte('letter_date', to)
    if (q) r = r.or(`letter_number.ilike.%${q}%,${party}.ilike.%${q}%,subject.ilike.%${q}%`)
    const { data } = await r; setRows(data || [])
  }, [table, party, q, from, to])
  useEffect(() => { load() }, [load])
  useEffect(() => { loadStats() }, [loadStats])

  async function openPdf(path) {
    const { data } = await supabase.storage.from('letters').createSignedUrl(path, 300)
    if (data) window.open(data.signedUrl, '_blank')
  }
  async function remove(r) {
    if (!window.confirm(`Hapus arsip ${r.letter_number}? Data dan file PDF ikut terhapus permanen.`)) return
    const { error } = await supabase.from(table).delete().eq('id', r.id)
    if (error) return window.alert('Gagal menghapus: ' + error.message)
    if (r.file_url) await supabase.storage.from('letters').remove([r.file_url])
    load(); loadStats()
  }

  const groups = rows.reduce((g, r) => { const k = r.letter_date.slice(0, 7); (g[k] ||= []).push(r); return g }, {})
  const monthLabel = (k) => new Date(k + '-01T00:00:00').toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const mon = (d) => new Date(d + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })
  const STAT = [['Surat masuk', stats.masuk, FileInput], ['Surat keluar', stats.keluar, FileOutput], ['Bulan ini', stats.bulan, CalendarDays]]

  return (
    <div className="p-4 md:p-8">
      <div className="relative mb-6 overflow-hidden rounded-3xl bg-[#14202E] p-6 md:p-8">
        <Archive className="absolute -right-8 -top-8 h-52 w-52 text-white/5" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#FFC61A]">Perumda Parkir Kota Makassar</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Arsip Surat</h1>
            <p className="mt-1 max-w-md text-sm text-slate-400">Semua surat tersimpan rapi dan bisa dicari kapan saja.</p>
          </div>
          {canAdd && <button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-xl bg-[#FFC61A] px-5 py-3 text-sm font-bold text-[#14202E] hover:bg-[#ffd24d]"><PlusCircle size={18} /> Catat surat keluar</button>}
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {STAT.map(([label, n, I]) => (
            <div key={label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <I size={18} className="mb-2 text-[#FFC61A]" />
              <p className="text-3xl font-extrabold leading-none text-white">{n}</p>
              <p className="mt-1 text-xs text-slate-300">{label}</p>
            </div>))}
        </div>
      </div>

      <div className="mb-4 grid max-w-xl grid-cols-2 gap-3">
        {[['masuk', 'Surat Masuk', 'Otomatis dari Resepsionis', FileInput, stats.masuk], ['keluar', 'Surat Keluar', 'Dicatat manual', FileOutput, stats.keluar]].map(([k, label, sub, I, n]) => (
          <button key={k} onClick={() => { setTab(k); setRows([]) }} className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${tab === k ? 'border-blue-600 bg-white shadow-md' : 'border-transparent bg-white/60 hover:bg-white'}`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${k === 'masuk' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}><I size={20} /></span>
            <span className="min-w-0"><span className="block font-bold text-[#14202E]">{label} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{n}</span></span><span className="block truncate text-xs text-slate-500">{sub}</span></span>
          </button>))}
      </div>

      <div className="mb-2 flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
        <div className="relative min-w-[200px] flex-1"><Search size={15} className="absolute left-3 top-3.5 text-slate-400" />
          <input className={ctl + ' w-full pl-9'} placeholder={`Cari nomor, ${masuk ? 'pengirim' : 'tujuan'}, perihal`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <input type="date" className={ctl} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Dari tanggal" />
        <input type="date" className={ctl} value={to} onChange={(e) => setTo(e.target.value)} aria-label="Sampai tanggal" />
      </div>

      {Object.entries(groups).map(([k, list]) => (
        <section key={k}>
          <div className="mb-2 mt-5 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{monthLabel(k)}</span>
            <span className="h-px flex-1 bg-slate-200" /><span className="text-xs text-slate-400">{list.length} surat</span>
          </div>
          {list.map((r) => (
            <div key={r.id} className={`mb-2 flex items-center gap-4 rounded-2xl border-l-[6px] bg-white p-4 shadow-sm transition hover:shadow-md ${masuk ? 'border-blue-600' : 'border-[#FFC61A]'}`}>
              <div className="hidden w-14 shrink-0 rounded-xl bg-slate-100 py-2 text-center sm:block">
                <p className="text-xl font-extrabold leading-none text-[#14202E]">{r.letter_date.slice(8, 10)}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase text-slate-500">{mon(r.letter_date)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-[#14202E]">{r.letter_number}</span>
                  {masuk && <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === 'selesai' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{STATUS_LABEL[r.status]}</span>}
                </div>
                <p className="mt-0.5 truncate text-sm text-slate-700">{r.subject}</p>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">{masuk ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />} {r[party]}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {r.file_url && <button onClick={() => openPdf(r.file_url)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><FileText size={14} /> PDF</button>}
                {isAdmin && <button onClick={() => remove(r)} aria-label="Hapus" className="rounded-xl border border-red-200 p-2 text-red-700 hover:bg-red-50"><Trash2 size={15} /></button>}
              </div>
            </div>))}
        </section>))}

      {!rows.length && (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <Archive className="mx-auto mb-3 text-slate-300" size={40} />
          <p className="font-semibold text-slate-700">Belum ada arsip {masuk ? 'surat masuk' : 'surat keluar'}</p>
          <p className="text-sm text-slate-500">{masuk ? 'Surat yang dicatat Resepsionis akan muncul di sini otomatis.' : 'Catat surat keluar pertama Anda untuk mulai mengarsipkan.'}</p>
          {canAdd && <button onClick={() => setModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-800"><PlusCircle size={16} /> Catat surat keluar</button>}
        </div>)}

      {modal && <OutModal profile={profile} onClose={() => setModal(false)} onDone={() => { setModal(false); load(); loadStats() }} />}
    </div>
  )
}
