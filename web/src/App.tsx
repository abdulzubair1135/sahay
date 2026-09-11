import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GovernmentDashboard } from './pages/GovernmentDashboard';
import { RescueDashboard } from './pages/RescueDashboard';
import { HospitalDashboard } from './pages/HospitalDashboard';
import { NGODashboard } from './pages/NGODashboard';
import { CitizenReportView } from './pages/CitizenReportView';
import { AdminDashboard } from './pages/AdminDashboard';
import { getSocket } from './services/socket';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('gov');
  const [isConnected, setIsConnected] = useState(false);
  const [activeSOSCount, setActiveSOSCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Initial count
    api.getSOSStats().then((res) => {
      if (res.success && res.data) {
        setActiveSOSCount(res.data.totalActive);
      }
    });

    socket.on('sos:new', () => {
      setActiveSOSCount((prev) => prev + 1);
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sos:new');
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isConnected={isConnected}
        activeSOSCount={activeSOSCount}
      />

      <main className="flex-1">
        {currentTab === 'gov' && <GovernmentDashboard />}
        {currentTab === 'rescue' && <RescueDashboard />}
        {currentTab === 'hospital' && <HospitalDashboard />}
        {currentTab === 'ngo' && <NGODashboard />}
        {currentTab === 'reports' && <CitizenReportView />}
        {currentTab === 'admin' && <AdminDashboard />}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-3 px-6 text-center text-xs border-t border-slate-800">
        AapdaSetu Emergency Mesh Ecosystem &copy; 2026 • Real Data Operation • Ble Mesh Multi-Hop Relay
      </footer>
    </div>
  );
};

export default App;
