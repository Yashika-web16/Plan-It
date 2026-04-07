import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './AuthContext.tsx';
import { LocationProvider } from './LocationContext.tsx';
import { ThemeProvider } from './ThemeContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LocationProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </LocationProvider>
    </AuthProvider>
  </StrictMode>,
);
