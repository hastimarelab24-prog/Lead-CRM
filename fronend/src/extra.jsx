import React, { useState, useEffect, useCallback } from "react";
import { leadService } from "../services/leadService";
import LeadTable from "../components/leads/LeadTable";
import LeadModal from "../components/leads/LeadModal";
import LeadForm from "../components/leads/leadFrom";
import Pagination from "../components/common/pagination";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
  });
  const [modal, setModal] = useState({ isOpen: false, data: null });
  const [isLoading, setIsLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await leadService.fetchLeads(filters);

      let leadsData = [];
      if (Array.isArray(response)) {
        leadsData = response;
      } else if (response && Array.isArray(response.leads)) {
        leadsData = response.leads;
      } else if (response && Array.isArray(response.data)) {
        leadsData = response.data;
      }

      setLeads(leadsData);
      setPagination(
        response?.pagination || {
          currentPage: filters.page || 1,
          totalPages: 1,
          totalItems: leadsData.length,
        },
      );
    } catch (err) {
      console.error("Load leads failed:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleFormSubmit = async (formData) => {
    try {
      if (modal.data) {
        await leadService.updateLead(modal.data._id, formData);
      } else {
        await leadService.createLead(formData);
      }
      setModal({ isOpen: false, data: null });
      loadLeads();
    } catch (err) {
      console.error("Submit failed:", err);
    }
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await leadService.patchStatus(id, nextStatus);
      loadLeads();
    } catch (err) {
      alert(err.message || "State machine rule violation encountered.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently wipe this lead record?")) {
      return;
    }

    try {
      await leadService.deleteLead(id);
      await loadLeads();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error.response?.data?.message ||
          "Lead delete failed. Please try again.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 font-sans selection:bg-indigo-600 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Hero Section with Soft Ambient Hover Lift */}
        <header className="relative overflow-hidden rounded-3xl border border-slate-200
         bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md
          hover:border-slate-300">

          <div className="relative z-10 flex flex-col md:flex-row md:items-center 
          md:justify-between gap-6">

            <div className="space-y-2">

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border
               border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-semibold 
               uppercase tracking-wider transition-all duration-300 hover:bg-indigo-100
                hover:border-indigo-300 cursor-default">

                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />

                Pipeline Command Center
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                Lead Registry Control
              </h1>
              <p className="text-sm sm:text-base text-slate-500 max-w-xl">
                Monitor real-time pipeline conversions, channels, and active
                sales personnel assignments.
              </p>
            </div>

            {/* Glowing Interactive CTA Button */}
            <button
              onClick={() => setModal({ isOpen: true, data: null })}
              className="group relative inline-flex items-center justify-center gap-2 px-6
               py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
                text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20
                 hover:shadow-xl hover:shadow-indigo-600/35 transition-all duration-300 
                 hover:-translate-y-1 active:translate-y-0 active:scale-95 cursor-pointer"
            >
              <svg
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90 
                group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="tracking-wide">Onboard New Lead</span>
            </button>
          </div>

          {/* Metric Cards with Smooth Hover Effects */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t
           border-slate-100">
            <div className="group p-4 rounded-xl bg-slate-50/70 hover:bg-white border
             border-slate-200/60 hover:border-slate-300 shadow-none hover:shadow-md 
             transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xs text-slate-500 font-medium group-hover:text-slate-700
               transition-colors">
                Total Registered
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {pagination?.totalItems || leads.length}
              </p>
            </div>

            <div className="group p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-indigo-200 shadow-none hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xs text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">
                Active Displayed
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {leads.length}
              </p>
            </div>

            <div className="group p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-emerald-200 shadow-none hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xs text-slate-500 font-medium group-hover:text-emerald-600 transition-colors">
                Current Page
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {pagination?.currentPage || 1}
              </p>
            </div>

            <div className="group p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-purple-200 shadow-none hover:shadow-md hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xs text-slate-500 font-medium group-hover:text-purple-600 transition-colors">
                Total Pages
              </p>
              <p className="text-2xl font-bold text-purple-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {pagination?.totalPages || 1}
              </p>
            </div>
          </div>
        </header>





        {/* Filter Bar with Hover Glows */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300">
          {/* Search Input with Dynamic Icon State */}
          <div className="relative md:col-span-6 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Filter by name, email, or key attributes..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                  page: 1,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-600/10 hover:bg-white"
            />
          </div>

          {/* Workflow Select */}
          <div className="md:col-span-3">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value,
                  page: 1,
                }))
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-600/10 hover:bg-white cursor-pointer"
            >
              <option value="">All Workflow Stages</option>
              {[
                "New",
                "Contacted",
                "Qualified",
                "Proposal Sent",
                "Nurturing",
                "Lost",
                "Won",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="md:col-span-3">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-600/10 hover:bg-white cursor-pointer"
            >
              <option value="createdAt-desc">
                Date Created (Newest First)
              </option>
              <option value="createdAt-asc">Date Created (Oldest First)</option>
              <option value="name-asc">Name (A to Z)</option>
              <option value="name-desc">Name (Z to A)</option>
            </select>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center transition-all">
              <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-xl animate-bounce">
                <div className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                <span className="text-xs font-semibold text-slate-700">
                  Fetching Records...
                </span>
              </div>
            </div>
          )}

          <div className="p-1">
            <LeadTable
              leads={leads}
              onEdit={(lead) => setModal({ isOpen: true, data: lead })}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              pagination={pagination}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            />
          </div>
        </div>

        {/* Modal Wrapper */}
        <LeadModal
          isOpen={modal.isOpen}
          onClose={() => setModal({ isOpen: false, data: null })}
          title={modal.data ? "Update Lead Profile" : "Register Target Lead"}
        >
          <LeadForm
            initialData={modal.data}
            onSubmit={handleFormSubmit}
            onClose={() => setModal({ isOpen: false, data: null })}
          />
        </LeadModal>
      </div>
    </div>
  );
}


