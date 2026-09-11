import React from 'react';
import { ShieldAlert, Radio, Activity, Users, Building2, HeartHandshake, FileText, Settings } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isConnected: boolean;
  activeSOSCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, isConnected, activeSOSCount }) => {
  const tabs = [
    { id: 'gov', label: 'Command Center', icon: ShieldAlert, badge: activeSOSCount > 0 ? activeSOSCount : undefined },
    { id: 'rescue', label: 'Rescue Team', icon: Radio },
    { id: 'hospital', label: 'Hospital Capacity', icon: Building2 },
    { id: 'ngo', label: 'NGO Relief', icon: HeartHandshake },
    { id: 'reports', label: 'Citizen Reports', icon: FileText },
    { id: 'admin', label: 'Audit & Admin', icon: Settings },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-900/50">
              <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-white">AapdaSetu</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                  Gov Command
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                When the Network Fails, AapdaSetu Doesn&apos;t.
              </p>
            </div>
          </div>

          {/* Real-time connection badge */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
              isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span>{isConnected ? 'LIVE ENGINE CONNECTED' : 'RECONNECTING...'}</span>
            </div>
          </div>
        </div>

        {/* Role Navigation Bar */}
        <div className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-white text-red-600">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
