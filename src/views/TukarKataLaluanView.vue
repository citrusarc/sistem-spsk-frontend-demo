<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tukarKataLaluan } from '@/lib/api'

const passwordLama = ref('')
const passwordBaharu = ref('')
const pengesahanPassword = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  errorMessage.value = ''
  if (passwordBaharu.value.length < 8) {
    errorMessage.value = 'Kata laluan baharu mesti sekurang-kurangnya 8 aksara.'
    return
  }
  if (passwordBaharu.value !== pengesahanPassword.value) {
    errorMessage.value = 'Pengesahan kata laluan tidak sepadan.'
    return
  }
  isSubmitting.value = true
  try {
    const { mesej } = await tukarKataLaluan(passwordLama.value, passwordBaharu.value)
    toast.success(mesej)
    passwordLama.value = ''
    passwordBaharu.value = ''
    pengesahanPassword.value = ''
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal menukar kata laluan.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-semibold">Tukar Kata Laluan</h1>

    <Card>
      <CardHeader>
        <CardTitle>Kata Laluan Akaun</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleSubmit">
          <div class="space-y-2 md:col-span-2">
            <Label for="password_lama">Kata Laluan Semasa</Label>
            <Input
              id="password_lama"
              v-model="passwordLama"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>

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

          <div class="space-y-2">
            <Label for="pengesahan_password">Sahkan Kata Laluan Baharu</Label>
            <Input
              id="pengesahan_password"
              v-model="pengesahanPassword"
              type="password"
              autocomplete="new-password"
              required
            />
          </div>

          <p v-if="errorMessage" class="text-destructive text-sm md:col-span-2">{{ errorMessage }}</p>

          <div class="md:col-span-2">
            <Button type="submit" :disabled="isSubmitting">
              {{ isSubmitting ? 'Menyimpan...' : 'Tukar Kata Laluan' }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
