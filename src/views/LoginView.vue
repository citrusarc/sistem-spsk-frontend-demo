<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { AlertCircle, BellRing, Eye, EyeOff, FileCheck2, Loader2, Lock, Mail, Timer, Workflow } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/auth'

const FEATURES = [
  { icon: Workflow, title: 'Aliran kerja 4 fasa', description: 'Dari penerimaan kontrak hingga rekod ditutup.' },
  { icon: Timer, title: 'Pantau 30 hari bekerja', description: 'Amaran automatik pada hari ke-15, 25 dan 28.' },
  { icon: BellRing, title: 'Notifikasi segera', description: 'Pegawai berkaitan dimaklumkan pada setiap peringkat.' },
]

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isSubmitting = ref(false)

const router = useRouter()
const route = useRoute()

async function handleSubmit() {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    await login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirect)
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Log masuk gagal.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <!-- Teks di atas gambar: warna tetap ikut token sidebar (navy) supaya mudah dibaca. -->
    <div class="bg-sidebar text-sidebar-foreground relative isolate hidden flex-col justify-between overflow-hidden p-10 lg:flex">
      <img src="/images/hero-putrajaya.jpg" alt="" class="absolute inset-0 -z-30 size-full object-cover" />
      <div aria-hidden="true" class="absolute inset-0 -z-20 bg-black/15" />
      <div
        aria-hidden="true"
        class="from-sidebar/95 via-sidebar/70 to-sidebar/25 absolute inset-0 -z-10 bg-linear-to-t"
      />

      <div class="flex items-center gap-3">
        <div class="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <FileCheck2 class="size-5" />
        </div>
        <span class="text-lg font-semibold">SPSK</span>
      </div>

      <div class="max-w-lg space-y-8">
        <div class="space-y-4">
          <p
            class="text-sidebar-primary bg-sidebar/60 w-fit rounded-full border border-white/20 px-3 py-1 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm"
          >
            Pejabat Penasihat Undang-Undang
          </p>
          <h2 class="text-4xl font-semibold tracking-tight">Sistem Pemantauan Semakan Kontrak</h2>
          <p class="text-lg text-white/85">
            Pastikan setiap semakan kontrak diselesaikan dalam tempoh 30 hari bekerja.
          </p>
        </div>
        <ul class="grid gap-4">
          <li
            v-for="f in FEATURES"
            :key="f.title"
            class="flex gap-4 rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm"
          >
            <div class="bg-sidebar-primary/90 text-sidebar-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <component :is="f.icon" class="size-5" />
            </div>
            <div>
              <p class="font-medium">{{ f.title }}</p>
              <p class="text-sm text-white/75">{{ f.description }}</p>
            </div>
          </li>
        </ul>
      </div>

      <p class="text-sm text-white/70">Akses terhad kepada pegawai yang diberi kebenaran sahaja.</p>
    </div>

    <div class="flex items-center justify-center p-6 md:p-10">
      <div class="w-full max-w-sm space-y-8">
        <div class="bg-sidebar text-sidebar-foreground relative isolate overflow-hidden rounded-xl p-5 lg:hidden">
          <img src="/images/hero-putrajaya.jpg" alt="" class="absolute inset-0 -z-20 size-full object-cover" />
          <div aria-hidden="true" class="from-sidebar/95 to-sidebar/40 absolute inset-0 -z-10 bg-linear-to-r" />
          <div class="flex items-center gap-3">
            <div class="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg">
              <FileCheck2 class="size-5" />
            </div>
            <div class="leading-tight">
              <p class="font-semibold">SPSK</p>
              <p class="text-xs text-white/80">Sistem Pemantauan Semakan Kontrak</p>
            </div>
          </div>
        </div>

        <div class="space-y-2">
          <h1 class="text-2xl font-semibold tracking-tight">Log masuk</h1>
          <p class="text-muted-foreground text-sm">Masukkan emel dan kata laluan akaun anda.</p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="email">Emel</Label>
            <div class="relative">
              <Mail class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="email"
                v-model="email"
                type="email"
                placeholder="nama@moha.gov.my"
                autocomplete="username"
                class="h-10 pl-9"
                :aria-invalid="errorMessage ? true : undefined"
                required
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="password">Kata Laluan</Label>
            <div class="relative">
              <Lock class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="current-password"
                class="h-10 pr-10 pl-9"
                :aria-invalid="errorMessage ? true : undefined"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-muted-foreground absolute top-1/2 right-1 size-8 -translate-y-1/2"
                :aria-label="showPassword ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="size-4" />
                <Eye v-else class="size-4" />
              </Button>
            </div>
          </div>

          <div
            v-if="errorMessage"
            role="alert"
            class="border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
          >
            <AlertCircle class="mt-0.5 size-4 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <Button type="submit" class="h-10 w-full" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="size-4 animate-spin" />
            {{ isSubmitting ? 'Sedang log masuk...' : 'Log Masuk' }}
          </Button>
        </form>

        <p class="text-muted-foreground text-center text-sm">
          Terlupa kata laluan? Sila hubungi pentadbir sistem.
        </p>
      </div>
    </div>
  </div>
</template>
