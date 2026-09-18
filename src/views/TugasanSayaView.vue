<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import SuccessDialog from '@/components/SuccessDialog.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getContracts, selesaiSemakan, type Contract } from '@/lib/api'
import { STATUS_WARNA_BADGE } from '@/lib/status'

const contracts = ref<Contract[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

const isDialogOpen = ref(false)
const selectedContract = ref<Contract | null>(null)
const isSubmitting = ref(false)
const isSuccessOpen = ref(false)

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const allContracts = await getContracts()
    contracts.value = allContracts.filter((c) => c.status_semasa === 'DALAM_TINDAKAN')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan senarai tugasan.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)

function openConfirm(contract: Contract) {
  selectedContract.value = contract
  isDialogOpen.value = true
}

async function handleConfirm() {
  if (!selectedContract.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    await selesaiSemakan(selectedContract.value.id)
    contracts.value = contracts.value.filter((c) => c.id !== selectedContract.value!.id)
    isDialogOpen.value = false
    isSuccessOpen.value = true
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal menandakan semakan selesai.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Tugasan Saya</h1>

    <p v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</p>

    <Card>
      <CardHeader>
        <CardTitle>Kontrak Dalam Semakan Anda</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Kontrak</TableHead>
              <TableHead>Pemilik Kontrak</TableHead>
              <TableHead>Hari Bekerja</TableHead>
              <TableHead>Amaran</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="c in contracts" :key="c.id">
              <TableCell>{{ c.nama_kontrak }}</TableCell>
              <TableCell>{{ c.pemilik_kontrak }}</TableCell>
              <TableCell>{{ c.hari_bekerja ?? '—' }}</TableCell>
              <TableCell>
                <Badge v-if="c.status_warna" :class="STATUS_WARNA_BADGE[c.status_warna].class">
                  {{ STATUS_WARNA_BADGE[c.status_warna].label }}
                </Badge>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell>
                <Button size="sm" @click="openConfirm(c)">Tandakan Selesai</Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="!isLoading && contracts.length === 0">
              <TableCell colspan="5" class="text-muted-foreground text-center">Tiada tugasan buat masa ini.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog v-model:open="isDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tandakan Semakan Selesai</DialogTitle>
          <DialogDescription>
            Adakah anda pasti semakan bagi kontrak
            <strong>{{ selectedContract?.nama_kontrak }}</strong> telah selesai? Tindakan ini akan menghantar kontrak
            untuk semakan seterusnya.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" :disabled="isSubmitting" @click="isDialogOpen = false">Batal</Button>
          <Button :disabled="isSubmitting" @click="handleConfirm">
            {{ isSubmitting ? 'Menghantar...' : 'Sahkan' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <SuccessDialog
      v-model:open="isSuccessOpen"
      title="Semakan Selesai"
      message="Semakan selesai. PT Kontrak telah dimaklumkan."
    />
  </div>
</template>
