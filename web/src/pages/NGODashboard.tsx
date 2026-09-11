import React, { useState, useEffect } from 'react';
import { HeartHandshake, Package, Users, Plus, Check } from 'lucide-react';
import { Resource } from '../types';
import { api } from '../services/api';

export const NGODashboard: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    organizationName: 'Indian Red Cross Society',
    type: 'FOOD',
    quantity: 500,
    unit: 'meal packets'
  });

  const loadData = async () => {
    try {
      const [resData, volData] = await Promise.all([api.getResources(), api.getVolunteers()]);
      if (resData.success) setResources(resData.data || []);
      if (volData.success) setVolunteers(volData.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReport; // placeholder or create resource
      // create resource via api
      const res = await fetch('http://localhost:5000/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Error saving relief item');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <HeartHandshake className="w-5 h-5 text-emerald-600" />
            <span>NGO Relief Inventory &amp; Volunteer Coordination</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time disaster relief supplies: food rations, water, blankets, medical kits
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Supplies Stock</span>
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supplies Inventory */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Available Relief Inventories</span>
            </h2>
            <span className="text-xs text-slate-500">{resources.length} stockpile items</span>
          </div>

          <div className="divide-y divide-slate-100">
            {resources.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No relief items registered yet.</p>
            ) : (
              resources.map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{item.type}</div>
                    <div className="text-[11px] text-slate-500">{item.organizationName}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm text-emerald-700">
                      {item.availableQuantity} {item.unit}
                    </div>
                    <div className="text-[10px] text-slate-400">Total: {item.quantity} {item.unit}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Volunteers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Registered Volunteers</span>
            </h2>
            <span className="text-xs text-slate-500">{volunteers.length} available</span>
          </div>

          <div className="divide-y divide-slate-100">
            {volunteers.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active volunteers registered yet.</p>
            ) : (
              volunteers.map((vol) => (
                <div key={vol._id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-slate-900">{vol.name}</div>
                    <div className="text-[11px] text-slate-500">Skills: {vol.skills?.join(', ')} • Vehicle: {vol.vehicle}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    {vol.availability}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Relief Stockpile</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={form.organizationName}
                  onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resource Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  <option value="FOOD">Food Rations</option>
                  <option value="WATER">Drinking Water Packs</option>
                  <option value="MEDICINE">First Aid &amp; Emergency Meds</option>
                  <option value="BLANKETS">Warm Blankets</option>
                  <option value="CLOTHING">Clothing &amp; Footwear</option>
                  <option value="BOATS">Inflatable Boats</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Save Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
