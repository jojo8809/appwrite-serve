
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { appwrite } from './lib/appwrite';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Simple migration component to help users move from Supabase to Appwrite
const MigrationComponent = () => {
  const runMigration = async () => {
    try {
      document.getElementById('migration-status')!.textContent = 'Migration in progress...';
      
      const result = await appwrite.migrateSupabaseToAppwrite();
      
      if (result.success) {
        document.getElementById('migration-status')!.textContent = 'Migration completed successfully! Redirecting to home page...';
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        document.getElementById('migration-status')!.textContent = `Migration failed: ${result.message}`;
      }
    } catch (error) {
      console.error('Migration error:', error);
      document.getElementById('migration-status')!.textContent = `Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Supabase to Appwrite Migration Tool</h1>
      <p style={{ marginBottom: '1rem' }}>This tool will migrate your data from Supabase to Appwrite.</p>
      <p style={{ marginBottom: '1rem' }}>Make sure you have set up the following Appwrite collections:</p>
      <ul style={{ marginBottom: '1rem', listStyleType: 'disc', paddingLeft: '1.5rem' }}>
        <li>clients</li>
        <li>serve_attempts</li>
        <li>client_cases</li>
        <li>client_documents</li>
      </ul>
      <p style={{ marginBottom: '1rem' }}>And created a storage bucket named 'client-documents'</p>
      <button 
        onClick={runMigration}
        style={{ 
          backgroundColor: '#3b82f6', 
          color: 'white', 
          padding: '0.5rem 1rem', 
          borderRadius: '0.25rem',
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Start Migration
      </button>
      <p id="migration-status" style={{ marginTop: '1rem', fontWeight: 'bold' }}></p>
      <p style={{ marginTop: '1rem' }}>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Back to Home</a>
      </p>
    </div>
  );
};

// Render with migration route
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/migration" element={<MigrationComponent />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
