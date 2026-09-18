<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { toast } from 'vue-sonner'
import { AlertTriangle, ArrowLeft, Download } from '@lucide/vue'
import TindakanKontrak from '@/components/TindakanKontrak.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  ApiError,
  downloadContractFile,
  getContract,
  getContractLogs,
  getUsers,
  type Contract,
  type WorkflowStatusLog,
} from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { formatTarikhMasa } from '@/lib/notifications'
import { STATUS_SEMASA_BADGE, STATUS_WARNA_BADGE, TAHAP_KEUTAMAAN_BADGE } from '@/lib/status'

const route = useRoute()

const contract = ref<Contract | null>(null)
const logs = ref<WorkflowStatusLog[]>([])
const namaPengguna = ref<Record<string, string>>({})
const isLoading = ref(true)
const errorMessage = ref('')
const isDownloading = ref(false)

const contractId = computed(() => String(route.params.id))

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [c, l] = await Promise.all([getContract(contractId.value), getContractLogs(contractId.value)])
    contract.value = c
    logs.value = l.logs
    await loadNamaPengguna(c)
  } catch (err) {
    contract.value = null
    if (err instanceof ApiError && err.status === 403) errorMessage.value = 'Anda tidak dibenarkan melihat kontrak ini.'
    else if (err instanceof ApiError && err.status === 404) errorMessage.value = 'Kontrak tidak dijumpai.'
    else errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan butiran kontrak.'
  } finally {
    isLoading.value = false
  }
}

// Log hanya ada ditukar_oleh_id. PT Kontrak/PUU boleh dapatkan senarai pengguna aktif (#3); Pegawai Penyemak
// tidak, jadi guna nama yang sedia ada dalam objek kontrak sahaja.
async function loadNamaPengguna(c: Contract) {
  const map: Record<string, string> = {}
  if (c.pt_kontrak) map[c.pt_kontrak.id] = c.pt_kontrak.nama_penuh
  if (c.pegawai_penyemak) map[c.pegawai_penyemak.id] = c.pegawai_penyemak.nama_penuh
  if (currentUser.value) map[currentUser.value.id] = currentUser.value.nama_penuh
  if (currentUser.value?.peranan !== 'PEGAWAI_PENYEMAK') {
    try {
      for (const u of await getUsers()) map[u.id] = u.nama_penuh
    } catch {
      // Tidak kritikal — lajur "Oleh" akan papar "—".
    }
  }
  namaPengguna.value = map
}

watch(contractId, loadData, { immediate: true })

// Peristiwa sejarah, terbaharu dahulu. Tiada log semasa pendaftaran — baris "Kontrak didaftarkan" dibina dari created_at.
// Log DALAM_SEMAKAN → DALAM_SEMAKAN bersilih ganti: ganjil (dari yang terawal) = dihantar kepada PUU, genap = PUU selesai.
const sejarah = computed(() => {
  if (!contract.value) return []
  const oldestFirst = [...logs.value].reverse()
  let bilSemakSemula = 0
  const events = oldestFirst.map((log) => {
    let peristiwa: string
    if (log.status_lama === 'DALAM_SEMAKAN' && log.status_baharu === 'DALAM_SEMAKAN') {
      bilSemakSemula++
      peristiwa = bilSemakSemula % 2 === 1 ? 'Dihantar untuk semakan semula PUU' : 'Semakan semula PUU selesai'
    } else if (log.status_baharu === 'DALAM_TINDAKAN') peristiwa = 'Penugasan disahkan oleh PUU'
    else if (log.status_baharu === 'DALAM_SEMAKAN') peristiwa = 'Semakan selesai oleh Pegawai Penyemak'
    else if (log.status_baharu === 'SELESAI') peristiwa = 'Rekod ditutup'
    else peristiwa = STATUS_SEMASA_BADGE[log.status_baharu]?.label ?? log.status_baharu
    return {
      id: log.id,
      peristiwa,
      status: log.status_baharu,
      oleh: namaPengguna.value[log.ditukar_oleh_id] ?? '—',
      catatan: log.catatan,
      masa: log.created_at,
    }
  })
  const c = contract.value
  return [
    {
      id: 'daftar',
      peristiwa: 'Kontrak didaftarkan',
      status: 'TERIMA' as const,
      oleh: c.pt_kontrak?.nama_penuh ?? '—',
      catatan: null,
      masa: c.created_at,
    },
    ...events,
  ].reverse()
})

