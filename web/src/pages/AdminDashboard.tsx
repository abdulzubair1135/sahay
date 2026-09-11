import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Database, FileText } from 'lucide-react';
import { api } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const res = await api.getAuditLogs();
        if (res.success) setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-slate-700" />
          <span>System Administration &amp; Security Audit Trail</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tamper-evident operational audit logs, RBAC enforcement, and network gateway status
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Audit Trail Log</span>
          </h2>
          <span className="text-xs text-slate-500">{logs.length} logged actions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">User / Device</th>
                <th className="py-2.5 px-3">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                    No audit records recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-500">{new Date(l.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 font-bold text-slate-900">{l.action}</td>
                    <td className="py-2 px-3 text-slate-600">{l.entityType} ({l.entityId?.substring(0, 8) || '-'})</td>
                    <td className="py-2 px-3 text-slate-700">{l.userName || l.deviceId || 'System'}</td>
                    <td className="py-2 px-3 text-slate-400">{l.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
