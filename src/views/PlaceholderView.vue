<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <div>
    <h1 class="text-2xl font-semibold">{{ title }}</h1>
    <p class="text-muted-foreground mt-2 text-sm">Skrin ini akan dibina.</p>
  </div>
</template>
