import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Lock,
  Building2,
  Activity,
  History,
  CheckCircle2,
  XCircle,
  Filter
} from 'lucide-react';

const ROLES = [
  'State Administrator',
  'District Road Safety Officer',
  'Traffic Police Officer',
  'Highway Engineer',
  'Municipal Officer'
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'audit'

  // New User Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin@123');
  const [role, setRole] = useState(ROLES[1]);
  const [department, setDepartment] = useState('Highways Department');
  const [districtId, setDistrictId] = useState(1);
  const [badgeId, setBadgeId] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
    loadAuditLogs();
    api.getDistricts().then(setDistricts).catch(console.error);
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  };

  const handleToggleUser = async (userId, currentStatus) => {
    try {
      await api.toggleUserStatus(userId, !currentStatus);
      loadUsers();
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createUser({
        full_name: fullName,
        email,
        password,
        role,
        department,
        district_id: parseInt(districtId, 10),
        badge_id: badgeId,
        phone
      });
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setBadgeId('');
      loadUsers();
      loadAuditLogs();
    } catch (err) {
      alert('User creation failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departmental User & Role-Based Access Control"
        subtitle="Manage government personnel credentials, departmental access tiers, and security audit log logs"
        badge="SECURITY AUDIT COMPLIANT"
        actions={
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Enroll Official User</span>
          </button>
        }
      />

      {/* Tabs Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 text-xs">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'users'
              ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Authorized Department Officers ({users.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-bold transition ${
            activeTab === 'audit'
              ? 'bg-blue-600/20 text-cyan-300 border border-blue-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>System Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {activeTab === 'users' ? (
        /* Users Table */
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Officer Details</th>
                  <th className="py-3 px-4">Access Role Tier</th>
                  <th className="py-3 px-4">Department & Cadre</th>
                  <th className="py-3 px-4">Service Badge ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{u.full_name}</div>
                      <div className="text-[11px] text-cyan-400 mt-0.5">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-200">{u.role}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {u.department}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-300">
                      {u.badge_id || 'TN-STAFF'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          u.is_active
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleUser(u.id, u.is_active)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition ${
                          u.is_active
                            ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Trail Table */
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Acting Officer</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Resource Target</th>
                  <th className="py-3 px-4">Audit Payload Details</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-white font-sans font-bold">
                      {log.user_name}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {log.resource}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-sans truncate max-w-xs">
                      {log.details}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500">
                      {log.ip_address}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enroll User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs">
            <h3 className="text-base font-bold text-white pb-3 border-b border-slate-800">
              Enroll Authorized Department Personnel
            </h3>

            <form onSubmit={handleCreateUser} className="mt-4 space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Full Officer Name & Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. K. Vasanth, Divisional Engineer"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Government Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="officer@tn.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Role Permission Tier</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">District Assignment</label>
                  <select
                    value={districtId}
                    onChange={(e) => setDistrictId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    {districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Department Wing</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Highways Department / NHAI TN Cell"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Service / Badge ID</label>
                  <input
                    type="text"
                    placeholder="TN-PWD-901"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-600/30"
                >
                  {submitting ? 'Creating Account...' : 'Enroll Official'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

