<script setup lang="ts">
import { cn } from '@/lib/utils'

const model = defineModel<string>()

const props = defineProps<{ class?: string }>()
</script>

<template>
  <select
    v-model="model"
    :class="
      cn(
        'border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        props.class,
      )
    "
  >
    <slot />
  </select>
</template>
