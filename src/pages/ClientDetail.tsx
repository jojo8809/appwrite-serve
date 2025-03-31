import React from 'react';
import { useParams } from 'react-router-dom';
import ClientDetail from '../components/ClientDetail';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Add proper TypeScript interface
interface ClientDetailProps {
  onUpdateClient: (id: string, data: any) => Promise<any>;
  onDeleteClient: (id: string) => Promise<void>;
}

export default function ClientDetails({ onUpdateClient, onDeleteClient }: ClientDetailProps) {
  const { id } = useParams<{id: string}>();
  const navigate = useNavigate();
  const [client, setClient] = React.useState<any>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!id) {
      setError("Client ID is missing");
      setLoading(false);
      return;
    }

    const loadClient = async () => {
      try {
        setLoading(true);
        const data = await api.getClient(id);
        setClient(data);
      } catch (err: any) {
        console.error("Error loading client:", err);
        setError(err.message || "Failed to load client details.");
      } finally {
        setLoading(false);
      }
    };

    loadClient();
  }, [id]);

  const handleUpdate = async (updatedData: any) => {
    if (!id) {
      throw new Error("Client ID is missing");
    }
    
    try {
      const updated = await onUpdateClient(id, updatedData);
      setClient(updated);
      return updated;
    } catch (err: any) {
      console.error("Error updating client:", err);
      throw new Error(err.message || "Failed to update client");
    }
  };

  const handleDelete = async () => {
    if (!id) {
      throw new Error("Client ID is missing");
    }
    
    try {
      await onDeleteClient(id);
      navigate('/clients');
    } catch (err: any) {
      console.error("Error deleting client:", err);
      throw new Error(err.message || "Failed to delete client");
    }
  };

  if (loading) return <div>Loading client details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <ClientDetail 
      client={client} 
      onUpdate={handleUpdate} 
      onDelete={handleDelete}
      onBack={() => navigate('/clients')}
    />
  );
}
