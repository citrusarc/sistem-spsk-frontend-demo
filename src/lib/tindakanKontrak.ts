// Tindakan aliran kerja bagi satu kontrak ikut peranan — dikongsi oleh Senarai Kontrak dan Butiran Kontrak.
// Rujuk API.md §1 #8–#11.
import { selesaiSemakan, semakSemula, tutupKontrak, type Contract, type Peranan } from './api'

export type Tindakan = 'pengesahan' | 'selesai-penyemak' | 'semak-semula' | 'tutup' | 'selesai-puu'

interface TindakanMeta {
  label: string
  variant: 'default' | 'outline'
  title: string
  description: string
  confirm: string
  withCatatan: boolean
  successTitle: string
  successMessage: (c: Contract) => string
  run: (c: Contract, catatan?: string) => Promise<Contract>
}

// 'pengesahan' hanya pautan ke skrin Pengesahan Kontrak (pilih pegawai penyemak di sana), bukan dialog.
export const PAUTAN_PENGESAHAN = { name: 'kontrak-pengesahan' } as const

export const TINDAKAN: Record<Exclude<Tindakan, 'pengesahan'>, TindakanMeta> = {
  'selesai-penyemak': {
    label: 'Tandakan Selesai',
    variant: 'default',
    title: 'Tandakan Semakan Selesai',
    description: 'Adakah anda pasti semakan bagi kontrak ini telah selesai? PT Kontrak akan dimaklumkan.',
    confirm: 'Sahkan',
    withCatatan: true,
    successTitle: 'Semakan Selesai',
    successMessage: () => 'Semakan selesai. PT Kontrak telah dimaklumkan.',
    run: (c, catatan) => selesaiSemakan(c.id, catatan),
  },
  tutup: {
    label: 'Tutup Rekod',
    variant: 'default',
    title: 'Tutup Rekod',
    description: 'Sahkan semakan kontrak ini telah selesai dan tutup rekodnya.',
    confirm: 'Tutup Rekod',
    withCatatan: false,
    successTitle: 'Rekod Ditutup',
    successMessage: (c) => `Rekod kontrak ${c.nama_kontrak} telah ditutup. Pegawai Penyemak telah dimaklumkan.`,
    run: (c) => tutupKontrak(c.id),
  },
  'semak-semula': {
    label: 'Hantar Semakan Semula PUU',
    variant: 'outline',
    title: 'Hantar Semakan Semula PUU',
    description: 'Kontrak ini akan dihantar kepada PUU untuk semakan kedua.',
    confirm: 'Hantar',
    withCatatan: true,
    successTitle: 'Dihantar kepada PUU',
    successMessage: (c) => `Kontrak ${c.nama_kontrak} telah dihantar kepada PUU untuk semakan semula. PUU telah dimaklumkan.`,
    run: (c, catatan) => semakSemula(c.id, catatan),
  },
  'selesai-puu': {
    label: 'Tandakan Semakan Selesai',
    variant: 'default',
    title: 'Tandakan Semakan Selesai',
    description: 'Sahkan semakan semula bagi kontrak ini telah selesai. PT Kontrak akan dimaklumkan untuk menutup rekod.',
    confirm: 'Sahkan',
    withCatatan: true,
    successTitle: 'Semakan Semula Selesai',
    successMessage: (c) =>
      `Semakan semula kontrak ${c.nama_kontrak} telah selesai. PT Kontrak telah dimaklumkan untuk menutup rekod.`,
    run: (c, catatan) => selesaiSemakan(c.id, catatan),
  },
}

export function tindakanFor(c: Contract, peranan: Peranan | undefined): Tindakan[] {
  switch (peranan) {
    case 'PUU':
      if (c.status_semasa === 'TERIMA') return ['pengesahan']
      if (c.status_semasa === 'DALAM_SEMAKAN' && c.menunggu_semakan_puu) return ['selesai-puu']
      return []
    case 'PT_KONTRAK':
      if (c.status_semasa === 'DALAM_SEMAKAN' && !c.menunggu_semakan_puu) return ['tutup', 'semak-semula']
      return []
    case 'PEGAWAI_PENYEMAK':
      if (c.status_semasa === 'DALAM_TINDAKAN') return ['selesai-penyemak']
      return []
    default:
      return []
  }
}
