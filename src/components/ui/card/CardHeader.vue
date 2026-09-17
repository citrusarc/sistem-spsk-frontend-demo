<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <div :class="cn('grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6', props.class)">
    <slot />
  </div>
</template>
