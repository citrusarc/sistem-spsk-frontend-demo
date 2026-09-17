<script setup lang="ts">
import { computed } from 'vue'
import type { Notification } from '@/lib/api'
import { formatMasaRelatif, formatTarikhMasa, jenisNotifikasiMeta } from '@/lib/notifications'
import { cn } from '@/lib/utils'

const props = defineProps<{ notification: Notification; compact?: boolean }>()
const emit = defineEmits<{ select: [notification: Notification] }>()

const meta = computed(() => jenisNotifikasiMeta(props.notification.jenis_notifikasi))
</script>

<template>
  <button
    type="button"
    :class="
      cn(
        'hover:bg-accent flex w-full items-start gap-3 rounded-md p-3 text-left transition-colors',
        !notification.telah_dibaca && 'bg-accent/50',
      )
    "
    @click="emit('select', notification)"
  >
    <span :class="cn('flex size-8 shrink-0 items-center justify-center rounded-full', meta.class)">
      <component :is="meta.icon" class="size-4" />
    </span>
    <span class="min-w-0 flex-1 space-y-1">
      <span class="flex items-center gap-2">
        <span :class="cn('text-sm', notification.telah_dibaca ? 'font-medium' : 'font-semibold')">{{ meta.label }}</span>
        <span v-if="!notification.telah_dibaca" class="size-2 shrink-0 rounded-full bg-blue-500">
          <span class="sr-only">Belum dibaca</span>
        </span>
      </span>
      <span :class="cn('text-muted-foreground block text-sm', compact && 'line-clamp-2')">
        {{ notification.mesej }}
      </span>
      <span class="text-muted-foreground block text-xs" :title="formatTarikhMasa(notification.created_at)">
        {{ formatMasaRelatif(notification.created_at) }}
      </span>
    </span>
  </button>
</template>
