import React, { useState, useEffect } from "react";
import { leadService } from "../services/leadService";
import LeadTable from "../components/leads/LeadTable";
import LeadModal from "../components/leads/LeadModal";
import LeadForm from "../components/leads/leadFrom"; // Matches the misspelled file on disk
import Pagination from "../components/common/pagination";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 border rounded-xl shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Lead Registry Control
          </h1>
          <p className="text-sm text-gray-500">
            Monitor pipeline conversions, channels, and personnel assignments.
          </p>
        </div>
        <button
          onClick={() => setModal({ isOpen: true, data: null })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm shadow-blue-500/10 transition"
        >
          + Onboard Lead
        </button>
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
