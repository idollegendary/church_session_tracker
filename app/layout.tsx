import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'Session Tracker',
  description: 'Track session time'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="min-h-screen p-6" style={{ position: 'relative' }}>
          <div className="app-container">{children}</div>
        </main>
      </body>
    </html>
  );
}
