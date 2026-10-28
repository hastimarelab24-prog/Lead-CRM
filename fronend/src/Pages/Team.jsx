  import React, { useCallback, useEffect, useState } from "react";
  import { apiRequest } from "../api/api";
  import { Link } from "react-router-dom";
  import CreateUser from "./CreateUser";

  export default function Team() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen,setIsModalOpen]=useState(false)
    const loadUsers = useCallback(async () => {
      try {
        setError("");
        setLoading(true);
        const data = await apiRequest("/users", "GET");

        const userList = Array.isArray(data)
          ? data
          : Array.isArray(data.users)
          ? data.users
          : Array.isArray(data.data)
          ? data.data
          : [];

        setUsers(userList);
      } catch (err) {
        console.error("Failed to load users:", err.response?.data || err);
        setError(
          err.response?.data?.message || err.message || "Failed to load users."
        );
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      loadUsers();
    }, [loadUsers]);

    // remove
 const handleRemoveUser = async (userId, userName) => {
  if(!userId) {alert("user id not found."); return}
  if (!window.confirm(`Are you sure you want to remove ${userName} from the team?`)) {
    return;
  }
  try {
 const result =  await apiRequest(`/users/${userId}`, "DELETE"); 
    
    setUsers((prev) => prev.filter((user) => String(user._id || user.id) !== String(userId)));
    alert(result.message || "Team member removed successfully!");
  } catch (err) {
    console.error("Failed to remove user:", err.response?.data || err);
    alert(err.response?.data?.message || "Failed to remove team member.");
  }
};
    // Helper for initials
    const getInitials = (name) => {
      if (!name) return "U";
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    };

    // Filter users based on search query
    const filteredUsers = users.filter((user) => {
      const query = searchQuery.toLowerCase();
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    });

    // Calculate metrics
    const totalMembers = users.length;
    const managersCount = users.filter((u) => u.role?.toLowerCase() === "manager" || u.role?.toLowerCase() === "admin").length;
    const totalLeadsAssigned = users.reduce((acc, u) => acc + (u.assignedLeadsCount || u.leadsCount || 0), 0);

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 selection:bg-indigo-600">
        <div className="max-w-9xl mx-auto space-y-8">
          
          {/* Header Section */}
          <header className="relative overflow-hidden bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-md">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Workspace / Team Members</p>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Team members</h1>
                <p className="text-sm text-slate-500 max-w-xl">
                  Manage people, responsibilities, and team capacity.
                </p>
              </div>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="tracking-wide">Add team member</span>
              </button>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
              <div className="group p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 shadow-none hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total members</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                  {totalMembers}
                </p>
              </div>
              <div className="group p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 shadow-none hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Managers / Admins</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                  {managersCount}
                </p>
              </div>
              <div className="group p-4 rounded-xl bg-slate-50/70 border border-slate-200/60 shadow-none hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Assigned leads</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                  {totalLeadsAssigned}
                </p>
              </div>
            </div>
          </header>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-full">
              <h3 className="font-bold text-slate-800 text-base">Everyone on your team</h3>
              <p className="text-xs text-slate-400">Manage all registered users and their current system roles.</p>
            </div>
            <div className="relative w-full sm:w-80">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search team..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-600/10"
              />
            </div>
          </div>

          {/* Loading & Error States */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-lg">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-slate-700">Loading team members...</span>
              </div>
            </div>
          )}

          {error && <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">{error}</div>}

          {/* Team Grid Cards */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => {
                const userName = user.name || "Unnamed User";
                const userEmail = user.email || "-";
                const userRole = user.role || "Employee";
                const isActive = user.isActive !== false;
                const leadsCount = user.assignedLeadsCount || user.leadsCount || 0;

                return (
                  <div
                    key={user._id || user.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative group"
                  >
                    {/* Top row: Avatar & Options */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center text-sm shadow-inner shrink-0">
                          {getInitials(userName)}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {userName}
                          </h4>
                          <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {userEmail}
                          </p>
                        </div>
                      </div>
                      {/* remove */}
                      <button type="button" onClick={()=>handleRemoveUser(user._id || user.id,userName)} 
                        title="Remove team member" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* Middle row: Role and Leads Badge */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
                      <span className="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {userRole.replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                        {leadsCount} leads
                      </span>
                    </div>

                    {/* Bottom row: Status */}
                    <div className="flex items-center justify-between mt-4 text-xs font-medium text-slate-500">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                        <span>{isActive ? "Active now" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="p-3 bg-slate-100 rounded-full text-slate-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-slate-600 font-medium">No team members found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search query or add a new team member.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <CreateUser isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onSuccess={loadUsers}/>
      </div>

    );
  }