async function handleDownload() {
  if (!contract.value) return
  isDownloading.value = true
  try {
    const blob = await downloadContractFile(contract.value.id)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contract.value.nama_kontrak}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal memuat turun fail.')
  } finally {
    isDownloading.value = false
  }
}

function formatTarikh(iso: string) {
  return new Date(iso).toLocaleDateString('ms-MY', { dateStyle: 'medium' })
}
</script>

<template>
  <div class="space-y-6">
    <Button variant="ghost" size="sm" as-child class="-ml-2">
      <RouterLink :to="{ name: 'kontrak' }">
        <ArrowLeft class="size-4" />
        Kembali ke senarai
      </RouterLink>
    </Button>

    <div
      v-if="errorMessage"
      role="alert"
      class="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <AlertTriangle class="mt-0.5 size-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <template v-if="isLoading && !contract">
      <Skeleton class="h-8 w-2/3" />
      <Skeleton class="h-48 w-full" />
    </template>

    <template v-else-if="contract">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="space-y-2">
          <h1 class="text-2xl font-semibold">{{ contract.nama_kontrak }}</h1>
          <div class="flex flex-wrap gap-1">
            <Badge :class="STATUS_SEMASA_BADGE[contract.status_semasa].class">
              {{ STATUS_SEMASA_BADGE[contract.status_semasa].label }}
            </Badge>
            <Badge v-if="contract.menunggu_semakan_puu" variant="outline">Menunggu Semakan PUU</Badge>
            <Badge :class="TAHAP_KEUTAMAAN_BADGE[contract.tahap_keutamaan].class">
              Keutamaan {{ TAHAP_KEUTAMAAN_BADGE[contract.tahap_keutamaan].label }}
            </Badge>
            <Badge v-if="contract.status_warna" :class="STATUS_WARNA_BADGE[contract.status_warna].class">
              Amaran {{ STATUS_WARNA_BADGE[contract.status_warna].label }}
            </Badge>
          </div>
        </div>
        <TindakanKontrak :contract="contract" @updated="loadData" @stale="loadData" />
      </div>

      <Card>
        <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
          <CardTitle>Butiran Kontrak</CardTitle>
          <Button variant="outline" size="sm" :disabled="isDownloading" @click="handleDownload">
            <Download class="size-4" />
            {{ isDownloading ? 'Memuat turun...' : 'Muat Turun PDF' }}
          </Button>
        </CardHeader>
        <CardContent>
          <dl class="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt class="text-muted-foreground">Pemilik Kontrak</dt>
              <dd class="font-medium">{{ contract.pemilik_kontrak }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Bahagian Pemilik</dt>
              <dd class="font-medium">{{ contract.bahagian_pemilik }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Tarikh Terima PUU</dt>
              <dd class="font-medium">{{ formatTarikh(contract.tarikh_terima_puu) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Didaftarkan Oleh</dt>
              <dd class="font-medium">{{ contract.pt_kontrak?.nama_penuh ?? '—' }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Pegawai Penyemak</dt>
              <dd class="font-medium">
                {{ contract.pegawai_penyemak?.nama_penuh ?? '—' }}
                <span
                  v-if="contract.pegawai_penyemak && contract.status_semasa === 'TERIMA'"
                  class="text-muted-foreground font-normal"
                >
                  (cadangan)
                </span>
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">Hari Bekerja</dt>
              <dd class="font-medium">{{ contract.hari_bekerja ?? '—' }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sejarah</CardTitle>
          <CardDescription>Jejak aliran kerja kontrak, terbaharu dahulu.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Masa</TableHead>
                <TableHead>Peristiwa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Oleh</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="e in sejarah" :key="e.id">
                <TableCell class="whitespace-nowrap">{{ formatTarikhMasa(e.masa) }}</TableCell>
                <TableCell>{{ e.peristiwa }}</TableCell>
                <TableCell>
                  <Badge :class="STATUS_SEMASA_BADGE[e.status].class">{{ STATUS_SEMASA_BADGE[e.status].label }}</Badge>
                </TableCell>
                <TableCell>{{ e.oleh }}</TableCell>
                <TableCell class="text-muted-foreground">{{ e.catatan ?? '—' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </template>
  </div>
</template>
