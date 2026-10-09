import { createTheme } from "@mui/material/styles";

// Warna tambahan untuk sidebar dan panel (di luar tema MUI)
export const palette = {
    pineTeal: "#064E3B",
    emeraldDeep: "#065F46",
    turfGreen: "#047857",
    shamrock: "#059669",
    mintLeaf: "#10B981",
    emerald: "#34D399",
    aquamarine: "#6EE7B7",
    aquamarine2: "#A7F3D0",
    frostedMint: "#D1FAE5",
    honeydew: "#ECFDF5",
};

const theme = createTheme({
    palette: {
        primary: {
            main: "#047857",
            dark: "#065F46",
            light: "#34D399",
            contrastText: "#FFFFFF",
        },
        secondary: {
            main: "#10B981",
        },
        success: {
            main: "#059669",
        },
        background: {
            default: "#ECFDF5",
            paper: "#FFFFFF",
        },
        error: {
            main: "#D32F2F",
        },
        text: {
            primary: "#064E3B",
            secondary: "#047857",
        },
        divider: "#D1FAE5",
    },
    typography: {
        fontFamily: "Arial, sans-serif",
        button: {
            textTransform: "none",
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 10,
    },
    components: {
        MuiCard: {
            defaultProps: { variant: "outlined" },
            styleOverrides: { root: { borderColor: "#D1FAE5" } },
        },
        MuiButton: {
            defaultProps: { disableElevation: true },
        },
        // Header SEMUA tabel: warna sama dengan header halaman (Emerald Deep)
        MuiTableCell: {
            styleOverrides: {
                head: {
                    backgroundColor: "#065F46",
                    color: "#FFFFFF",
                    fontWeight: 700,
                },
            },
        },
    },
});

export default theme;