// Satu-satunya tempat BASE_URL ditakrifkan. Semua panggilan API mesti melalui fail ini.
export const BASE_URL = 'http://localhost:3000'

const TOKEN_KEY = 'spsk_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export type Peranan = 'ADMIN' | 'PT_KONTRAK' | 'PUU' | 'PEGAWAI_PENYEMAK'

export interface User {
  id: string
  nama_penuh: string
  email: string
  peranan: Peranan
  aktif: boolean
  created_at: string
  updated_at: string
}

export type TahapKeutamaan = 'TINGGI' | 'RENDAH'
export type StatusSemasa = 'TERIMA' | 'DALAM_TINDAKAN' | 'DALAM_SEMAKAN' | 'SELESAI'
export type StatusWarna = 'HIJAU' | 'KUNING' | 'JINGGA' | 'MERAH' | null

export interface Contract {
  id: string
  nama_kontrak: string
  tahap_keutamaan: TahapKeutamaan
  tarikh_terima_puu: string
  pemilik_kontrak: string
  bahagian_pemilik: string
  fail_pdf_path: string
  status_semasa: StatusSemasa
  pt_kontrak_id: string
  pegawai_penyemak_id: string | null
  created_at: string
  updated_at: string
  hari_bekerja: number | null
  status_warna: StatusWarna
  // true = PT Kontrak telah hantar untuk semakan semula PUU yang belum selesai (hanya bermakna semasa DALAM_SEMAKAN).
  menunggu_semakan_puu: boolean
  pt_kontrak: { id: string; nama_penuh: string } | null
  pegawai_penyemak: { id: string; nama_penuh: string } | null
}

export interface WorkflowStatusLog {
  id: string
  contract_id: string
  status_lama: StatusSemasa
  status_baharu: StatusSemasa
  ditukar_oleh_id: string
  catatan: string | null
  created_at: string
}

export type JenisNotifikasi =
  | 'PENUGASAN_BARU'
  | 'AMARAN_KUNING'
  | 'AMARAN_JINGGA'
  | 'AMARAN_MERAH'
  | 'SEMAKAN_SELESAI'
  | 'KONTRAK_DITUTUP'
  // Nama sama dengan status_semasa DALAM_SEMAKAN tetapi maksud berbeza: PUU diminta semak semula (API.md §2.4).
  | 'DALAM_SEMAKAN'
  // Nama sama dengan status_semasa TERIMA: kontrak baharu menunggu pengesahan penugasan (penerima: PUU).
  | 'TERIMA'

export interface Notification {
  id: string
  penerima_id: string
  contract_id: string
  jenis_notifikasi: JenisNotifikasi
  mesej: string
  telah_dibaca: boolean
  created_at: string
}

export interface DashboardSummary {
  fasa: Record<StatusSemasa, number>
  amaran: Record<'KUNING' | 'JINGGA' | 'MERAH', number>
}

export interface NewContractInput {
  nama_kontrak: string
  tahap_keutamaan: TahapKeutamaan
  tarikh_terima_puu: string
  pemilik_kontrak: string
  bahagian_pemilik: string
  pegawai_penyemak_id: string
  fail_pdf: File
}

export interface NewUserInput {
  nama_penuh: string
  email: string
  peranan: Peranan
  password: string
}

export type UpdateUserInput = Partial<Pick<User, 'nama_penuh' | 'email' | 'peranan' | 'aktif'>>

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Token tidak sah / akaun dinyahaktifkan (401) — pengguna mesti dilog keluar. Didaftarkan oleh lib/auth.ts.
let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (!(options.body instanceof FormData) && options.body != null) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.()
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? 'Ralat tidak diketahui.')
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// --- Auth ---

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function getMe() {
  return request<User>('/api/auth/me')
}

export function tukarKataLaluan(passwordLama: string, passwordBaharu: string) {
  return request<{ mesej: string }>('/api/auth/password', {
    method: 'PATCH',
    body: JSON.stringify({ password_lama: passwordLama, password_baharu: passwordBaharu }),
  })
}

