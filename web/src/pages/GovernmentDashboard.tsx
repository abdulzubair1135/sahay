import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Radio, CheckCircle, Clock, Plus, Filter, RefreshCw, Users, HeartPulse, Send } from 'lucide-react';
import { SOSEvent, SOSStats, RescueTeam, Shelter, Hospital, CitizenReport } from '../types';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { LiveMap } from '../components/LiveMap';
import { SOSTriageModal } from '../components/SOSTriageModal';

export const GovernmentDashboard: React.FC = () => {
  const [sosList, setSosList] = useState<SOSEvent[]>([]);
  const [stats, setStats] = useState<SOSStats>({
    totalActive: 0,
    critical: 0,
    highPriority: 0,
    assigned: 0,
    resolved: 0,
    offlineRelayed: 0,
    averageResponseTimeMinutes: 0
  });
  const [rescueTeams, setRescueTeams] = useState<RescueTeam[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);

  const [selectedSOS, setSelectedSOS] = useState<SOSEvent | null>(null);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertForm, setAlertForm] = useState({
    title: '',
    message: '',
    type: 'GENERAL',
    severity: 'WARNING',
    radiusKm: 25
  });

  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sosRes, statsRes, teamsRes, sheltersRes, hospRes, repRes] = await Promise.all([
        api.getSOSList(),
        api.getSOSStats(),
        api.getRescueTeams(),
        api.getShelters(),
        api.getHospitals(),
        api.getReports()
      ]);

      if (sosRes.success) setSosList(sosRes.data || []);
      if (statsRes.success) setStats(statsRes.data || stats);
      if (teamsRes.success) setRescueTeams(teamsRes.data || []);
      if (sheltersRes.success) setShelters(sheltersRes.data || []);
      if (hospRes.success) setHospitals(hospRes.data || []);
      if (repRes.success) setReports(repRes.data || []);
    } catch (err) {
      console.error('Failed to load command center data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Socket.IO real-time event listener
    const socket = getSocket();
    const handleNewSOS = (newSOS: SOSEvent) => {
      console.log('[Dashboard] Live SOS event received:', newSOS);
      setSosList((prev) => [newSOS, ...prev.filter((s) => s.eventId !== newSOS.eventId)]);
      api.getSOSStats().then((res) => { if (res.success) setStats(res.data); });
    };

    const handleStatusChanged = (payload: any) => {
      setSosList((prev) =>
        prev.map((s) => (s.eventId === payload.eventId ? { ...s, status: payload.status } : s))
      );
      api.getSOSStats().then((res) => { if (res.success) setStats(res.data); });
    };

    socket.on('sos:new', handleNewSOS);
    socket.on('sos:status_changed', handleStatusChanged);
    socket.on('sos:assigned', () => loadData());
    socket.on('sos:verified', () => loadData());

    return () => {
      socket.off('sos:new', handleNewSOS);
      socket.off('sos:status_changed', handleStatusChanged);
      socket.off('sos:assigned');
      socket.off('sos:verified');
    };
  }, []);

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertForm.title || !alertForm.message) return;
    try {
      await api.createAlert(alertForm);
      setShowAlertModal(false);
      setAlertForm({ title: '', message: '', type: 'GENERAL', severity: 'WARNING', radiusKm: 25 });
      alert('Emergency Alert successfully broadcasted to citizens and media!');
    } catch (err) {
      alert('Failed to broadcast alert');
    }
  };

  const filteredSOS = sosList.filter((s) => {
    if (filterSeverity !== 'ALL' && s.severity !== filterSeverity) return false;
    if (filterSource !== 'ALL') {
      if (filterSource === 'BLE' && s.source === 'ONLINE') return false;
      if (filterSource === 'ONLINE' && s.source !== 'ONLINE') return false;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Disaster Command &amp; Triage Center</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time live multi-hop emergency grid • Zero simulated data • MongoDB synchronized
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
          <button
            onClick={() => setShowAlertModal(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Official Alert</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Computed strictly from DB) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Active SOS</div>
          <div className="text-2xl font-black text-slate-900">{stats.totalActive}</div>
          <div className="text-[10px] text-slate-400 mt-1">Pending response</div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200/60 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-1 flex items-center space-x-1">
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
            <span>Critical</span>
          </div>
          <div className="text-2xl font-black text-red-700">{stats.critical}</div>
          <div className="text-[10px] text-red-500 mt-1">Immediate danger</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1">High Priority</div>
          <div className="text-2xl font-black text-amber-800">{stats.highPriority}</div>
          <div className="text-[10px] text-amber-600 mt-1">Urgent attention</div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/60 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 mb-1">Assigned</div>
          <div className="text-2xl font-black text-indigo-800">{stats.assigned}</div>
          <div className="text-[10px] text-indigo-500 mt-1">Rescue en route</div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/60 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 mb-1 flex items-center space-x-1">
            <Radio className="w-3.5 h-3.5" />
            <span>BLE Relayed</span>
          </div>
          <div className="text-2xl font-black text-purple-900">{stats.offlineRelayed}</div>
          <div className="text-[10px] text-purple-600 mt-1">Offline multi-hop</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Resolved</div>
          <div className="text-2xl font-black text-emerald-800">{stats.resolved}</div>
          <div className="text-[10px] text-emerald-600 mt-1">Closed incidents</div>
        </div>
      </div>

      {/* Main Grid: Left Map + Right SOS Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Interactive Map (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-[620px]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Live Operational Map</h2>
            <span className="text-xs text-slate-500">Real GPS coordinates layer</span>
          </div>
          <div className="flex-1">
            <LiveMap
              sosList={filteredSOS}
              rescueTeams={rescueTeams}
              shelters={shelters}
              hospitals={hospitals}
              reports={reports}
              onSelectSOS={(sos) => setSelectedSOS(sos)}
              selectedSOS={selectedSOS}
            />
          </div>
        </div>

        {/* Live SOS Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col h-[620px] bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Emergency Incident Feed</h2>
              <span className="text-xs text-slate-500">{filteredSOS.length} incidents reported</span>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center space-x-1">
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-none"
              >
                <option value="ALL">Severity: All</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
              </select>

              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] text-slate-700 focus:outline-none"
              >
                <option value="ALL">Transport: All</option>
                <option value="BLE">BLE Relayed</option>
                <option value="ONLINE">Online Direct</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 mt-2 pr-1 scrollbar-thin">
            {filteredSOS.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" />
                <p className="font-semibold text-sm text-slate-700">No active SOS alerts in this filter</p>
                <p className="text-xs text-slate-500 mt-1">All citizens are safe or incidents have been resolved.</p>
              </div>
            ) : (
              filteredSOS.map((sos) => {
                const isCritical = sos.severity === 'CRITICAL';
                const isOffline = sos.source === 'OFFLINE_BLE' || sos.source === 'BLE_RELAY';
                return (
                  <div
                    key={sos.eventId}
                    onClick={() => setSelectedSOS(sos)}
                    className={`p-3 rounded-xl transition cursor-pointer hover:bg-slate-50 my-1 ${
                      selectedSOS?.eventId === sos.eventId ? 'bg-red-50/50 border border-red-200' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isCritical ? 'bg-red-600 animate-ping' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold text-slate-800">{sos.type}</span>
                        {isOffline && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-bold">
                            {sos.source} {sos.hopCount > 0 ? `(${sos.hopCount}h)` : ''}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isCritical ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {sos.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 mb-1">
                      {sos.description || `${sos.peopleCount} person(s) affected • Lat: ${sos.location?.coordinates?.[1]?.toFixed(4)}, Lng: ${sos.location?.coordinates?.[0]?.toFixed(4)}`}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Status: <strong className="text-slate-700">{sos.status}</strong></span>
                      <span>{new Date(sos.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Selected SOS Triage Modal */}
      {selectedSOS && (
        <SOSTriageModal
          sos={selectedSOS}
          rescueTeams={rescueTeams}
          onClose={() => setSelectedSOS(null)}
          onUpdate={() => {
            setSelectedSOS(null);
            loadData();
          }}
        />
      )}

      {/* Official Alert Broadcast Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Broadcast Official Emergency Alert</h3>
            <p className="text-xs text-slate-500 mb-4">Dispatches to all active citizen apps and emergency broadcast channels.</p>

            <form onSubmit={handleBroadcastAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alert Title</label>
                <input
                  type="text"
                  required
                  value={alertForm.title}
                  onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                  placeholder="e.g. Flash Flood Evacuation Advisory — Sector 4"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Message</label>
                <textarea
                  rows={3}
                  required
                  value={alertForm.message}
                  onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                  placeholder="Provide essential citizen instructions, safe assembly points, and emergency hotline numbers."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Alert Severity</label>
                  <select
                    value={alertForm.severity}
                    onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  >
                    <option value="WARNING">Warning</option>
                    <option value="DANGER">Danger</option>
                    <option value="SEVERE">Severe</option>
                    <option value="EXTREME">Extreme Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Geofence Radius (km)</label>
                  <input
                    type="number"
                    value={alertForm.radiusKm}
                    onChange={(e) => setAlertForm({ ...alertForm, radiusKm: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAlertModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-red-600/30"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
