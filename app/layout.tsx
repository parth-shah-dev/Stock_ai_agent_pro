import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockAI Pro — AI-Powered Market Intelligence',
  description: 'AI-based stock market advisor for stocks, IPOs, crypto, forex and more. Get real-time analysis, risk scores, and AI-powered investment suggestions.',
  keywords: 'stock market, AI analysis, NSE, BSE, IPO, crypto, forex, investment advisor',
  openGraph: {
    title: 'StockAI Pro',
    description: 'AI-Powered Market Intelligence Platform',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-grid min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
