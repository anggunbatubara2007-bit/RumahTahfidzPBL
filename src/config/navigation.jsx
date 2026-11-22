
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';

// NAV[role] = daftar grup menu.
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
                { label: 'Santri Bimbingan', title: 'Santri Bimbingan', path: '/ustadz/santri', icon: PeopleIcon },
            ],
        },
    ],

    santri: [
        {
            items: [
                { label: 'Dashboard', title: 'Dashboard Santri', path: '/santri/profil', icon: DashboardIcon },
                { label: 'Hafalan dan Target', title: 'Hafalan dan Target', path: '/santri/hafalan', icon: MenuBookIcon },
                { label: 'SPP dan Pembayaran', title: 'SPP dan Pembayaran', path: '/santri/spp', icon: PaymentsIcon },
            ],
        },
    ],
};

export const flatNav = (role) => NAV[role].flatMap((g) => g.items);
