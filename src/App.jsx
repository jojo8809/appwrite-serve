import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Header from './components/Header';
import ClientList from './components/ClientList';
import ClientDetails from './components/ClientDetails';
import NewClientForm from './components/NewClientForm';
import Dashboard from './components/Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import api from './services/api';

// Create a client
const queryClient = new QueryClient();

function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await api.getClients();
      setClients(data);
      setError(null);
    } catch (err) {
      console.error("Error loading clients:", err);
      setError("Failed to load clients. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Header />
        <Container className="mt-4">
          {error && <div className="alert alert-danger">{error}</div>}
          <Routes>
            <Route path="/" element={<Dashboard clients={clients} loading={loading} onRefresh={loadClients} />} />
            <Route path="/clients" element={<ClientList clients={clients} loading={loading} />} />
            <Route path="/clients/new" element={<NewClientForm />} />
            <Route path="/clients/:id" element={<ClientDetails />} />
          </Routes>
        </Container>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
