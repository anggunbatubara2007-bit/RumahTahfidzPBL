import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader,
    Typography, IconButton, Avatar, Paper, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useAuth } from '../pages/auth';
import { NAV, flatNav } from '../config/navigation';
import { palette } from '../theme/theme';

const WIDTH = 260;

// Ukuran menu mengikuti tinggi jendela (vh) supaya semua menu selalu muat tanpa scroll.
const itemSx = {
    mx: 1.5,
    mb: 'clamp(0px, 0.3vh, 2px)',
    py: 'clamp(2px, 0.9vh, 9px)',
    borderRadius: 2,
    color: palette.frostedMint,
    '&.active': { bgcolor: palette.shamrock, color: '#fff' },
    '&:hover': { bgcolor: palette.emeraldDeep },
};

const iconSx = {
    color: 'inherit',
    minWidth: 40,
    '& svg': { fontSize: 'clamp(17px, 2.8vh, 24px)' },
};

const textProps = {
    fontSize: 'clamp(12px, 1.8vh, 14px)',
    lineHeight: 1.3,
};

const initials = (name = '') =>
    name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export default function AppLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [open, setOpen] = useState(false);

    const current = flatNav(user.role).find((i) => pathname.startsWith(i.path));

    // Dashboard ustadz: judul berupa salam, subjudul berisi kelompok
    const isUstadzHome = user.role === 'ustadz' && pathname.startsWith('/ustadz/dashboard');
    const title = isUstadzHome ? `Assalamualaikum, ${user.nama}` : current?.title ?? '';
    const subtitle =
        isUstadzHome && user.kelompok
            ? `Kelompok ${user.kelompok}` +
              (user.jumlahSantri != null ? `. ${user.jumlahSantri} santri bimbingan` : '')
            : '';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menu = (
        <Box
            sx={{
                width: WIDTH,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                py: 'clamp(4px, 1.2vh, 14px)',
            }}
        >
            {/* Logo */}
            <Box
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 3,
                    pb: 'clamp(2px, 1vh, 12px)', flexShrink: 0,
                }}
            >
                <MenuBookIcon sx={{ color: palette.aquamarine }} />
                <Typography variant="h6" sx={{ color: '#fff', fontSize: 'clamp(15px, 2.4vh, 20px)' }}>
                    RSQ Tahfidz
                </Typography>
            </Box>

            {/* Daftar menu */}
            <Box sx={{ flexShrink: 0 }}>
                {NAV[user.role].map((group, i) => (
                    <List
                        key={group.heading ?? i}
                        disablePadding
                        subheader={
                            group.heading && (
                                <ListSubheader
                                    disableSticky
                                    sx={{
                                        bgcolor: 'transparent',
                                        color: palette.aquamarine2,
                                        fontWeight: 700,
                                        fontSize: 'clamp(11px, 1.7vh, 14px)',
                                        lineHeight: 'clamp(18px, 3.4vh, 30px)',
                                        mt: i ? 'clamp(2px, 0.8vh, 10px)' : 0,
                                    }}
                                >
                                    {group.heading}
                                </ListSubheader>
                            )
                        }
                    >
                        {group.items.map(({ label, path, icon: Icon }) => (
                            <ListItemButton
                                key={path}
                                component={NavLink}
                                to={path}
                                onClick={() => setOpen(false)}
                                sx={itemSx}
                            >
                                <ListItemIcon sx={iconSx}><Icon /></ListItemIcon>
                                <ListItemText
                                    primary={label}
                                    slotProps={{ primary: textProps }}
                                    sx={{ my: 0 }}
                                />
                            </ListItemButton>
                        ))}
                    </List>
                ))}
            </Box>

            {/* Keluar */}
            <Box sx={{ mt: 'auto', pt: 'clamp(2px, 1vh, 10px)', flexShrink: 0 }}>
                <ListItemButton onClick={handleLogout} sx={itemSx}>
                    <ListItemIcon sx={iconSx}><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Keluar" slotProps={{ primary: textProps }} sx={{ my: 0 }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <Drawer
                variant={isDesktop ? 'permanent' : 'temporary'}
                open={isDesktop || open}
                onClose={() => setOpen(false)}
                sx={{
                    width: isDesktop ? WIDTH : 0,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: WIDTH,
                        border: 0,
                        bgcolor: palette.pineTeal,
                        color: palette.honeydew,
                        overflow: 'hidden',
                    },
                }}
            >
                {menu}
            </Drawer>

            <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Header hijau tua */}
                <Paper
                    square
                    elevation={0}
                    sx={{
                        position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center',
                        gap: 1, px: { xs: 2, md: 4 }, py: 2.5,
                        bgcolor: palette.emeraldDeep, color: '#fff',
                    }}
                >
                    {!isDesktop && (
                        <IconButton
                            edge="start"
                            onClick={() => setOpen(true)}
                            aria-label="Buka menu"
                            sx={{ color: '#fff' }}
                        >
                            <MenuIcon />
                        </IconButton>
                    )}

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h5" component="h1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" sx={{ color: palette.frostedMint }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    <Avatar
                        title={user.nama}
                        sx={{
                            bgcolor: '#fff', color: palette.pineTeal,
                            width: 44, height: 44, fontSize: 15, fontWeight: 700,
                        }}
                    >
                        {initials(user.nama)}
                    </Avatar>
                </Paper>

                <Box component="main" sx={{ p: { xs: 2, md: 4 } }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
}