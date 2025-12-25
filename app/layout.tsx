import './globals.css';

export const metadata = {
  title: 'Pooly’s Mood',
  description: 'Design & AI Experience'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="bg-gray-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}