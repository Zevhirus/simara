import { useState } from 'react'
import { X, Upload, Send } from 'lucide-react'
import { supabase, ROLE_LABEL, BAGIAN_LABEL, NEXT_ROLES } from '../lib/supabase'

const field = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20'

// mode: 'create' (Resepsionis) | 'disposition' (Sekretaris, Dirut, Direktur Bidang)
export default function LetterModal({ mode, profile, letter, onClose, onDone }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [f, setF] = useState({ letter_number: '', sender: '', subject: '', letter_date: new Date().toISOString().slice(0, 10), file: null, to_role: (NEXT_ROLES[profile.role] || [])[0], to_bagian: 'pengelolaan', notes: '', location_note: letter?.location_note || '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'file' ? e.target.files[0] : e.target.value })

  async function submit(e) {
    e.preventDefault(); setBusy(true); setErr('')
    try {
      if (mode === 'create') {
        let path = null
        if (f.file) {
          if (f.file.type !== 'application/pdf') throw new Error('File harus berformat PDF.')
          path = `${Date.now()}-${f.file.name.replace(/[^\w.-]/g, '_')}`
          const up = await supabase.storage.from('letters').upload(path, f.file)
          if (up.error) throw up.error
        }
        const { error } = await supabase.from('letters').insert({ letter_number: f.letter_number, sender: f.sender, subject: f.subject, letter_date: f.letter_date, file_url: path, created_by: profile.id })
        if (error) throw error
      } else {
        if (profile.role === 'sekretaris' || f.location_note !== letter.location_note)
          await supabase.from('letters').update({ location_note: f.location_note }).eq('id', letter.id)
        const { error } = await supabase.from('dispositions').insert({
          letter_id: letter.id, from_user_id: profile.id, from_role: profile.role, to_role: f.to_role,
          to_bagian: f.to_role === 'kepala_bagian' ? f.to_bagian : null, notes: f.notes })
        if (error) throw error
      }
      onDone()
    } catch (e2) { setErr(e2.message) } finally { setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b-4 border-[#FFC61A] px-5 py-4">
          <h2 className="font-semibold text-slate-900">{mode === 'create' ? 'Catat surat masuk' : `Teruskan surat ${letter.letter_number}`}</h2>
          <button type="button" onClick={onClose} aria-label="Tutup"><X size={18} /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {mode === 'create' ? (<>
            <input required className={field} placeholder="Nomor surat" value={f.letter_number} onChange={set('letter_number')} />
            <input required className={field} placeholder="Pengirim" value={f.sender} onChange={set('sender')} />
            <input required className={field} placeholder="Perihal" value={f.subject} onChange={set('subject')} />
            <input required type="date" className={field} value={f.letter_date} onChange={set('letter_date')} />
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 hover:bg-slate-50">
              <Upload size={16} /> {f.file ? f.file.name : 'Unggah file PDF surat'}
              <input type="file" accept="application/pdf" className="hidden" onChange={set('file')} />
            </label>
          </>) : (<>
            <select className={field} value={f.to_role} onChange={set('to_role')}>
              {NEXT_ROLES[profile.role].map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            {f.to_role === 'kepala_bagian' && (
              <select className={field} value={f.to_bagian} onChange={set('to_bagian')}>
                {Object.entries(BAGIAN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>)}
            <input className={field} placeholder="Lokasi surat saat ini (mis. Ruang Direksi, lantai 2)" value={f.location_note} onChange={set('location_note')} />
            <textarea required rows={3} className={field} placeholder="Catatan / instruksi disposisi" value={f.notes} onChange={set('notes')} />
          </>)}
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Batal</button>
          <button disabled={busy} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60">
            <Send size={14} /> {busy ? 'Menyimpan…' : mode === 'create' ? 'Simpan surat' : 'Teruskan disposisi'}
          </button>
        </div>
      </form>
    </div>
  )
}
