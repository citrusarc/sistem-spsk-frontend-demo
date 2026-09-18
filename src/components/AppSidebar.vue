<script setup lang="ts">
import { computed, type Component } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  CheckCircle,
  ChevronsUpDown,
  ClipboardCheck,
  FileCheck2,
  FilePlus,
  FileText,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Users,
} from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { currentUser, logout } from '@/lib/auth'
import { PERANAN_LABEL } from '@/lib/status'
import type { Peranan } from '@/lib/api'
import { cn } from '@/lib/utils'

interface MenuItem {
  to: { name: string }
  label: string
  icon: Component
  roles?: Peranan[]
  // Label/ikon berbeza bagi peranan tertentu (laluan kekal sama).
  override?: Partial<Record<Peranan, { label: string; icon: Component }>>
  // Laluan lain yang turut menandakan menu ini aktif (cth. halaman butiran).
  activeFor?: string[]
}

const KONTRAK_ROLES: Peranan[] = ['PT_KONTRAK', 'PUU', 'PEGAWAI_PENYEMAK']

// Akses menu ikut peranan — rujuk API.md §1 (jadual endpoint & akses).
const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Utama',
    items: [
      { to: { name: 'dashboard' }, label: 'Dashboard', icon: LayoutDashboard, roles: KONTRAK_ROLES },
      {
        to: { name: 'kontrak' },
        label: 'Senarai Kontrak',
        icon: FileText,
        roles: KONTRAK_ROLES,
        override: { PEGAWAI_PENYEMAK: { label: 'Kontrak Selesai Disemak', icon: ClipboardCheck } },
        activeFor: ['kontrak-butiran'],
      },
    ],
  },
  {
    label: 'Tindakan',
    items: [
      { to: { name: 'kontrak-pengesahan' }, label: 'Pengesahan Kontrak', icon: CheckCircle, roles: ['PUU'] },
      { to: { name: 'tugasan-saya' }, label: 'Tugasan Saya', icon: ListChecks, roles: ['PEGAWAI_PENYEMAK'] },
      { to: { name: 'kontrak-baharu' }, label: 'Daftar Kontrak Baharu', icon: FilePlus, roles: ['PT_KONTRAK'] },
    ],
  },
  {
    label: 'Pentadbiran',
    items: [{ to: { name: 'pengguna' }, label: 'Pengurusan Pengguna', icon: Users, roles: ['ADMIN'] }],
  },
]

const route = useRoute()
const router = useRouter()

const visibleGroups = computed(() => {
  const peranan = currentUser.value?.peranan
  return menuGroups
    .map((group) => ({
      ...group,
      items: group.items
        .filter((item) => !item.roles || (peranan && item.roles.includes(peranan)))
        .map((item) => ({ ...item, ...(peranan && item.override?.[peranan]) })),
    }))
    .filter((group) => group.items.length > 0)
})

const initials = computed(() =>
  (currentUser.value?.nama_penuh ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join(''),
)

function handleLogout() {
  logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="bg-sidebar text-sidebar-foreground flex h-full flex-col">
    <div class="flex h-14 items-center gap-3 px-4">
      <div class="bg-sidebar-primary text-sidebar-primary-foreground flex size-8 items-center justify-center rounded-lg">
        <FileCheck2 class="size-4" />
      </div>
      <div class="leading-tight">
        <p class="text-sm font-semibold">SPSK</p>
        <p class="text-sidebar-foreground/60 text-xs">Pemantauan Semakan Kontrak</p>
      </div>
    </div>

    <nav class="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      <div v-for="group in visibleGroups" :key="group.label" class="space-y-1">
        <p class="text-sidebar-foreground/50 px-3 pb-1 text-xs font-medium">{{ group.label }}</p>
        <RouterLink
          v-for="item in group.items"
          :key="item.label"
          :to="item.to"
          :class="
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              route.name === item.to.name || item.activeFor?.includes(String(route.name))
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium [&>svg]:text-sidebar-primary'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )
          "
        >
          <component :is="item.icon" class="size-4" />
          <span class="flex-1">{{ item.label }}</span>
        </RouterLink>
      </div>
    </nav>

    <div class="border-sidebar-border border-t p-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          class="hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors outline-none"
        >
          <Avatar class="rounded-lg">
            <AvatarFallback class="bg-sidebar-primary text-sidebar-primary-foreground rounded-lg text-xs font-semibold">
              {{ initials }}
            </AvatarFallback>
          </Avatar>
          <span class="min-w-0 flex-1 leading-tight">
            <span class="block truncate text-sm font-medium">{{ currentUser?.nama_penuh }}</span>
            <span class="text-sidebar-foreground/60 block truncate text-xs">
              {{ currentUser ? PERANAN_LABEL[currentUser.peranan] : '' }}
            </span>
          </span>
          <ChevronsUpDown class="text-sidebar-foreground/60 size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" class="w-60">
          <DropdownMenuLabel class="font-normal">
            <p class="truncate text-sm font-medium">{{ currentUser?.nama_penuh }}</p>
            <p class="text-muted-foreground truncate text-xs">{{ currentUser?.email }}</p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem @select="router.push({ name: 'kata-laluan' })">
            <KeyRound />
            Tukar Kata Laluan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" @select="handleLogout">
            <LogOut />
            Log Keluar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>
