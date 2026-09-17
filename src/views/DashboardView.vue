<script setup lang="ts">
import { computed, onMounted, ref, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ClipboardCheck,
  FilePlus,
  FileSearch,
  Inbox,
  ListChecks,
  OctagonAlert,
  UserCheck,
} from '@lucide/vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getContracts, getDashboard, type Contract, type DashboardSummary, type StatusSemasa } from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { STATUS_SEMASA_BADGE, STATUS_WARNA_BADGE, TAHAP_KEUTAMAAN_BADGE } from '@/lib/status'

const FASA_CARDS: { key: StatusSemasa; label: string; description: string; icon: Component; class: string }[] = [
  {
    key: 'TERIMA',
    label: 'Terima',
    description: 'Menunggu pengesahan PUU',
    icon: Inbox,
    class: 'bg-secondary text-secondary-foreground',
  },
  {
    key: 'DALAM_TINDAKAN',
    label: 'Dalam Tindakan',
    description: 'Sedang disemak pegawai',
    icon: FileSearch,
    class: 'bg-blue-500/10 text-blue-600',
  },
  {
    key: 'DALAM_SEMAKAN',
    label: 'Dalam Semakan',
    description: 'Menunggu penutupan rekod',
    icon: ClipboardCheck,
    class: 'bg-purple-500/10 text-purple-600',
  },
  {
    key: 'SELESAI',
    label: 'Selesai',
    description: 'Rekod telah ditutup',
    icon: CheckCircle2,
    class: 'bg-green-500/10 text-green-600',
  },
]

const AMARAN_CARDS: { key: 'KUNING' | 'JINGGA' | 'MERAH'; label: string; range: string; icon: Component; class: string }[] =
  [
    { key: 'KUNING', label: 'Kuning', range: '15–24 hari bekerja', icon: AlertTriangle, class: 'border-l-yellow-500 text-yellow-600' },
    { key: 'JINGGA', label: 'Jingga', range: '25–27 hari bekerja', icon: AlertTriangle, class: 'border-l-orange-500 text-orange-600' },
    { key: 'MERAH', label: 'Merah', range: '28 hari bekerja ke atas', icon: OctagonAlert, class: 'border-l-red-500 text-red-600' },
  ]

