<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  createUser,
  getUsers,
  tetapkanSemulaKataLaluan,
  updateUser,
  type Peranan,
  type UpdateUserInput,
  type User,
} from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { PERANAN_LABEL } from '@/lib/status'

const PERANAN_OPTIONS = Object.keys(PERANAN_LABEL) as Peranan[]

const users = ref<User[]>([])
const isLoading = ref(true)
const errorMessage = ref('')

// Penapis — dihantar sebagai query `peranan` / `aktif` (API.md §2.1).
const filterPeranan = ref('')
const filterAktif = ref('')

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    users.value = await getUsers(
      (filterPeranan.value || undefined) as Peranan | undefined,
      filterAktif.value === '' ? undefined : filterAktif.value === 'true',
    )
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan senarai pengguna.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadData)
watch([filterPeranan, filterAktif], loadData)

function isSelf(u: User) {
  return u.id === currentUser.value?.id
}

// --- Cipta / kemaskini pengguna ---

const isFormOpen = ref(false)
const editingUser = ref<User | null>(null)
const formNama = ref('')
const formEmail = ref('')
const formPeranan = ref<Peranan>('PEGAWAI_PENYEMAK')
const formPassword = ref('')
const formError = ref('')
const isFormSubmitting = ref(false)

const isEditing = computed(() => editingUser.value !== null)

function openCreate() {
  editingUser.value = null
  formNama.value = ''
  formEmail.value = ''
  formPeranan.value = 'PEGAWAI_PENYEMAK'
  formPassword.value = ''
  formError.value = ''
  isFormOpen.value = true
}

function openEdit(u: User) {
  editingUser.value = u
  formNama.value = u.nama_penuh
  formEmail.value = u.email
  formPeranan.value = u.peranan
  formPassword.value = ''
  formError.value = ''
  isFormOpen.value = true
}

async function handleFormSubmit() {
  formError.value = ''
  isFormSubmitting.value = true
  try {
    if (editingUser.value) {
      const u = editingUser.value
      // Hantar hanya medan yang ditukar.
      const changes: UpdateUserInput = {}
      if (formNama.value !== u.nama_penuh) changes.nama_penuh = formNama.value
      if (formEmail.value !== u.email) changes.email = formEmail.value
      if (formPeranan.value !== u.peranan) changes.peranan = formPeranan.value
      if (Object.keys(changes).length === 0) {
        isFormOpen.value = false
        return
      }
      await updateUser(u.id, changes)
      toast.success(`Maklumat ${formNama.value} telah dikemaskini.`)
    } else {
      if (formPassword.value.length < 8) {
        formError.value = 'Kata laluan mesti sekurang-kurangnya 8 aksara.'
        return
      }
      await createUser({
        nama_penuh: formNama.value,
        email: formEmail.value,
        peranan: formPeranan.value,
        password: formPassword.value,
      })
      toast.success(`Akaun ${formNama.value} telah dicipta.`)
    }
    isFormOpen.value = false
    await loadData()
  } catch (err) {
    formError.value = err instanceof Error ? err.message : 'Gagal menyimpan maklumat pengguna.'
  } finally {
    isFormSubmitting.value = false
  }
}

// --- Nyahaktif / aktifkan semula ---

const isAktifOpen = ref(false)
const aktifUser = ref<User | null>(null)
const aktifError = ref('')
const isAktifSubmitting = ref(false)

function openAktif(u: User) {
  aktifUser.value = u
  aktifError.value = ''
  isAktifOpen.value = true
}

async function handleAktifConfirm() {
  if (!aktifUser.value) return
  const u = aktifUser.value
  aktifError.value = ''
  isAktifSubmitting.value = true
  try {
    await updateUser(u.id, { aktif: !u.aktif })
    toast.success(
      u.aktif ? `Akaun ${u.nama_penuh} telah dinyahaktifkan.` : `Akaun ${u.nama_penuh} telah diaktifkan semula.`,
    )
    isAktifOpen.value = false
    await loadData()
  } catch (err) {
    aktifError.value = err instanceof Error ? err.message : 'Gagal mengemaskini status akaun.'
  } finally {
    isAktifSubmitting.value = false
  }
}

// --- Tetapkan semula kata laluan ---

const isPasswordOpen = ref(false)
const passwordUser = ref<User | null>(null)
const passwordBaharu = ref('')
const passwordError = ref('')
const isPasswordSubmitting = ref(false)

function openPassword(u: User) {
  passwordUser.value = u
  passwordBaharu.value = ''
  passwordError.value = ''
  isPasswordOpen.value = true
}

