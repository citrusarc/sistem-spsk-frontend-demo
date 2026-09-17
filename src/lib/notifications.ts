import { ref, type Component } from 'vue'
import { toast } from 'vue-sonner'
import { AlertTriangle, Bell, CheckCircle2, ClipboardCheck, OctagonAlert, UserPlus } from '@lucide/vue'
import {
  getNotifications,
  getUnreadCount,
  tandakanNotifikasiDibaca,
  type JenisNotifikasi,
  type Notification,
} from './api'

// Label, ikon & warna bagi setiap jenis notifikasi (warna ikut jadual badge dalam CLAUDE.md).
const JENIS_NOTIFIKASI: Record<JenisNotifikasi, { label: string; icon: Component; class: string }> = {
  PENUGASAN_BARU: { label: 'Penugasan Baharu', icon: UserPlus, class: 'bg-blue-500/10 text-blue-600' },
  AMARAN_KUNING: { label: 'Amaran Kuning', icon: AlertTriangle, class: 'bg-yellow-500/15 text-yellow-600' },
  AMARAN_JINGGA: { label: 'Amaran Jingga', icon: AlertTriangle, class: 'bg-orange-500/10 text-orange-600' },
  AMARAN_MERAH: { label: 'Amaran Merah', icon: OctagonAlert, class: 'bg-red-500/10 text-red-600' },
  SEMAKAN_SELESAI: { label: 'Semakan Selesai', icon: ClipboardCheck, class: 'bg-purple-500/10 text-purple-600' },
  KONTRAK_DITUTUP: { label: 'Kontrak Ditutup', icon: CheckCircle2, class: 'bg-green-500/10 text-green-600' },
}

// Enum jenis_notifikasi masih terbuka (API.md §3) — jangan pecah jika backend hantar nilai baharu.
export function jenisNotifikasiMeta(jenis: string) {
  return (
    JENIS_NOTIFIKASI[jenis as JenisNotifikasi] ?? {
      label: 'Notifikasi',
      icon: Bell,
      class: 'bg-secondary text-secondary-foreground',
    }
  )
}

const POLL_INTERVAL_MS = 30_000
const MAX_INDIVIDUAL_TOASTS = 3

// Dikongsi oleh loceng notifikasi (header), sidebar dan skrin Notifikasi supaya sentiasa segerak.
export const notifications = ref<Notification[]>([])
export const unreadCount = ref(0)
export const isLoadingNotifications = ref(false)

const seenIds = new Set<string>()
let timer: ReturnType<typeof setInterval> | null = null
let onView: () => void = () => {}

export async function loadNotifications() {
  isLoadingNotifications.value = true
  try {
    const { notifications: list } = await getNotifications()
    notifications.value = list
    unreadCount.value = list.filter((n) => !n.telah_dibaca).length
    return list
  } finally {
    isLoadingNotifications.value = false
  }
}

export async function markAsRead(n: Notification) {
  if (n.telah_dibaca) return
  n.telah_dibaca = true
  if (unreadCount.value > 0) unreadCount.value -= 1
  try {
    await tandakanNotifikasiDibaca(n.id)
  } catch (err) {
    n.telah_dibaca = false
    unreadCount.value += 1
    throw err
  }
}

function showToast(n: Notification) {
  const meta = jenisNotifikasiMeta(n.jenis_notifikasi)
  const options = { description: n.mesej, action: { label: 'Lihat', onClick: () => onView() } }
  // Warna toast: merah = kritikal, kuning = amaran, hijau = berjaya/selesai, biru = maklumat, kelabu = lain-lain.
  switch (n.jenis_notifikasi) {
    case 'AMARAN_MERAH':
      return toast.error(meta.label, options)
    case 'AMARAN_KUNING':
    case 'AMARAN_JINGGA':
      return toast.warning(meta.label, options)
    case 'SEMAKAN_SELESAI':
    case 'KONTRAK_DITUTUP':
      return toast.success(meta.label, options)
    case 'PENUGASAN_BARU':
      return toast.info(meta.label, options)
    default:
      return toast(meta.label, options)
  }
}

function announceNew(list: Notification[]) {
  const fresh = list.filter((n) => !n.telah_dibaca && !seenIds.has(n.id))
  for (const n of list) seenIds.add(n.id)
  if (fresh.length > MAX_INDIVIDUAL_TOASTS) {
    toast.info(`${fresh.length} notifikasi baharu`, { action: { label: 'Lihat', onClick: () => onView() } })
  } else {
    // Senarai disusun terbaharu dahulu — paparkan yang lama dahulu supaya yang terbaharu di atas.
    for (const n of [...fresh].reverse()) showToast(n)
  }
}

async function poll() {
  if (document.hidden) return
  try {
    const { count } = await getUnreadCount()
    if (count === unreadCount.value) return
    announceNew(await loadNotifications())
  } catch {
    // Kegagalan semakan berkala tidak kritikal — cuba lagi pada kitaran seterusnya.
  }
}

// Tiada push dari backend — semak kiraan belum baca secara berkala (#16) dan muat senarai (#14) bila berubah.
export async function startNotificationPolling(handleView: () => void) {
  stopNotificationPolling()
  onView = handleView
  try {
    const list = await loadNotifications()
    for (const n of list) seenIds.add(n.id)
    if (unreadCount.value > 0) {
      toast.info(`Anda mempunyai ${unreadCount.value} notifikasi belum dibaca`, {
        action: { label: 'Lihat', onClick: () => onView() },
      })
    }
  } catch {
    // Diabaikan — semakan berkala akan cuba semula.
  }
  timer = setInterval(poll, POLL_INTERVAL_MS)
  document.addEventListener('visibilitychange', poll)
}

export function stopNotificationPolling() {
  if (timer) clearInterval(timer)
  timer = null
  document.removeEventListener('visibilitychange', poll)
  seenIds.clear()
  notifications.value = []
  unreadCount.value = 0
}

const relativeFormatter = new Intl.RelativeTimeFormat('ms', { numeric: 'auto' })

export function formatMasaRelatif(iso: string) {
  const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ]
  for (const [unit, sec] of units) {
    if (Math.abs(diffSec) >= sec) {
      if (unit === 'day' && Math.abs(diffSec) >= 7 * 86_400) {
        return new Date(iso).toLocaleDateString('ms-MY', { dateStyle: 'medium' })
      }
      return relativeFormatter.format(Math.round(diffSec / sec), unit)
    }
  }
  return 'baru sahaja'
}

export function formatTarikhMasa(iso: string) {
  return new Date(iso).toLocaleString('ms-MY', { dateStyle: 'medium', timeStyle: 'short' })
}
