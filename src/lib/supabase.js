import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
export const ROLE_LABEL = {
  admin: 'Admin', resepsionis: 'Resepsionis', sekretaris: 'Sekretaris', direktur_utama: 'Direktur Utama',
  direktur_umum: 'Direktur Umum', direktur_operasional: 'Direktur Operasional',
  direktur_keuangan: 'Direktur Keuangan', kepala_bagian: 'Kepala Bagian',
}
export const BAGIAN_LABEL = {
  pengelolaan: 'Bagian Pengelolaan', umum: 'Bagian Umum', produksi: 'Bagian Produksi',
  keuangan: 'Bagian Keuangan', humas: 'Bagian Humas',
}
export const STATUS_LABEL = {
  di_resepsionis: 'Di Resepsionis', di_sekretaris: 'Di Sekretaris', di_dirut: 'Di Direktur Utama',
  di_direksi: 'Di Direksi Bidang', di_bagian: 'Di Kepala Bagian', selesai: 'Selesai',
}
// Tujuan disposisi yang diizinkan per role pengirim
export const NEXT_ROLES = {
  resepsionis: ['sekretaris'],
  sekretaris: ['direktur_utama', 'direktur_umum', 'direktur_operasional', 'direktur_keuangan', 'kepala_bagian'],
  direktur_utama: ['direktur_umum', 'direktur_operasional', 'direktur_keuangan'],
  direktur_umum: ['kepala_bagian'], direktur_operasional: ['kepala_bagian'], direktur_keuangan: ['kepala_bagian'],
}