async function handlePasswordSubmit() {
  if (!passwordUser.value) return
  passwordError.value = ''
  if (passwordBaharu.value.length < 8) {
    passwordError.value = 'Kata laluan mesti sekurang-kurangnya 8 aksara.'
    return
  }
  isPasswordSubmitting.value = true
  try {
    const { mesej } = await tetapkanSemulaKataLaluan(passwordUser.value.id, passwordBaharu.value)
    toast.success(mesej)
    isPasswordOpen.value = false
  } catch (err) {
    passwordError.value = err instanceof Error ? err.message : 'Gagal menetapkan semula kata laluan.'
  } finally {
    isPasswordSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold">Pengurusan Pengguna</h1>
      <Button @click="openCreate">Tambah Pengguna</Button>
    </div>

    <p v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</p>

    <Card>
      <CardHeader>
        <CardTitle>Senarai Pengguna</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-wrap gap-4">
          <div class="space-y-2">
            <Label for="filter_peranan">Peranan</Label>
            <Select id="filter_peranan" v-model="filterPeranan" class="w-48">
              <option value="">Semua Peranan</option>
              <option v-for="p in PERANAN_OPTIONS" :key="p" :value="p">{{ PERANAN_LABEL[p] }}</option>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="filter_aktif">Status</Label>
            <Select id="filter_aktif" v-model="filterAktif" class="w-48">
              <option value="">Semua Status</option>
              <option value="true">Aktif</option>
              <option value="false">Tidak Aktif</option>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Penuh</TableHead>
              <TableHead>Emel</TableHead>
              <TableHead>Peranan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="u in users" :key="u.id">
              <TableCell>{{ u.nama_penuh }}</TableCell>
              <TableCell>{{ u.email }}</TableCell>
              <TableCell>{{ PERANAN_LABEL[u.peranan] }}</TableCell>
              <TableCell>
                <Badge v-if="u.aktif" class="bg-green-500 text-white">Aktif</Badge>
                <Badge v-else variant="secondary">Tidak Aktif</Badge>
              </TableCell>
              <TableCell>
                <div class="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" @click="openEdit(u)">Kemaskini</Button>
                  <Button size="sm" variant="outline" @click="openPassword(u)">Tetapkan Kata Laluan</Button>
                  <Button
                    v-if="!isSelf(u)"
                    size="sm"
                    :variant="u.aktif ? 'destructive' : 'secondary'"
                    @click="openAktif(u)"
                  >
                    {{ u.aktif ? 'Nyahaktif' : 'Aktifkan' }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="!isLoading && users.length === 0">
              <TableCell colspan="5" class="text-muted-foreground text-center">Tiada pengguna.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Dialog v-model:open="isFormOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ isEditing ? 'Kemaskini Pengguna' : 'Tambah Pengguna' }}</DialogTitle>
          <DialogDescription>
            {{ isEditing ? 'Kemaskini nama, emel atau peranan pengguna.' : 'Cipta akaun pengguna baharu.' }}
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handleFormSubmit">
          <div class="space-y-2">
            <Label for="nama_penuh">Nama Penuh</Label>
            <Input id="nama_penuh" v-model="formNama" required />
          </div>
          <div class="space-y-2">
            <Label for="email">Emel</Label>
            <Input id="email" v-model="formEmail" type="email" required />
          </div>
          <div class="space-y-2">
            <Label for="peranan">Peranan</Label>
            <Select id="peranan" v-model="formPeranan" :disabled="editingUser !== null && isSelf(editingUser)">
              <option v-for="p in PERANAN_OPTIONS" :key="p" :value="p">{{ PERANAN_LABEL[p] }}</option>
            </Select>
            <p v-if="editingUser !== null && isSelf(editingUser)" class="text-muted-foreground text-xs">
              Anda tidak boleh menukar peranan akaun sendiri.
            </p>
          </div>
          <div v-if="!isEditing" class="space-y-2">
            <Label for="password">Kata Laluan Awal</Label>
            <Input id="password" v-model="formPassword" type="password" autocomplete="new-password" minlength="8" required />
            <p class="text-muted-foreground text-xs">Minimum 8 aksara.</p>
          </div>

          <p v-if="formError" class="text-destructive text-sm">{{ formError }}</p>

          <DialogFooter>
            <Button type="button" variant="outline" :disabled="isFormSubmitting" @click="isFormOpen = false">
              Batal
            </Button>
            <Button type="submit" :disabled="isFormSubmitting">
              {{ isFormSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isAktifOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ aktifUser?.aktif ? 'Nyahaktif Akaun' : 'Aktifkan Semula Akaun' }}</DialogTitle>
          <DialogDescription>
            <template v-if="aktifUser?.aktif">
              Adakah anda pasti mahu menyahaktifkan akaun <strong>{{ aktifUser?.nama_penuh }}</strong>? Pengguna ini
              tidak akan dapat log masuk dan akan dilog keluar serta-merta.
            </template>
            <template v-else>
              Adakah anda pasti mahu mengaktifkan semula akaun <strong>{{ aktifUser?.nama_penuh }}</strong>?
            </template>
          </DialogDescription>
        </DialogHeader>
        <p v-if="aktifError" class="text-destructive text-sm">{{ aktifError }}</p>
        <DialogFooter>
          <Button variant="outline" :disabled="isAktifSubmitting" @click="isAktifOpen = false">Batal</Button>
          <Button
            :variant="aktifUser?.aktif ? 'destructive' : 'default'"
            :disabled="isAktifSubmitting"
            @click="handleAktifConfirm"
          >
            {{ isAktifSubmitting ? 'Memproses...' : 'Sahkan' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="isPasswordOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tetapkan Semula Kata Laluan</DialogTitle>
          <DialogDescription>
            Tetapkan kata laluan sementara bagi <strong>{{ passwordUser?.nama_penuh }}</strong>. Pengguna patut
            menukarnya selepas log masuk.
          </DialogDescription>
        </DialogHeader>
        <form class="space-y-4" @submit.prevent="handlePasswordSubmit">
          <div class="space-y-2">
            <Label for="password_baharu">Kata Laluan Baharu</Label>
            <Input
              id="password_baharu"
              v-model="passwordBaharu"
              type="password"
              autocomplete="new-password"
              minlength="8"
              required
            />
            <p class="text-muted-foreground text-xs">Minimum 8 aksara.</p>
          </div>

          <p v-if="passwordError" class="text-destructive text-sm">{{ passwordError }}</p>

          <DialogFooter>
            <Button type="button" variant="outline" :disabled="isPasswordSubmitting" @click="isPasswordOpen = false">
              Batal
            </Button>
            <Button type="submit" :disabled="isPasswordSubmitting">
              {{ isPasswordSubmitting ? 'Menyimpan...' : 'Simpan' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
