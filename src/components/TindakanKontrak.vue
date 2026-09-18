<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { toast } from 'vue-sonner'
import SuccessDialog from '@/components/SuccessDialog.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Contract } from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { PAUTAN_PENGESAHAN, TINDAKAN, tindakanFor, type Tindakan } from '@/lib/tindakanKontrak'

const props = defineProps<{ contract: Contract }>()
// updated: kontrak selepas tindakan berjaya. stale: tindakan gagal (cth. 409 — status telah diubah pengguna lain),
// induk patut muat semula data.
const emit = defineEmits<{ updated: [contract: Contract]; stale: [] }>()

const senarai = computed(() => tindakanFor(props.contract, currentUser.value?.peranan))

const aktif = ref<Exclude<Tindakan, 'pengesahan'> | null>(null)
const meta = computed(() => (aktif.value ? TINDAKAN[aktif.value] : null))
const isConfirmOpen = ref(false)
const catatan = ref('')
const isSubmitting = ref(false)

const isSuccessOpen = ref(false)
const success = ref({ title: '', message: '' })
let updatedContract: Contract | null = null

function openConfirm(t: Exclude<Tindakan, 'pengesahan'>) {
  aktif.value = t
  catatan.value = ''
  isConfirmOpen.value = true
}

async function handleConfirm() {
  if (!meta.value) return
  isSubmitting.value = true
  try {
    updatedContract = await meta.value.run(props.contract, catatan.value.trim() || undefined)
    success.value = { title: meta.value.successTitle, message: meta.value.successMessage(props.contract) }
    isConfirmOpen.value = false
    isSuccessOpen.value = true
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Tindakan gagal.')
    isConfirmOpen.value = false
    emit('stale')
  } finally {
    isSubmitting.value = false
  }
}

// Kemas kini induk hanya selepas dialog kejayaan ditutup, supaya baris tidak hilang dari senarai
// (tapisan "Perlu Tindakan Saya") sebelum pengguna membaca mesej.
function handleSuccessClose() {
  if (updatedContract) emit('updated', updatedContract)
  updatedContract = null
}
</script>

<template>
  <div v-if="senarai.length" class="flex flex-wrap gap-2">
    <template v-for="t in senarai" :key="t">
      <Button v-if="t === 'pengesahan'" size="sm" as-child>
        <RouterLink :to="PAUTAN_PENGESAHAN">Pengesahan</RouterLink>
      </Button>
      <Button v-else size="sm" :variant="TINDAKAN[t].variant" @click="openConfirm(t)">
        {{ TINDAKAN[t].label }}
      </Button>
    </template>
  </div>
  <span v-else class="text-muted-foreground">—</span>

  <Dialog v-model:open="isConfirmOpen">
    <DialogContent v-if="meta">
      <DialogHeader>
        <DialogTitle>{{ meta.title }}</DialogTitle>
        <DialogDescription>
          <strong>{{ contract.nama_kontrak }}</strong> — {{ meta.description }}
        </DialogDescription>
      </DialogHeader>
      <div v-if="meta.withCatatan" class="space-y-2">
        <Label :for="`catatan-${contract.id}`">Catatan (pilihan)</Label>
        <Input :id="`catatan-${contract.id}`" v-model="catatan" placeholder="Nyatakan catatan jika ada" />
      </div>
      <DialogFooter>
        <Button variant="outline" :disabled="isSubmitting" @click="isConfirmOpen = false">Batal</Button>
        <Button :disabled="isSubmitting" @click="handleConfirm">
          {{ isSubmitting ? 'Memproses...' : meta.confirm }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <SuccessDialog
    v-model:open="isSuccessOpen"
    :title="success.title"
    :message="success.message"
    @close="handleSuccessClose"
  />
</template>
