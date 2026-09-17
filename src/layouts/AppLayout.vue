<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ChevronRight, Menu } from '@lucide/vue'
import AppSidebar from '@/components/AppSidebar.vue'
import NotificationBell from '@/components/NotificationBell.vue'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { startNotificationPolling, stopNotificationPolling } from '@/lib/notifications'

const route = useRoute()
const router = useRouter()
const isMobileMenuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    isMobileMenuOpen.value = false
  },
)

onMounted(() => startNotificationPolling(() => router.push({ name: 'notifikasi' })))
onUnmounted(stopNotificationPolling)
</script>

<template>
  <div class="bg-background flex min-h-svh">
    <aside class="border-sidebar-border sticky top-0 hidden h-svh w-64 shrink-0 border-r md:block">
      <AppSidebar />
    </aside>

    <Sheet v-model:open="isMobileMenuOpen">
      <SheetContent side="left" class="bg-sidebar text-sidebar-foreground w-72 gap-0 border-none p-0">
        <SheetTitle class="sr-only">Menu navigasi</SheetTitle>
        <SheetDescription class="sr-only">Navigasi utama SPSK</SheetDescription>
        <AppSidebar />
      </SheetContent>
    </Sheet>

    <div class="flex min-w-0 flex-1 flex-col">
      <header
        class="bg-background/95 supports-backdrop-filter:bg-background/80 sticky top-0 z-30 flex h-14 items-center gap-2 border-b px-4 backdrop-blur md:px-6"
      >
        <Button variant="ghost" size="icon" class="md:hidden" aria-label="Buka menu" @click="isMobileMenuOpen = true">
          <Menu class="size-5" />
        </Button>
        <nav class="text-muted-foreground flex min-w-0 items-center gap-1.5 text-sm">
          <span class="hidden sm:inline">SPSK</span>
          <ChevronRight class="hidden size-4 sm:inline" />
          <span class="text-foreground truncate font-medium">{{ route.meta.title }}</span>
        </nav>
        <div class="ml-auto flex items-center gap-1">
          <NotificationBell />
        </div>
      </header>

      <main class="flex-1 p-4 md:p-6 lg:p-8">
        <RouterView />
      </main>
    </div>
  </div>
</template>