// --- Pengguna ---

export function getUsers(peranan?: Peranan, aktif?: boolean) {
  const params = new URLSearchParams()
  if (peranan) params.set('peranan', peranan)
  if (aktif !== undefined) params.set('aktif', String(aktif))
  const qs = params.toString() ? `?${params}` : ''
  return request<User[]>(`/api/users${qs}`)
}

export function createUser(input: NewUserInput) {
  return request<User>('/api/users', { method: 'POST', body: JSON.stringify(input) })
}

export function updateUser(id: string, input: UpdateUserInput) {
  return request<User>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function tetapkanSemulaKataLaluan(id: string, passwordBaharu: string) {
  return request<{ mesej: string }>(`/api/users/${id}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password_baharu: passwordBaharu }),
  })
}

// --- Kontrak ---

export function createContract(input: NewContractInput) {
  const form = new FormData()
  form.set('nama_kontrak', input.nama_kontrak)
  form.set('tahap_keutamaan', input.tahap_keutamaan)
  form.set('tarikh_terima_puu', input.tarikh_terima_puu)
  form.set('pemilik_kontrak', input.pemilik_kontrak)
  form.set('bahagian_pemilik', input.bahagian_pemilik)
  form.set('pegawai_penyemak_id', input.pegawai_penyemak_id)
  form.set('fail_pdf', input.fail_pdf)
  return request<Contract>('/api/contracts', { method: 'POST', body: form })
}

export function getContracts() {
  return request<Contract[]>('/api/contracts')
}

export function getContract(id: string) {
  return request<Contract>(`/api/contracts/${id}`)
}

export function getContractFileUrl(id: string) {
  return `${BASE_URL}/api/contracts/${id}/fail`
}

export async function downloadContractFile(id: string): Promise<Blob> {
  const token = getToken()
  const headers = new Headers()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const res = await fetch(getContractFileUrl(id), { headers })
  if (res.status === 401 && token) onUnauthorized?.()
  if (!res.ok) throw new ApiError(res.status, 'Gagal memuat turun fail.')
  return res.blob()
}

export function setujuiPenugasan(id: string, pegawaiPenyemakId?: string) {
  return request<Contract>(`/api/contracts/${id}/persetujuan`, {
    method: 'PATCH',
    body: JSON.stringify(
      pegawaiPenyemakId
        ? { setuju: false, pegawai_penyemak_id: pegawaiPenyemakId }
        : { setuju: true },
    ),
  })
}

export function selesaiSemakan(id: string, catatan?: string) {
  return request<Contract>(`/api/contracts/${id}/selesai-semakan`, {
    method: 'PATCH',
    body: JSON.stringify({ catatan }),
  })
}

export function semakSemula(id: string, catatan?: string) {
  return request<Contract>(`/api/contracts/${id}/semak-semula`, {
    method: 'PATCH',
    body: JSON.stringify({ catatan }),
  })
}

export function tutupKontrak(id: string) {
  return request<Contract>(`/api/contracts/${id}/tutup`, { method: 'PATCH' })
}

export function getContractLogs(id: string) {
  return request<{ logs: WorkflowStatusLog[] }>(`/api/contracts/${id}/logs`)
}

// --- Dashboard ---

export function getDashboard() {
  return request<DashboardSummary>('/api/dashboard')
}

// --- Notifikasi ---

export function getNotifications() {
  return request<{ notifications: Notification[] }>('/api/notifications')
}

export function tandakanNotifikasiDibaca(id: string) {
  return request<Notification>(`/api/notifications/${id}/baca`, { method: 'PATCH' })
}

export function getUnreadCount() {
  return request<{ count: number }>('/api/notifications/unread-count')
}

export function triggerAlerts() {
  return request<{ diperiksa: number; notifikasi_dijana: number }>('/api/notifications/trigger-alerts', {
    method: 'POST',
  })
}
