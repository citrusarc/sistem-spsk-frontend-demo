<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{ class?: string }>()
</script>

<template>
  <td :class="cn('p-2 align-middle whitespace-nowrap', props.class)">
    <slot />
  </td>
</template>
