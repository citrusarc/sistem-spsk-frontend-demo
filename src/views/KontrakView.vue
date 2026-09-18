<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import TindakanKontrak from '@/components/TindakanKontrak.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getContracts, type Contract, type StatusSemasa, type StatusWarna } from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { STATUS_SEMASA_BADGE, STATUS_WARNA_BADGE, TAHAP_KEUTAMAAN_BADGE } from '@/lib/status'
import { tindakanFor } from '@/lib/tindakanKontrak'

// Pegawai Penyemak: skrin ini ialah "Kontrak Selesai Disemak" — kerja yang belum siap ada di Tugasan Saya.
const STATUS_PENYEMAK: StatusSemasa[] = ['DALAM_SEMAKAN', 'SELESAI']

const route = useRoute()
const router = useRouter()

const contracts = ref<Contract[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const peranan = computed(() => currentUser.value?.peranan)
const isPenyemak = computed(() => peranan.value === 'PEGAWAI_PENYEMAK')
const canAct = computed(() => peranan.value === 'PT_KONTRAK' || peranan.value === 'PUU')
const tajuk = computed(() => (isPenyemak.value ? 'Kontrak Selesai Disemak' : 'Senarai Kontrak'))

// Tapisan dibaca dari URL (?tapisan=, ?status=, ?warna=) supaya kad dashboard boleh memautkan terus ke sini.
function queryValue<T extends string>(key: string, allowed: readonly T[]): T | null {
  const v = route.query[key]
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : null
}

const tapisan = computed({
  get: () => (canAct.value && queryValue('tapisan', ['tindakan'] as const)) || 'semua',
  set: (v) => setQuery({ tapisan: v === 'tindakan' ? v : undefined }),
})
const statusFilter = computed(() =>
  queryValue<StatusSemasa>('status', isPenyemak.value ? STATUS_PENYEMAK : Object.keys(STATUS_SEMASA_BADGE) as StatusSemasa[]),
)
const warnaFilter = computed(() => queryValue<NonNullable<StatusWarna>>('warna', Object.keys(STATUS_WARNA_BADGE) as NonNullable<StatusWarna>[]))

function setQuery(patch: Record<string, string | undefined>) {
  router.replace({ query: { ...route.query, ...patch } })
}

const visibleContracts = computed(() =>
  contracts.value.filter(
    (c) =>
      (!isPenyemak.value || STATUS_PENYEMAK.includes(c.status_semasa)) &&
      (tapisan.value !== 'tindakan' || tindakanFor(c, peranan.value).length > 0) &&
      (!statusFilter.value || c.status_semasa === statusFilter.value) &&
      (!warnaFilter.value || c.status_warna === warnaFilter.value),
  ),
)

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    contracts.value = await getContracts()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan senarai kontrak.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

function handleUpdated(updated: Contract) {
  contracts.value = contracts.value.map((c) => (c.id === updated.id ? updated : c))
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">{{ tajuk }}</h1>
      <Select v-if="canAct" v-model="tapisan" class="w-56">
        <option value="semua">Semua Kontrak</option>
        <option value="tindakan">Perlu Tindakan Saya</option>
      </Select>
    </div>

    <div v-if="statusFilter || warnaFilter" class="flex flex-wrap items-center gap-2 text-sm">
      <span class="text-muted-foreground">Tapisan:</span>
      <Badge v-if="statusFilter" :class="STATUS_SEMASA_BADGE[statusFilter].class">
        Status: {{ STATUS_SEMASA_BADGE[statusFilter].label }}
        <button type="button" aria-label="Buang tapisan status" @click="setQuery({ status: undefined })">
          <X class="size-3" />
        </button>
      </Badge>
      <Badge v-if="warnaFilter" :class="STATUS_WARNA_BADGE[warnaFilter].class">
        Amaran: {{ STATUS_WARNA_BADGE[warnaFilter].label }}
        <button type="button" aria-label="Buang tapisan amaran" @click="setQuery({ warna: undefined })">
          <X class="size-3" />
        </button>
      </Badge>
      <Button variant="ghost" size="sm" @click="setQuery({ status: undefined, warna: undefined })">
        Kosongkan tapisan
      </Button>
    </div>

    <p v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</p>

    <Card>
      <CardHeader>
        <CardTitle>{{ tapisan === 'tindakan' ? 'Kontrak Perlu Tindakan' : isPenyemak ? 'Kontrak Anda' : 'Semua Kontrak' }}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kontrak</TableHead>
              <TableHead>Keutamaan</TableHead>
              <TableHead>Pegawai Penyemak</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Hari Bekerja</TableHead>
              <TableHead>Amaran</TableHead>
              <TableHead v-if="canAct">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="c in visibleContracts" :key="c.id">
              <TableCell>
                <RouterLink :to="{ name: 'kontrak-butiran', params: { id: c.id } }" class="font-medium hover:underline">
                  {{ c.nama_kontrak }}
                </RouterLink>
                <div class="text-muted-foreground text-xs">{{ c.pemilik_kontrak }} · {{ c.bahagian_pemilik }}</div>
              </TableCell>
              <TableCell>
                <Badge :class="TAHAP_KEUTAMAAN_BADGE[c.tahap_keutamaan].class">
                  {{ TAHAP_KEUTAMAAN_BADGE[c.tahap_keutamaan].label }}
                </Badge>
              </TableCell>
              <TableCell>
                {{ c.pegawai_penyemak?.nama_penuh ?? '—' }}
                <span v-if="c.pegawai_penyemak && c.status_semasa === 'TERIMA'" class="text-muted-foreground">
                  (cadangan)
                </span>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-1">
                  <Badge :class="STATUS_SEMASA_BADGE[c.status_semasa].class">
                    {{ STATUS_SEMASA_BADGE[c.status_semasa].label }}
                  </Badge>
                  <Badge v-if="c.menunggu_semakan_puu" variant="outline">Menunggu Semakan PUU</Badge>
                </div>
              </TableCell>
              <TableCell>{{ c.hari_bekerja ?? '—' }}</TableCell>
              <TableCell>
                <Badge v-if="c.status_warna" :class="STATUS_WARNA_BADGE[c.status_warna].class">
                  {{ STATUS_WARNA_BADGE[c.status_warna].label }}
                </Badge>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell v-if="canAct">
                <TindakanKontrak :contract="c" @updated="handleUpdated" @stale="loadData" />
              </TableCell>
            </TableRow>
            <TableRow v-if="!isLoading && visibleContracts.length === 0">
              <TableCell :colspan="canAct ? 7 : 6" class="text-muted-foreground text-center">
                {{ tapisan === 'tindakan' ? 'Tiada kontrak yang memerlukan tindakan anda.' : 'Tiada kontrak.' }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
