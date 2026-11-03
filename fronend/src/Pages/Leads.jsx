import React, { useState, useEffect, useCallback, useContext } from "react";
import { leadService } from "../services/leadService";
import LeadTable from "../components/leads/LeadTable";
import LeadModal from "../components/leads/LeadModal";
import LeadForm from "../components/leads/leadFrom";
import Pagination from "../components/common/pagination";
import { WorkspaceContext } from "../context/WorkCountContext";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const { setTotalLeads } = useContext(WorkspaceContext);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    currentPage: 1,
    limit: 10,
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
  const [viewModal, setViewModal] = useState({ isOpen: false, data: null });

  const loadLeads = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await leadService.fetchLeads({
        ...filters,
        page: filters.page,
        limit: 10,
      });

      const result = response?.data ?? response;
      const leadsData = Array.isArray(result?.leads) ? result.leads : [];
      const apiPagination = result?.pagination || {};

      const totalItems = Number(
        apiPagination.totalLeads ?? apiPagination.totalItems ?? 0,
      );

      const totalPages = Math.ceil(totalItems / 10);

      if (totalPages > 0 && filters.page > totalPages) {
        setFilters((prev) => ({
          ...prev,
          page: totalPages,
        }));
        return;
      }

      setLeads(leadsData);

      setPagination({
        currentPage: filters.page,
        totalPage: totalPages,
        totalPages: totalPages,
        totalLeads: totalItems,
        totalItems: totalItems,
        limit: 10,
      });

      setTotalLeads(totalItems);
    } catch (err) {
      console.error("Load leads failed:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, setTotalLeads]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleFormSubmit = async (formData) => {
    try {
      if (modal.data) {
        await leadService.updateLead(modal.data._id, formData);
        setModal({ isOpen: false, data: null });
        await loadLeads();
      } else {
        await leadService.createLead(formData);
        setModal({ isOpen: false, data: null });
        setFilters((prev) => ({
          ...prev,
          page: 1,
        }));
      }
    } catch (err) {
      console.error("Submit failed:", err);
      alert(
        err.response?.data?.message || "Unable to save lead. Please try again.",
      );
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

  const handleView = (lead) => {
    setViewModal({ isOpen: true, data: lead });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.totalPages) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Fixed CSV Export Function
  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      let allLeads = [];
      let currentPages = 1;
      let totalPages = 1;
      do {
        const response = await leadService.fetchLeads({
          ...filters,
          page: currentPages,
          limit: 10000,
        });
        const result = response?.data ?? response;
        const LeadsData = Array.isArray(result?.leads) ? result.leads : [];
        const apiPagination = result?.pagination || {};
        //  total count page
        const totalItems = Number(
          apiPagination.totalLeads ?? apiPagination.totalItems ?? 0,
        );
        totalPages =
          apiPagination.totalPage ||
          totalPages ||
          Math.ceil(totalItems / 100) ||
          1;

        if (LeadsData.length > 0) {
          allLeads = [...allLeads, ...LeadsData];
        }
        currentPages++;
      } while (currentPages <= totalPages);
      if (allLeads.length === 0) {
        alert("Download to be not data fetch");
      }

      const headers = [
        "Name",
        "Company",
        "Email",
        "Phone",
        "Assigned To",
        "Status",
        "Source",
        "Priority",
        "Created At",
      ];

      const rows = allLeads.map((lead) => {
        let assignedName = "Unassigned";
        
        if (lead.assignedEmployee) {
          if (typeof lead.assignedEmployee === "object" && lead.assignedEmployee !== null) {
            assignedName = lead.assignedEmployee.name || lead.assignedEmployee.Name || "Unassigned";
          } else {
            assignedName = lead.assignedEmployee;
          }
        } else if (lead.assignedTo) {
          assignedName = typeof lead.assignedTo === "object" ? lead.assignedTo.name : lead.assignedTo;
        } else if (lead.owner) {
          assignedName = typeof lead.owner === "object" ? lead.owner.name : lead.owner;
        }
        return [
        `"${lead.name || lead.Name || ""}"`,
        `"${lead.company || lead.Company || ""}"`,
        `"${lead.email || lead.Email || ""}"`,
        `"${lead.phone || lead.Phone || ""}"`,
        `"${assignedName}"`,
        `"${lead.status || "New"}"`,
        `"${lead.source || "Website"}"`,
        `"${lead.priority || "Medium"}"`,
        `"${lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : ""}"`,

        ]
    });

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Lead data download કરતી વખતે ભૂલ થઈ છે.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 selection:bg-indigo-600">
      <div className="max-w-9xl mx-auto space-y-0">
        {/* header */}
        <header className="mb-8 relative overflow-hidden bg-white p-6 sm:p-8 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Lead Registry Control
              </h1>
              <p className="text-sm text-gray-500 max-w-xl">
                Monitor pipeline conversions, channels, and personnel
                assignments.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all duration-300 cursor-pointer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setModal({ isOpen: true, data: null })}
                className="group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:shadow-indigo-600/35 transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:scale-95 cursor-pointer"
              >
                <svg
                  className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110"
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
                <span>Onboard New Lead</span>
              </button>
            </div>
          </div>

          {/* metric card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="group p-4 rounded-xl bg-slate-50/70 shadow-none hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xl text-slate-500 font-medium group-hover:text-indigo-700 transition-colors">
                Total Registered
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {pagination?.totalItems || leads.length}
              </p>
            </div>
            <div className="group p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-indigo-200 shadow-none hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xl text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">
                Active Displayed
              </p>
              <p className="text-2xl font-bold text-indigo-600 mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {leads.length}
              </p>
            </div>
          </div>
        </header>

        {/* filter bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md">
          <div className="relative md:col-span-6 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-200">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx="11" cy="11" r="8" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-4.35-4.35"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Filter string matching details..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  search: e.target.value,
                }))
              }
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-600/10 hover:bg-white"
            />
          </div>
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

          <div className="md:col-span-3">
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-");
                setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-600/10 hover:bg-white cursor-pointer"
            >
              <option value="createdAt-desc">Date Created (Newest)</option>
              <option value="createdAt-asc">Date Created (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* main table container */}
        <div className="relative rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden mt-4">
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
              onView={handleView}
            />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              pagination={pagination}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

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

        {/* view modal */}
        <LeadModal
          isOpen={viewModal.isOpen}
          onClose={() => setViewModal({ isOpen: false, data: null })}
          title="lead details"
        >
          {viewModal.data && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Full Name
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewModal.data.name || viewModal.data.Name || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Company
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewModal.data.company || viewModal.data.Company || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Email Address
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewModal.data.email || viewModal.data.Email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Workflow Status
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {viewModal.data.status || "New"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Source
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewModal.data.source || "Website"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Priority
                  </p>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      viewModal.data.priority === "High"
                        ? "bg-rose-50 text-rose-700"
                        : viewModal.data.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-700"
                    }`}
                  >
                    {viewModal.data.priority || "Medium"}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">
                    Created At
                  </p>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {viewModal.data.createdAt
                      ? new Date(viewModal.data.createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </LeadModal>
      </div>
    </div>
  );
}
