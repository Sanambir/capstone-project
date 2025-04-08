// theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: {
      default: '#f4f4f4',
      paper: '#fff'
    },
    text: {
      primary: '#333',
      secondary: '#555'
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
  spacing: 8,
});

export default theme;
