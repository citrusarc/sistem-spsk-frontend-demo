<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { BellOff } from '@lucide/vue'
import NotificationItem from '@/components/NotificationItem.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Notification } from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { destinasiNotifikasi, isLoadingNotifications, loadNotifications, markAsRead, notifications, unreadCount } from '@/lib/notifications'

const router = useRouter()
const filter = ref<'SEMUA' | 'BELUM_DIBACA'>('SEMUA')
const errorMessage = ref('')

const filtered = computed(() =>
  filter.value === 'BELUM_DIBACA' ? notifications.value.filter((n) => !n.telah_dibaca) : notifications.value,
)

onMounted(async () => {
  try {
    await loadNotifications()
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Gagal memuatkan notifikasi.'
  }
})

async function handleSelect(n: Notification) {
  try {
    await markAsRead(n)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal menandakan notifikasi sebagai dibaca.')
  }
  router.push(destinasiNotifikasi(n, currentUser.value?.peranan))
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-semibold tracking-tight">Notifikasi</h1>
      <p class="text-muted-foreground text-sm">Klik notifikasi untuk membuka kontrak berkaitan.</p>
    </div>

    <p v-if="errorMessage" class="text-destructive text-sm">{{ errorMessage }}</p>

    <Card>
      <CardHeader class="flex flex-row flex-wrap items-center justify-between gap-4">
        <div class="space-y-1.5">
          <CardTitle>Peti Masuk</CardTitle>
          <CardDescription>{{ unreadCount }} belum dibaca daripada {{ notifications.length }} notifikasi.</CardDescription>
        </div>
        <div class="bg-muted flex gap-1 rounded-lg p-1">
          <Button
            size="sm"
            :variant="filter === 'SEMUA' ? 'outline' : 'ghost'"
            class="h-7"
            @click="filter = 'SEMUA'"
          >
            Semua
          </Button>
          <Button
            size="sm"
            :variant="filter === 'BELUM_DIBACA' ? 'outline' : 'ghost'"
            class="h-7"
            @click="filter = 'BELUM_DIBACA'"
          >
            Belum Dibaca
          </Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-1">
        <template v-if="isLoadingNotifications && notifications.length === 0">
          <div v-for="i in 4" :key="i" class="flex gap-3 p-3">
            <Skeleton class="size-8 rounded-full" />
            <div class="flex-1 space-y-2">
              <Skeleton class="h-4 w-32" />
              <Skeleton class="h-4 w-full" />
            </div>
          </div>
        </template>
        <template v-else>
          <NotificationItem v-for="n in filtered" :key="n.id" :notification="n" @select="handleSelect" />
          <div v-if="filtered.length === 0" class="text-muted-foreground flex flex-col items-center gap-2 py-12 text-sm">
            <BellOff class="size-8" />
            {{ filter === 'BELUM_DIBACA' ? 'Tiada notifikasi belum dibaca.' : 'Tiada notifikasi.' }}
          </div>
        </template>
      </CardContent>
    </Card>
  </div>
</template>
