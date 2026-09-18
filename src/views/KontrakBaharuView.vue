<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import SuccessDialog from '@/components/SuccessDialog.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createContract, getUsers, type TahapKeutamaan, type User } from '@/lib/api'

const router = useRouter()

const namaKontrak = ref('')
const tahapKeutamaan = ref<TahapKeutamaan>('RENDAH')
const tarikhTerimaPuu = ref('')
const pemilikKontrak = ref('')
const bahagianPemilik = ref('')
const pegawaiPenyemakId = ref('')
const failPdf = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const penyemakOptions = ref<User[]>([])
const isLoadingPenyemak = ref(true)
const errorMessage = ref('')
const isSubmitting = ref(false)
const isSuccessOpen = ref(false)
const createdId = ref<string | null>(null)

onMounted(async () => {
  try {
    penyemakOptions.value = await getUsers('PEGAWAI_PENYEMAK')
    if (penyemakOptions.value.length > 0) pegawaiPenyemakId.value = penyemakOptions.value[0].id
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan senarai pegawai penyemak.'
  } finally {
    isLoadingPenyemak.value = false
  }
})

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  if (file && file.type !== 'application/pdf') {
    errorMessage.value = 'Fail mesti dalam format PDF.'
    failPdf.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }
  errorMessage.value = ''
  failPdf.value = file
}

function resetForm() {
  namaKontrak.value = ''
  tahapKeutamaan.value = 'RENDAH'
  tarikhTerimaPuu.value = ''
  pemilikKontrak.value = ''
  bahagianPemilik.value = ''
  pegawaiPenyemakId.value = penyemakOptions.value[0]?.id ?? ''
  failPdf.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''
  if (!failPdf.value) {
    errorMessage.value = 'Sila muat naik fail PDF kontrak.'
    return
  }
  isSubmitting.value = true
  try {
    const created = await createContract({
      nama_kontrak: namaKontrak.value,
      tahap_keutamaan: tahapKeutamaan.value,
      tarikh_terima_puu: tarikhTerimaPuu.value,
      pemilik_kontrak: pemilikKontrak.value,
      bahagian_pemilik: bahagianPemilik.value,
      pegawai_penyemak_id: pegawaiPenyemakId.value,
      fail_pdf: failPdf.value,
    })
    createdId.value = created.id
    resetForm()
    isSuccessOpen.value = true
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Pendaftaran kontrak gagal.'
  } finally {
    isSubmitting.value = false
  }
}

function handleSuccessClose() {
  if (createdId.value) router.push({ name: 'kontrak-butiran', params: { id: createdId.value } })
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Daftar Kontrak Baharu</h1>

    <Card>
      <CardHeader>
        <CardTitle>Butiran Kontrak</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
          <div class="space-y-2 md:col-span-2">
            <Label for="nama_kontrak">Nama Kontrak</Label>
            <Input id="nama_kontrak" v-model="namaKontrak" required />
          </div>

          <div class="space-y-2">
            <Label for="tahap_keutamaan">Tahap Keutamaan</Label>
            <Select id="tahap_keutamaan" v-model="tahapKeutamaan">
              <option value="RENDAH">Rendah</option>
              <option value="TINGGI">Tinggi</option>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="tarikh_terima_puu">Tarikh Terima PUU</Label>
            <Input id="tarikh_terima_puu" v-model="tarikhTerimaPuu" type="date" required />
          </div>

          <div class="space-y-2">
            <Label for="pemilik_kontrak">Pemilik Kontrak</Label>
            <Input id="pemilik_kontrak" v-model="pemilikKontrak" required />
          </div>

          <div class="space-y-2">
            <Label for="bahagian_pemilik">Bahagian Pemilik</Label>
            <Input id="bahagian_pemilik" v-model="bahagianPemilik" required />
          </div>

          <div class="space-y-2">
            <Label for="pegawai_penyemak_id">Cadangan Pegawai Penyemak</Label>
            <Select id="pegawai_penyemak_id" v-model="pegawaiPenyemakId" :disabled="isLoadingPenyemak">
              <option v-if="isLoadingPenyemak" value="">Memuatkan...</option>
              <option v-for="u in penyemakOptions" :key="u.id" :value="u.id">{{ u.nama_penuh }}</option>
            </Select>
          </div>

          <div class="space-y-2 md:col-span-2">
            <Label for="fail_pdf">Fail PDF Kontrak</Label>
            <input
              id="fail_pdf"
              ref="fileInputRef"
              type="file"
              accept="application/pdf"
              class="border-input file:text-foreground flex h-9 w-full rounded-md border bg-transparent text-sm shadow-xs file:mr-3 file:h-full file:border-0 file:bg-transparent file:px-3 file:font-medium"
              required
              @change="handleFileChange"
            />
          </div>

          <p v-if="errorMessage" class="text-destructive text-sm md:col-span-2">{{ errorMessage }}</p>

          <div class="md:col-span-2">
            <Button type="submit" :disabled="isSubmitting || isLoadingPenyemak">
              {{ isSubmitting ? 'Menghantar...' : 'Daftar Kontrak' }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <SuccessDialog
      v-model:open="isSuccessOpen"
      title="Kontrak Didaftarkan"
      message="Kontrak telah didaftarkan dan dihantar kepada PUU untuk pengesahan."
      button-label="Lihat Kontrak"
      @close="handleSuccessClose"
    />
  </div>
</template>
