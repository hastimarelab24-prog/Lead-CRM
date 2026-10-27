// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   BarChart,
//   Bar,
//   PieChart,
//   Pie,
//   Cell,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer
// } from 'recharts';
// import {
//   Users,
//   TrendingUp,
//   DollarSign,
//   Download,
//   Calendar,
//   AlertCircle,
//   RefreshCw,
//   Phone,
//   Mail,
//   Video,
//   Layers,
//   Inbox
// } from 'lucide-react';

// const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6B7280'];
// const API_BASE_URL = 'http://localhost:5000';

// export default function Dashboard() {
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [exporting, setExporting] = useState(false);

//   const fetchDashboardData = useCallback(async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const queryParams = new URLSearchParams();
//       if (startDate) queryParams.append('startDate', startDate);
//       if (endDate) queryParams.append('endDate', endDate);

//       const response = await fetch(`${API_BASE_URL}/api/dashboard?${queryParams.toString()}`);
      
//       const contentType = response.headers.get('content-type');
//       if (!contentType || !contentType.includes('application/json')) {
//         throw new Error('Server returned non-JSON response. Verify backend is running.');
//       }

//       const result = await response.json();
//       if (!response.ok) throw new Error(result.message || 'Failed to fetch dashboard metrics');

//       setData(result.data);
//     } catch (err) {
//       setError(err.message || 'Something went wrong while loading dashboard data.');
//     } finally {
//       setLoading(false);
//     }
//   }, [startDate, endDate]);

//   useEffect(() => {
//     fetchDashboardData();
//   }, [fetchDashboardData]);

//   const handleExportCSV = async () => {
//     setExporting(true);
//     try {
//       const queryParams = new URLSearchParams();
//       if (startDate) queryParams.append('startDate', startDate);
//       if (endDate) queryParams.append('endDate', endDate);

//       const response = await fetch(`${API_BASE_URL}/api/dashboard/export-csv?${queryParams.toString()}`);
//       if (!response.ok) throw new Error('Failed to download CSV');

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = `leads_export_${new Date().toISOString().split('T')[0]}.csv`;
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       alert('CSV Export failed: ' + err.message);
//     } finally {
//       setExporting(false);
//     }
//   };

//   const clearFilters = () => {
//     setStartDate('');
//     setEndDate('');
//   };

//   const isDataEmpty =
//     !data || (data.summary.totalLeads === 0 && data.employeeActivities.length === 0);

//   return (
//     <div className="min-h-screen bg-gray-50 p-6 space-y-6">
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Reporting & Analytics</h1>
//           <p className="text-sm text-gray-500">Track lead performance, sources, and employee activity</p>
//         </div>

//         <div className="flex flex-wrap items-center gap-3">
//           <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
//             <Calendar className="w-4 h-4 text-gray-500" />
//             <input
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="bg-transparent text-xs text-gray-700 outline-none"
//             />
//             <span className="text-gray-400 text-xs">to</span>
//             <input
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="bg-transparent text-xs text-gray-700 outline-none"
//             />
//           </div>

//           {(startDate || endDate) && (
//             <button onClick={clearFilters} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1">
//               Clear
//             </button>
//           )}

//           <button
//             onClick={handleExportCSV}
//             disabled={exporting || isDataEmpty}
//             className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
//           >
//             <Download className="w-4 h-4" />
//             {exporting ? 'Exporting...' : 'Export CSV'}
//           </button>
//         </div>
//       </div>

//       {loading && (
//         <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl border border-gray-100 shadow-sm">
//           <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
//           <p className="text-sm text-gray-500 font-medium">Fetching real-time metrics...</p>
//         </div>
//       )}

//       {!loading && error && (
//         <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl border border-red-100 p-6 text-center shadow-sm">
//           <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
//           <h3 className="text-base font-semibold text-gray-900">Failed to load reporting data</h3>
//           <p className="text-sm text-gray-500 mt-1 max-w-md">{error}</p>
//           <button
//             onClick={fetchDashboardData}
//             className="mt-4 flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-lg"
//           >
//             <RefreshCw className="w-3.5 h-3.5" /> Retry
//           </button>
//         </div>
//       )}

//       {!loading && !error && isDataEmpty && (
//         <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl border border-gray-100 p-6 text-center shadow-sm">
//           <Inbox className="w-12 h-12 text-gray-300 mb-3" />
//           <h3 className="text-base font-semibold text-gray-800">No lead data available</h3>
//           <p className="text-sm text-gray-500 mt-1 max-w-md">There are no records matching the selected date range.</p>
//         </div>
//       )}

