import { Inbox, UserCheck, Crown, Users, Building2, Check, MapPin } from 'lucide-react'

const STEPS = [
  { key: 'resepsionis', label: 'Resepsionis', icon: Inbox },
  { key: 'sekretaris', label: 'Sekretaris', icon: UserCheck },
  { key: 'direktur_utama', label: 'Dirut', icon: Crown },
  { key: 'direksi_bidang', label: 'Direksi Bidang', icon: Users },
  { key: 'bagian_teknis', label: 'Bagian Teknis', icon: Building2 },
]

export default function LetterTracker({ position, locationNote, history = [] }) {
  const active = STEPS.findIndex((s) => s.key === position)
  const fmt = (d) => new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  const name = (t) => t.replaceAll('_', ' ')
  return (
    <div>
      <ol className="flex items-start">
        {STEPS.map((s, i) => {
          const done = i < active, now = i === active, Icon = s.icon
          return (
            <li key={s.key} className="relative flex-1 text-center">
              {i > 0 && <span className={`absolute left-[-50%] right-[50%] top-6 border-t-[3px] ${i <= active ? 'border-blue-600' : 'border-dashed border-slate-300'}`} />}
              <span className={`relative z-10 mx-auto flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-colors
                ${done ? 'border-blue-600 bg-blue-600 text-white' : now ? 'border-[#FFC61A] bg-[#FFC61A] text-[#14202E] shadow-[0_0_0_5px_rgba(255,198,26,.28)]' : 'border-slate-200 bg-white text-slate-400'}`}>
                {done ? <Check size={20} /> : <Icon size={20} />}
              </span>
              <p className={`mt-2 px-0.5 text-[11px] leading-tight ${now ? 'font-bold text-[#14202E]' : 'text-slate-500'}`}>{s.label}</p>
            </li>
          )
        })}
      </ol>

      {locationNote && (
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
          <MapPin size={16} className="mt-0.5 shrink-0" /> <span><b>Lokasi surat:</b> {locationNote}</span>
        </p>
      )}

      {history.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-semibold text-slate-900">Riwayat disposisi</p>
          <ul className="relative space-y-4 border-l-2 border-dashed border-slate-300 pl-5">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-600 ring-2 ring-blue-200" />
                <p className="text-sm font-semibold capitalize text-slate-800">{name(h.from_role)} <span className="font-normal text-slate-400">ke</span> {name(h.to_role)}{h.to_bagian ? ` · ${h.to_bagian}` : ''}</p>
                {h.notes && <p className="mt-1 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{h.notes}</p>}
                <p className="mt-1 text-xs text-slate-400">{fmt(h.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