const summary = ref<DashboardSummary | null>(null)
const contracts = ref<Contract[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const namaPengguna = computed(() => currentUser.value?.nama_penuh ?? '')
const tarikhHariIni = new Date().toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// Kontrak terbuka dengan hari bekerja tertinggi dahulu; kontrak SELESAI di bawah.
const sortedContracts = computed(() =>
  [...contracts.value].sort((a, b) => (b.hari_bekerja ?? -1) - (a.hari_bekerja ?? -1)),
)

const quickAction = computed(() => {
  switch (currentUser.value?.peranan) {
    case 'PT_KONTRAK':
      return { to: { name: 'kontrak-baharu' }, label: 'Daftar Kontrak Baharu', icon: FilePlus }
    case 'PUU':
      return { to: { name: 'kontrak-pengesahan' }, label: 'Pengesahan Kontrak', icon: UserCheck }
    case 'PEGAWAI_PENYEMAK':
      return { to: { name: 'tugasan-saya' }, label: 'Tugasan Saya', icon: ListChecks }
    default:
      return null
  }
})

const jumlahAmaran = computed(() =>
  summary.value ? summary.value.amaran.KUNING + summary.value.amaran.JINGGA + summary.value.amaran.MERAH : 0,
)

onMounted(async () => {
  try {
    const [summaryRes, contractsRes] = await Promise.all([getDashboard(), getContracts()])
    summary.value = summaryRes
    contracts.value = contractsRes
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan data dashboard.'
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Banner navy (token sidebar) — gambar hanya digunakan di skrin log masuk. -->
    <section
      class="bg-sidebar text-sidebar-foreground relative isolate flex flex-col gap-6 overflow-hidden rounded-xl p-6 sm:flex-row sm:items-end sm:justify-between md:p-8"
    >
      <!-- Kecerunan navy dengan cahaya lembut di penjuru kanan untuk memberi kedalaman. -->
      <div
        aria-hidden="true"
        class="from-sidebar via-sidebar to-sidebar-accent absolute inset-0 -z-20 bg-linear-to-br"
      />
      <div aria-hidden="true" class="absolute -top-24 -right-16 -z-10 size-72 rounded-full bg-white/10 blur-3xl" />
      <div class="space-y-2">
        <p class="text-sidebar-primary text-xs font-semibold tracking-wider uppercase">{{ tarikhHariIni }}</p>
        <h1 class="text-2xl font-semibold tracking-tight md:text-3xl">Selamat datang, {{ namaPengguna }}</h1>
        <p class="max-w-xl text-sm text-white/80">
          Pantau kemajuan semakan kontrak dan amaran hari bekerja di satu tempat.
        </p>
      </div>
      <Button
        v-if="quickAction"
        as-child
        class="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90 shrink-0"
      >
        <RouterLink :to="quickAction.to">
          <component :is="quickAction.icon" class="size-4" />
          {{ quickAction.label }}
        </RouterLink>
      </Button>
    </section>

    <div
      v-if="errorMessage"
      role="alert"
      class="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
    >
      <AlertTriangle class="mt-0.5 size-4 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card v-for="card in FASA_CARDS" :key="card.key" class="gap-3">
        <CardHeader class="flex flex-row items-center justify-between">
          <CardTitle class="text-muted-foreground text-sm font-medium">{{ card.label }}</CardTitle>
          <div :class="['flex size-9 items-center justify-center rounded-lg', card.class]">
            <component :is="card.icon" class="size-4" />
          </div>
        </CardHeader>
        <CardContent class="space-y-1">
          <Skeleton v-if="isLoading" class="h-9 w-16" />
          <p v-else class="text-3xl font-semibold tracking-tight">{{ summary ? summary.fasa[card.key] : '—' }}</p>
          <p class="text-muted-foreground text-xs">{{ card.description }}</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader class="flex flex-row items-start justify-between gap-4">
        <div class="space-y-1.5">
          <CardTitle>Amaran Hari Bekerja</CardTitle>
          <CardDescription>Kontrak yang belum selesai mengikut tahap amaran.</CardDescription>
        </div>
        <Badge v-if="!isLoading && jumlahAmaran === 0" class="bg-green-500 text-white">
          <CheckCircle class="size-3" />
          Tiada amaran
        </Badge>
      </CardHeader>
      <CardContent class="grid gap-4 sm:grid-cols-3">
        <div
          v-for="a in AMARAN_CARDS"
          :key="a.key"
          :class="['flex items-center gap-4 rounded-lg border border-l-4 p-4', a.class]"
        >
          <component :is="a.icon" class="size-5 shrink-0" />
          <div class="min-w-0 flex-1">
            <p class="text-foreground text-sm font-medium">{{ a.label }}</p>
            <p class="text-muted-foreground text-xs">{{ a.range }}</p>
          </div>
          <Skeleton v-if="isLoading" class="h-8 w-10" />
          <p v-else class="text-foreground text-2xl font-semibold">{{ summary ? summary.amaran[a.key] : '—' }}</p>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Senarai Kontrak</CardTitle>
        <CardDescription>Disusun mengikut hari bekerja tertinggi.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kontrak</TableHead>
              <TableHead>Keutamaan</TableHead>
              <TableHead>Fasa</TableHead>
              <TableHead>Pegawai Penyemak</TableHead>
              <TableHead class="text-right">Hari Bekerja</TableHead>
              <TableHead>Amaran</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <template v-if="isLoading">
              <TableRow v-for="i in 4" :key="i">
                <TableCell><Skeleton class="h-4 w-48" /></TableCell>
                <TableCell><Skeleton class="h-5 w-14" /></TableCell>
                <TableCell><Skeleton class="h-5 w-24" /></TableCell>
                <TableCell><Skeleton class="h-4 w-32" /></TableCell>
                <TableCell><Skeleton class="ml-auto h-4 w-8" /></TableCell>
                <TableCell><Skeleton class="h-5 w-14" /></TableCell>
              </TableRow>
            </template>
            <template v-else>
              <TableRow v-for="c in sortedContracts" :key="c.id">
                <TableCell>
                  <p class="font-medium">{{ c.nama_kontrak }}</p>
                  <p class="text-muted-foreground text-xs">{{ c.pemilik_kontrak }} · {{ c.bahagian_pemilik }}</p>
                </TableCell>
                <TableCell>
                  <Badge :class="TAHAP_KEUTAMAAN_BADGE[c.tahap_keutamaan].class">
                    {{ TAHAP_KEUTAMAAN_BADGE[c.tahap_keutamaan].label }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge :class="STATUS_SEMASA_BADGE[c.status_semasa].class">
                    {{ STATUS_SEMASA_BADGE[c.status_semasa].label }}
                  </Badge>
                </TableCell>
                <TableCell>{{ c.pegawai_penyemak?.nama_penuh ?? '—' }}</TableCell>
                <TableCell class="text-right tabular-nums">{{ c.hari_bekerja ?? '—' }}</TableCell>
                <TableCell>
                  <Badge v-if="c.status_warna" :class="STATUS_WARNA_BADGE[c.status_warna].class">
                    {{ STATUS_WARNA_BADGE[c.status_warna].label }}
                  </Badge>
                  <span v-else class="text-muted-foreground">—</span>
                </TableCell>
              </TableRow>
              <TableRow v-if="contracts.length === 0">
                <TableCell colspan="6">
                  <div class="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm">
                    <Inbox class="size-8" />
                    Tiada kontrak buat masa ini.
                  </div>
                </TableCell>
              </TableRow>
            </template>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