//       {!loading && !error && !isDataEmpty && (
//         <div className="space-y-6">
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-gray-500 uppercase">Total Leads</p>
//                 <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.summary.totalLeads}</h2>
//               </div>
//               <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-6 h-6" /></div>
//             </div>
//             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-gray-500 uppercase">Conversion Rate</p>
//                 <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.summary.conversionRate}%</h2>
//               </div>
//               <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-6 h-6" /></div>
//             </div>
//             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-gray-500 uppercase">Won Deals</p>
//                 <h2 className="text-2xl font-bold text-gray-900 mt-1">{data.summary.wonLeads}</h2>
//               </div>
//               <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><Layers className="w-6 h-6" /></div>
//             </div>
//             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
//               <div>
//                 <p className="text-xs font-medium text-gray-500 uppercase">Total Closed Value</p>
//                 <h2 className="text-2xl font-bold text-gray-900 mt-1">${data.summary.totalRevenue.toLocaleString()}</h2>
//               </div>
//               <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><DollarSign className="w-6 h-6" /></div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
//               <h3 className="text-base font-semibold text-gray-900 mb-4">Leads by Status</h3>
//               <div className="h-64">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <BarChart data={data.leadsByStatus} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
//                     <XAxis dataKey="status" tick={{ fontSize: 12, fill: '#6B7280' }} />
//                     <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} allowDecimals={false} />
//                     <Tooltip cursor={{ fill: '#F9FAFB' }} />
//                     <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
//                   </BarChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>

//             <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
//               <h3 className="text-base font-semibold text-gray-900 mb-4">Lead Sources Distribution</h3>
//               <div className="h-64">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={data.leadSources}
//                       dataKey="count"
//                       nameKey="source"
//                       cx="50%"
//                       cy="50%"
//                       outerRadius={80}
//                       innerRadius={45}
//                       paddingAngle={4}
//                       label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
//                     >
//                       {data.leadSources.map((_, index) => (
//                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                       ))}
//                     </Pie>
//                     <Tooltip />
//                     <Legend />
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>

//           <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
//             <div className="p-5 border-b border-gray-100">
//               <h3 className="text-base font-semibold text-gray-900">Employee Activity Summary</h3>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="w-full text-left border-collapse text-sm">
//                 <thead>
//                   <tr className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
//                     <th className="py-3 px-5">Employee</th>
//                     <th className="py-3 px-5 text-center">Calls</th>
//                     <th className="py-3 px-5 text-center">Emails</th>
//                     <th className="py-3 px-5 text-center">Meetings</th>
//                     <th className="py-3 px-5 text-right">Total Activities</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-100 text-gray-700">
//                   {data.employeeActivities.map((emp) => (
//                     <tr key={emp._id} className="hover:bg-gray-50">
//                       <td className="py-3.5 px-5">
//                         <div className="font-semibold text-gray-900">{emp.name}</div>
//                         <div className="text-xs text-gray-400">{emp.email}</div>
//                       </td>
//                       <td className="py-3.5 px-5 text-center"><Phone className="w-3.5 h-3.5 inline text-blue-500" /> {emp.calls}</td>
//                       <td className="py-3.5 px-5 text-center"><Mail className="w-3.5 h-3.5 inline text-emerald-500" /> {emp.emails}</td>
//                       <td className="py-3.5 px-5 text-center"><Video className="w-3.5 h-3.5 inline text-purple-500" /> {emp.meetings}</td>
//                       <td className="py-3.5 px-5 text-right font-bold text-gray-900">{emp.totalActivities}</td>
//                     </tr>
//                   ))}
//                   {data.employeeActivities.length === 0 && (
//                     <tr>
//                       <td colSpan="5" className="py-6 text-center text-gray-400">No team activity recorded.</td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }






