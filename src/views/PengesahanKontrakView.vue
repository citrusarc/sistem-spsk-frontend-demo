<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getContracts, getUsers, setujuiPenugasan, type Contract, type User } from '@/lib/api'

const contracts = ref<Contract[]>([])
const penyemakOptions = ref<User[]>([])
// Pegawai penyemak yang dipilih bagi setiap kontrak (mula sebagai cadangan asal PT Kontrak).
const selectedPenyemak = reactive<Record<string, string>>({})
const submittingId = ref<string | null>(null)
const isLoading = ref(true)
const errorMessage = ref('')

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [allContracts, penyemak] = await Promise.all([getContracts(), getUsers('PEGAWAI_PENYEMAK')])
    contracts.value = allContracts.filter((c) => c.status_semasa === 'TERIMA')
    penyemakOptions.value = penyemak
    for (const c of contracts.value) {
      selectedPenyemak[c.id] = c.pegawai_penyemak_id ?? ''
    }
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan senarai kontrak.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

async function handleApprove(contract: Contract) {
  errorMessage.value = ''
  submittingId.value = contract.id
  try {
    const chosen = selectedPenyemak[contract.id]
    const changed = chosen !== contract.pegawai_penyemak_id
    await setujuiPenugasan(contract.id, changed ? chosen : undefined)
    contracts.value = contracts.value.filter((c) => c.id !== contract.id)
    toast.success(`Kontrak ${contract.nama_kontrak} telah ditugaskan.`)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Pengesahan kontrak gagal.')
  } finally {
    submittingId.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Pengesahan Kontrak</h1>

    <p v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</p>

    <Card>
      <CardHeader>
        <CardTitle>Kontrak Menunggu Pengesahan</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kontrak</TableHead>
              <TableHead>Pemilik Kontrak</TableHead>
              <TableHead>Bahagian Pemilik</TableHead>
              <TableHead>Pegawai Penyemak</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="c in contracts" :key="c.id">
              <TableCell>{{ c.nama_kontrak }}</TableCell>
              <TableCell>{{ c.pemilik_kontrak }}</TableCell>
              <TableCell>{{ c.bahagian_pemilik }}</TableCell>
              <TableCell>
                <Select v-model="selectedPenyemak[c.id]" class="w-48">
                  <option v-for="u in penyemakOptions" :key="u.id" :value="u.id">{{ u.nama_penuh }}</option>
                </Select>
              </TableCell>
              <TableCell>
                <Button size="sm" :disabled="submittingId === c.id" @click="handleApprove(c)">
                  {{ submittingId === c.id ? 'Memproses...' : 'Luluskan' }}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="!isLoading && contracts.length === 0">
              <TableCell colspan="5" class="text-muted-foreground text-center">
                Tiada kontrak menunggu pengesahan.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
</template>
