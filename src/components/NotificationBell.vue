<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Bell, BellOff } from '@lucide/vue'
import NotificationItem from '@/components/NotificationItem.vue'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import type { Notification } from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { destinasiNotifikasi, markAsRead, notifications, unreadCount } from '@/lib/notifications'

const MAX_ITEMS = 5

const router = useRouter()
const isOpen = ref(false)
const recent = computed(() => notifications.value.slice(0, MAX_ITEMS))

async function handleSelect(n: Notification) {
  try {
    await markAsRead(n)
  } catch (err) {
    toast.error(err instanceof Error ? err.message : 'Gagal menandakan notifikasi sebagai dibaca.')
  }
  isOpen.value = false
  router.push(destinasiNotifikasi(n, currentUser.value?.peranan))
}

function viewAll() {
  isOpen.value = false
  router.push({ name: 'notifikasi' })
}
</script>

<template>
  <Popover v-model:open="isOpen">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" class="relative" aria-label="Notifikasi">
        <Bell class="size-5" />
        <span
          v-if="unreadCount > 0"
          class="bg-destructive absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-xs leading-none font-semibold text-white"
        >
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </span>
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-80 p-0 sm:w-96">
      <div class="flex items-center justify-between px-4 py-3">
        <p class="text-sm font-semibold">Notifikasi</p>
        <span v-if="unreadCount > 0" class="text-muted-foreground text-xs">{{ unreadCount }} belum dibaca</span>
      </div>
      <Separator />
      <div class="max-h-96 space-y-1 overflow-y-auto p-2">
        <NotificationItem v-for="n in recent" :key="n.id" :notification="n" compact @select="handleSelect" />
        <div v-if="recent.length === 0" class="text-muted-foreground flex flex-col items-center gap-2 py-8 text-sm">
          <BellOff class="size-6" />
          Tiada notifikasi.
        </div>
      </div>
      <Separator />
      <div class="p-2">
        <Button variant="ghost" size="sm" class="w-full" @click="viewAll">Lihat semua notifikasi</Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
