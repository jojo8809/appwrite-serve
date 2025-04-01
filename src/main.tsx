
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { appwrite } from './lib/appwrite';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Button } from './components/ui/button';
import { toast } from 'sonner';

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

  const clearLocalStorage = () => {
    try {
      // Remove Supabase-related data
      localStorage.removeItem("serve-tracker-clients");
      localStorage.removeItem("serve-tracker-serves");
      
      // Also clear any other app data
      localStorage.removeItem("supabase.auth.token");
      
      document.getElementById('reset-status')!.textContent = 'Local storage cleared successfully! Redirecting to home page...';
      
      toast.success("Local storage cleared", {
        description: "The application will now use Appwrite exclusively"
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (error) {
      console.error('Reset error:', error);
      document.getElementById('reset-status')!.textContent = `Reset error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Supabase to Appwrite Migration Tool</h1>
      
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Data Migration</h2>
        <p style={{ marginBottom: '1rem' }}>This tool will migrate your data from Supabase to Appwrite.</p>
        <p style={{ marginBottom: '1rem' }}>Make sure you have set up the following Appwrite collections:</p>
        <ul style={{ marginBottom: '1rem', listStyleType: 'disc', paddingLeft: '1.5rem' }}>
          <li>clients</li>
          <li>serve_attempts</li>
          <li>client_cases</li>
          <li>client_documents</li>
        </ul>
        <p style={{ marginBottom: '1rem' }}>And created a storage bucket named 'client-documents'</p>
        <p style={{ marginBottom: '1rem' }}>
          <strong>Note:</strong> For datetime fields without default values, the application will automatically set the current timestamp when creating records.
        </p>
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
      </div>
      
      <div style={{ border: '1px solid #e2e8f0', borderRadius: '0.5rem', padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Reset Local Storage</h2>
        <p style={{ marginBottom: '1rem' }}>If you're still seeing Supabase data or want to start fresh with Appwrite, clear the local storage:</p>
        <button 
          onClick={clearLocalStorage}
          style={{ 
            backgroundColor: '#ef4444', 
            color: 'white', 
            padding: '0.5rem 1rem', 
            borderRadius: '0.25rem',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Clear Local Storage
        </button>
        <p id="reset-status" style={{ marginTop: '1rem', fontWeight: 'bold' }}></p>
      </div>
      
      <p style={{ marginTop: '1rem' }}>
        <a href="/" style={{ color: '#3b82f6', textDecoration: 'underline' }}>Back to Home</a>
      </p>
    </div>
  );
};

// Create a single root element for all of the app
const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  
  // Render with single Router instance
  root.render(
    <BrowserRouter>
      <Routes>
        <Route path="/migration" element={<MigrationComponent />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
} else {
  console.error("Root element not found");
}
