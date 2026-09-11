import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Send, CheckCircle, AlertTriangle } from 'lucide-react';
import { CitizenReport } from '../types';
import { api } from '../services/api';

export const CitizenReportView: React.FC = () => {
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [form, setForm] = useState({
    type: 'FLOOD',
    description: '',
    latitude: 23.0225,
    longitude: 72.5714,
    mediaUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadReports = async () => {
    try {
      const res = await api.getReports();
      if (res.success) setReports(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadReports();

    // Try capturing current GPS if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createReport(form);
      setSuccess(true);
      setForm({
        type: 'FLOOD',
        description: '',
        latitude: form.latitude,
        longitude: form.longitude,
        mediaUrl: ''
      });
      loadReports();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      alert('Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
          <Camera className="w-5 h-5 text-orange-600" />
          <span>Citizen Disaster &amp; Hazard Reporting</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Report blocked roads, fires, structural collapses, and flood levels directly to the authorities
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Report Form */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Submit Hazard Report</h2>

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Report submitted and relayed to Disaster Response Authority!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Hazard Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
              >
                <option value="FLOOD">Flood / Waterlogging</option>
                <option value="FIRE">Fire Hazard</option>
                <option value="BLOCKED_ROAD">Blocked Road / Fallen Tree</option>
                <option value="COLLAPSED_BUILDING">Building Collapse / Debris</option>
                <option value="DAMAGED_INFRASTRUCTURE">Bridge / Damaged Powerline</option>
                <option value="MISSING_PERSON">Missing Person</option>
                <option value="OTHER">Other Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Landmarks</label>
              <textarea
                rows={3}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe current severity, water level, whether anyone is trapped..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-center space-x-1.5 font-bold text-slate-700 mb-1">
                <MapPin className="w-3.5 h-3.5 text-red-500" />
                <span>Detected GPS Location</span>
              </div>
              <div className="text-slate-500 font-mono text-[11px]">
                Lat: {form.latitude.toFixed(5)} • Lng: {form.longitude.toFixed(5)}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-orange-600/30 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Transmit Report'}</span>
            </button>
          </form>
        </div>

        {/* Reports Feed */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Verified Public Feed</h2>
            <span className="text-xs text-slate-500">{reports.length} reports</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {reports.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">No hazard reports filed yet.</p>
            ) : (
              reports.map((rep) => (
                <div key={rep._id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{rep.type.replace('_', ' ')}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      rep.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {rep.verificationStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">&ldquo;{rep.description}&rdquo;</p>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Coords: {rep.location?.coordinates?.[1]?.toFixed(4)}, {rep.location?.coordinates?.[0]?.toFixed(4)} • {new Date(rep.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
