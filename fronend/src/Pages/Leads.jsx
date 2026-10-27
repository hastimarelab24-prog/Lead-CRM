import React, { useState, useEffect } from "react";
import { leadService } from "../services/leadService";
import LeadTable from "../components/leads/LeadTable";
import LeadModal from "../components/leads/LeadModal";
import LeadForm from "../components/leads/leadFrom"; // Matches the misspelled file on disk
import Pagination from "../components/common/pagination";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    totalPages: 1,
  });
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
  });
  const [modal, setModal] = useState({ isOpen: false, data: null });

  // const loadLeads = async () => {
  //   try {
  //     const data = await leadService.fetchLeads(filters);
  //     setLeads(data.leads);
  //     setPagination(data.pagination);
  //   } catch (err) { console.error(err); }
  // };
  const loadLeads = async () => {
    try {
      const response = await leadService.fetchLeads(filters);

      console.log("Full API Response Data:", response);

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
          currentPage: 1,
          totalPages: 1,
          totalItems: leadsData.length,
        },
      );
    } catch (err) {
      console.error("Load leads failed:", err.response?.data || err.message);
    }
  };
  useEffect(() => {
    loadLeads();
  }, [filters]);

  const handleFormSubmit = async (formData) => {
    if (modal.data) {
      await leadService.updateLead(modal.data._id, formData);
    } else {
      await leadService.createLead(formData);
    }
    setModal({ isOpen: false, data: null });
    loadLeads();
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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 selection:bg-indigo-600">
      <div className="max-w-9xl mx-auto space-y-8">
        {/* header  */}
        <header className=" relative overflow-hidden  bg-white p-6 sm:p-8 shadow-sm  transition-all duration-300 hover:shadow-md">
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
            <button
              onClick={() => setModal({ isOpen: true, data: null })}
              className="group relative inline-flex items-center justify-center gap-2 px-6  py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20  hover:shadow-xl hover:shadow-indigo-600/35 transition-all duration-300   hover:-translate-y-1 active:translate-y-0 active:scale-95 cursor-pointer"
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

          {/* metric card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="group p-4 rounded-xl bg-slate-300 shadow-none hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xs text-slate-500 font-medium  group-hover:text-slate-700 transition-colors"> Total Registered</p>
              <p>{pagination ?.totalItems || leads.length}</p>
            </div>
          </div>
        </header>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <input
          placeholder="Filter string matching details..."
          value={filters.search}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
          }
          className="border rounded-xl px-4 py-2 bg-white shadow-sm outline-none text-sm"
        />
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value, page: 1 }))
          }
          className="border rounded-xl px-4 py-2 bg-white shadow-sm outline-none text-sm"
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
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split("-");
            setFilters((prev) => ({ ...prev, sortBy, sortOrder, page: 1 }));
          }}
          className="border rounded-xl px-4 py-2 bg-white shadow-sm outline-none text-sm"
        >
          <option value="createdAt-desc">Date Created (Newest)</option>
          <option value="createdAt-asc">Date Created (Oldest)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
        </select>
      </div>

      <LeadTable
        leads={leads}
        onEdit={(lead) => setModal({ isOpen: true, data: lead })}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />

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
  );
}