import React, { useContext, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { apiRequest } from "../api/api";

const menuItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: "▦",
    roles: ["administrator", "admin", "manager", "employee"],
  },
  {
    name: "Leads",
    path: "/leads",
    icon: "♧",
    roles: ["administrator", "admin", "manager", "employee"],
  },
  {
    name: "Assign Leads",
    path: "/assign-lead",
    icon: "⇄",
    roles: ["administrator", "admin", "manager"],
  },
  {
    name: "Team Members",
    path: "/team",
    icon: "♙",
    roles: ["administrator", "admin"],
  },
  {
    name: "Create User",
    path: "/team/create",
    icon: "+",
    roles: ["administrator", "admin"],
  },
  {
    name: "Audit Logs",
    path: "/audit-logs",
    icon: "▤",
    roles: ["administrator", "admin"],
  },
];

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = String(user?.role || "employee").toLowerCase();

  const displayName =
    user?.name || user?.username || user?.email || "CRM User";

  const visibleMenuItems = menuItems.filter((item) =>
    item.roles.includes(role)
  );

  const currentPage =
    menuItems.find((item) => item.path === location.pathname)?.name ||
    "Dashboard";

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      try {
        // This endpoint must exist in your backend.
       
        const data = await apiRequest("GET", "/dashboard/stats");

        if (!active) return;

        setOverview(data?.data ?? data ?? {});
      } catch (err) {
        if (!active) return;

        setOverview(null);
        setError(
          err?.message ||
            "Dashboard data could not be loaded from the server."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      {/* Mobile overlay */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMenu}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col justify-between bg-slate-950 p-5 text-white transition-transform duration-200 md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0 ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <Link
            to="/dashboard"
            onClick={closeMenu}
            className="mb-10 flex items-center gap-3"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-2xl font-bold">
              L
            </div>

            <div>
              <h1 className="text-xl font-bold">LeadSphere</h1>
              <p className="text-xs text-slate-400">CRM Workspace</p>
            </div>
          </Link>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            {visibleMenuItems.map((item) => {
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center text-lg">
                    {item.icon}
                  </span>

                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User account */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Account
          </p>

          <div className="rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold">{displayName}</p>
                <p className="truncate text-xs capitalize text-slate-400">
                  {role}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 w-full rounded-xl px-4 py-3 text-left text-sm text-red-300 transition hover:bg-red-950"
          >
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="rounded-lg border border-slate-200 px-3 py-2 md:hidden"
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div>
              <h2 className="text-xl font-bold md:text-2xl">
                {currentPage}
              </h2>

              <p className="hidden text-sm text-slate-500 sm:block">
                LeadSphere CRM / {currentPage}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{displayName}</p>
              <p className="text-xs capitalize text-slate-500">{role}</p>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-5 md:p-8">
          {/* Welcome banner */}
          <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-6 text-white md:p-8">
            <p className="mb-2 text-sm font-medium text-blue-100">
              YOUR CRM WORKSPACE
            </p>

            <h2 className="text-2xl font-bold md:text-3xl">
              Welcome back, {displayName}!
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 md:text-base">
              Manage your leads, assignments and team activities from
              one centralized workspace.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/leads"
                className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                View Leads →
              </Link>

              {(role === "administrator" ||
                role === "admin" ||
                role === "manager") && (
                <Link
                  to="/assign-lead"
                  className="rounded-lg border border-white/40 px-5 py-3 text-sm font-semibold hover:bg-white/10"
                >
                  Assign a Lead
                </Link>
              )}
            </div>
          </section>

          {/* Dynamic backend overview */}
          <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold">Dashboard Overview</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Information retrieved from your backend.
                </p>
              </div>
            </div>

            {loading && (
              <p className="mt-6 text-sm text-slate-500">
                Loading dashboard data...
              </p>
            )}

            {!loading && error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="font-semibold text-red-700">
                  Unable to load dashboard data
                </p>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
            )}

            {!loading && !error && overview && (
              <div className="mt-6">
                {Object.keys(overview).length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Object.entries(overview).map(([key, value]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <p className="text-sm capitalize text-slate-500">
                          {key.replace(/([A-Z])/g, " $1").replace(/_/g, " ")}
                        </p>

                        <p className="mt-2 break-words text-lg font-semibold">
                          {value !== null && typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value ?? "—")}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-slate-500">
                    No dashboard information is available yet.
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Navigation cards */}
          <section>
            <div className="mb-5">
              <h3 className="text-lg font-bold">Workspace Sections</h3>
              <p className="mt-1 text-sm text-slate-500">
                Choose a section to view its records and available actions.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleMenuItems
                .filter((item) => item.path !== "/dashboard")
                .map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl text-blue-700 transition group-hover:bg-blue-100">
                        {item.icon}
                      </div>

                      <div>
                        <h4 className="font-semibold group-hover:text-blue-700">
                          {item.name}
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Open section →
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>

          <footer className="mt-10 text-center text-xs text-slate-400">
            LeadSphere CRM
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;