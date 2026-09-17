<script setup lang="ts">
import { computed } from 'vue'
import { DropdownMenuItem, useForwardProps } from 'reka-ui'
import type { DropdownMenuItemProps } from 'reka-ui'
import { cn } from '@/lib/utils'

const props = withDefaults(
  defineProps<DropdownMenuItemProps & { class?: string; inset?: boolean; variant?: 'default' | 'destructive' }>(),
  { variant: 'default' },
)

const delegatedProps = computed(() => {
  const { class: _, inset: __, variant: ___, ...delegated } = props
  return delegated
})
const forwarded = useForwardProps(delegatedProps)
</script>

<template>
  <DropdownMenuItem
    v-bind="forwarded"
    :data-inset="inset ? '' : undefined"
    :data-variant="variant"
    :class="
      cn(
        'focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-[variant=destructive]:focus:text-destructive [&_svg:not([class*=\'text-\'])]:text-muted-foreground relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
        props.class,
      )
    "
  >
    <slot />
  </DropdownMenuItem>
</template>
