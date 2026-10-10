import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import PersonIcon from '@mui/icons-material/Person';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import PaymentsIcon from '@mui/icons-material/Payments';
import HistoryIcon from '@mui/icons-material/History';

// NAV[role] = daftar grup menu. `title` dipakai sebagai judul header halaman.
export const NAV = {
    admin: [
        {
            heading: 'Menu Utama',
            items: [
                { label: 'Dashboard', title: 'Dashboard Admin', path: '/admin/dashboard', icon: DashboardIcon },
                { label: 'Data Santri', title: 'Data Santri', path: '/admin/santri', icon: PeopleIcon },
                { label: 'Data Ustadz', title: 'Data Ustadz', path: '/admin/ustadz', icon: SchoolIcon },
                { label: 'Kelompok Tahfidz', title: 'Kelompok Tahfidz', path: '/admin/kelompok', icon: GroupsIcon },
                { label: 'Hafalan, target & beasiswa', title: 'Hafalan, Target & Beasiswa', path: '/admin/hafalan', icon: MenuBookIcon },
            ],
        },
        {
            heading: 'Keuangan',
            items: [
                { label: 'Data SPP', title: 'Data SPP', path: '/admin/spp', icon: ReceiptLongIcon },
                { label: 'Verifikasi pembayaran', title: 'Verifikasi Pembayaran', path: '/admin/verifikasi', icon: VerifiedIcon },
                { label: 'Kelola keuangan', title: 'Kelola Keuangan', path: '/admin/keuangan', icon: AccountBalanceWalletIcon },
            ],
        },
    ],
    ustadz: [
        {
            items: [
                { label: 'Dashboard', title: 'Dashboard Ustadz', path: '/ustadz/dashboard', icon: DashboardIcon },
                { label: 'Santri Bimbingan', title: 'Santri Bimbingan', path: '/ustadz/santri', icon: PeopleIcon }, // FR-12
            ],
        },
    ],
    santri: [
        {
            items: [
                { label: 'Profil', title: 'Profil Saya', path: '/santri/profil', icon: PersonIcon },
                { label: 'Hafalan Saya', title: 'Hafalan Saya', path: '/santri/hafalan', icon: MenuBookIcon },
                { label: 'Target & Beasiswa', title: 'Target & Beasiswa', path: '/santri/target', icon: TrackChangesIcon },
                { label: 'Tagihan SPP', title: 'Tagihan SPP', path: '/santri/spp', icon: PaymentsIcon },
                { label: 'Riwayat Pembayaran', title: 'Riwayat Pembayaran', path: '/santri/riwayat', icon: HistoryIcon },
            ],
        },
    ],
};

export const flatNav = (role) => NAV[role].flatMap((g) => g.items);