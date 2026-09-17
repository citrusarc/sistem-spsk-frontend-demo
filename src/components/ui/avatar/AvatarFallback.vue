<script setup lang="ts">
import { AvatarFallback } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <AvatarFallback :class="cn('bg-muted flex size-full items-center justify-center rounded-full', props.class)">
    <slot />
  </AvatarFallback>
</template>
