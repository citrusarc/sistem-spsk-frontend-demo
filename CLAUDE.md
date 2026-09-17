# CLAUDE.md — Frontend SPSK (Vue 3 + shadcn-vue)

Frontend untuk sistem SPSK. Backend Express, kontrak API di `API.md`.

## Peraturan Ketat

- **Jangan** buat chart/graf (tiada Chart.js, Recharts, dsb.). Dashboard guna kad/angka ringkas sahaja.
- **Jangan** tulis custom CSS. Guna komponen & utiliti shadcn-vue/Tailwind sedia ada sahaja.
- **Jangan** cipta tema baharu. Tema ialah token shadcn-vue dalam `src/style.css` dengan palet Sistem Aduan Integriti (navy `#1E3A5F`, emas cerah `#E8B546`, latar `#F6F5F2`) — guna token sedia ada (`primary`, `sidebar`, `sidebar-primary`, dsb.), jangan tambah warna hex baharu.
- **Jangan** redesign skrin yang sudah siap dibina. Perubahan pada skrin sedia ada hendaklah minimum dan ikut corak/struktur yang sudah ada.
- **Jangan** tambah skrin/laluan (route) baharu di luar apa yang diminta atau yang disenaraikan dalam `API.md`.
- Semua teks UI (label, butang, mesej, placeholder, tajuk) **mesti dalam Bahasa Melayu**. Nama medan (field) dalam payload API kekal seperti `API.md` (jangan terjemah nama medan).

## Peranan (`peranan`)

`ADMIN` | `PT_KONTRAK` | `PUU` | `PEGAWAI_PENYEMAK` — akses skrin/data ikut jadual endpoint dalam `API.md` §1. `ADMIN` hanya urus pengguna (tiada akses kontrak/dashboard).

## Warna Badge — `status_semasa`

| Status | Warna Badge |
| --- | --- |
| `TERIMA` | Kelabu (default/secondary) |
| `DALAM_TINDAKAN` | Biru |
| `DALAM_SEMAKAN` | Ungu |
| `SELESAI` | Hijau |

## Warna Badge — `status_warna` (amaran hari bekerja)

| `status_warna` | Warna Badge | Julat Hari Bekerja |
| --- | --- | --- |
| `HIJAU` | Hijau | 1–14 hari |
| `KUNING` | Kuning | 15–24 hari |
| `JINGGA` | Jingga/Oren | 25–27 hari |
| `MERAH` | Merah | 28+ hari |
| `null` | (tiada badge) | Kontrak `SELESAI` |

Guna varian badge shadcn-vue yang sepadan (`default`/`secondary`/`destructive`/`outline` + kelas warna Tailwind standard sahaja, contoh `bg-green-500`, `bg-yellow-500`, `bg-orange-500`, `bg-red-500`, `bg-blue-500`, `bg-purple-500`) — bukan warna custom baharu.

## Warna Badge — `tahap_keutamaan`

| Nilai | Warna Badge |
| --- | --- |
| `TINGGI` | Merah/destructive |
| `RENDAH` | Kelabu (default/secondary) |

## Rujukan

- Kontrak API penuh: `API.md`.
- Objek data, endpoint, dan medan yang dikira runtime (`hari_bekerja`, `status_warna`) — rujuk `API.md` §2.
- Isu terbuka (belum disepakati backend/frontend) — rujuk `API.md` §3, jangan andaikan tafsiran sendiri.
