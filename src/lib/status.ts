// Pemetaan label & warna badge — rujuk CLAUDE.md (jadual warna badge).
import type { Peranan, StatusSemasa, StatusWarna, TahapKeutamaan } from './api'

export const PERANAN_LABEL: Record<Peranan, string> = {
  ADMIN: 'Pentadbir Sistem',
  PT_KONTRAK: 'PT Kontrak',
  PUU: 'PUU',
  PEGAWAI_PENYEMAK: 'Pegawai Penyemak',
}

export const STATUS_SEMASA_BADGE: Record<StatusSemasa, { label: string; class: string }> = {
  TERIMA: { label: 'Terima', class: 'bg-secondary text-secondary-foreground' },
  DALAM_TINDAKAN: { label: 'Dalam Tindakan', class: 'bg-blue-500 text-white' },
  DALAM_SEMAKAN: { label: 'Dalam Semakan', class: 'bg-purple-500 text-white' },
  SELESAI: { label: 'Selesai', class: 'bg-green-500 text-white' },
}

export const STATUS_WARNA_BADGE: Record<NonNullable<StatusWarna>, { label: string; class: string }> = {
  HIJAU: { label: 'Hijau', class: 'bg-green-500 text-white' },
  KUNING: { label: 'Kuning', class: 'bg-yellow-500 text-black' },
  JINGGA: { label: 'Jingga', class: 'bg-orange-500 text-white' },
  MERAH: { label: 'Merah', class: 'bg-red-500 text-white' },
}

export const TAHAP_KEUTAMAAN_BADGE: Record<TahapKeutamaan, { label: string; class: string }> = {
  TINGGI: { label: 'Tinggi', class: 'bg-destructive text-white' },
  RENDAH: { label: 'Rendah', class: 'bg-secondary text-secondary-foreground' },
}
