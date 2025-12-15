import './globals.css';

export const metadata = {
  title: 'WebSocket Ads System',
  description: 'Sistema de anuncios en tiempo real',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

