import React, { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";  // Change path to where your components actually are
import NewServe from "./pages/NewServe";
import DataExport from "./pages/DataExport";
import Clients from "./pages/Clients";
import History from "./pages/History";
import Layout from "./components/Layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    }
  }
});

function App() {
  const [clients, setClients] = useState([]);
  const [serves, setServes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/.netlify/functions/api/clients');
        const data = await response.json();
        setClients(data);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    
    fetchData();
  }, []);

  useEffect(() => {
    const fetchServes = async () => {
      try {
        const response = await fetch('/.netlify/functions/api/serves');
        const data = await response.json();
        setServes(data);
      } catch (error) {
        console.error("Error fetching serves:", error);
      }
    };
    
    fetchServes();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard clients={clients} serves={serves} />} />
            <Route path="new-serve" element={<NewServe clients={clients} serves={serves} setServes={setServes} />} />
            <Route path="export" element={<DataExport clients={clients} serves={serves} />} />
            <Route path="clients" element={<Clients clients={clients} setClients={setClients} />} />
            <Route path="history" element={<History clients={clients} serves={serves} setServes={setServes} />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;