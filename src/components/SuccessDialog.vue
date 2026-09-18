<script setup lang="ts">
import { CheckCircle2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

// Pengesahan kejayaan tindakan aliran kerja — menggantikan toast kejayaan. `close` dipancarkan sekali
// sama ada pengguna klik butang, butang X, Escape atau klik di luar dialog.
const open = defineModel<boolean>('open', { required: true })
const props = withDefaults(defineProps<{ title: string; message: string; buttonLabel?: string }>(), {
  buttonLabel: 'OK',
})
const emit = defineEmits<{ close: [] }>()

function handleOpenChange(value: boolean) {
  open.value = value
  if (!value) emit('close')
}
</script>

<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="items-center text-center">
        <div class="flex size-12 items-center justify-center rounded-full bg-green-500/10 text-green-600">
          <CheckCircle2 class="size-6" />
        </div>
        <DialogTitle>{{ props.title }}</DialogTitle>
        <DialogDescription>{{ props.message }}</DialogDescription>
      </DialogHeader>
      <DialogFooter class="sm:justify-center">
        <Button @click="handleOpenChange(false)">{{ props.buttonLabel }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
