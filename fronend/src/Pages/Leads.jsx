import React, { useState, useEffect, useCallback, useContext } from "react";
import { leadService } from "../services/leadService";
import LeadTable from "../components/leads/LeadTable";
import LeadModal from "../components/leads/LeadModal";
import LeadForm from "../components/leads/leadFrom"; // Matches the misspelled file on disk
import Pagination from "../components/common/pagination";
import { data } from "react-router-dom";
import { WorkspaceContext } from "../context/WorkCountContext";

export default function Leads() {
  const [leads, setLeads] = useState([]);
const [currentPage, setCurrentPage] = useState(1);
const { setTotalLeads } = useContext(WorkspaceContext);
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0,
    currentPage:1,
  });
  const itemsPerPage=10
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
  // const loadLeads = async () => {
  //   try {
  //     const data = await leadService.fetchLeads(filters);
  //     setLeads(data.leads);
  //     setPagination(data.pagination);
  //   } catch (err) { console.error(err); }
  // };
  const loadLeads = useCallback(async () => {
    setIsLoading(true);
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

     const pageDate=
        response?.pagination || {
          currentPage: filters.page || 1,
          totalPages: Math.max(1,Math.ceil(leadsData.length / itemsPerPage)),
          totalItems: leadsData.length,
        }

        setPagination(pageDate);
        setCurrentPage(pageDate.currentPage || filters.page || 1);
        setTotalLeads(pageDate.totalItems ?? leadsData.length);
      
    } catch (err) {
      console.error("Load leads failed:", err.response?.data || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters,setTotalLeads]);

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

  const handleView = (lead) => {
    setViewModal({ isOpen: true, data: lead });
  };

  return (
    <div className="min-h-screen  bg-slate-50 text-slate-900 p-4 selection:bg-indigo-600">
      <div className="max-w-9xl mx-auto space-y-0 ">
        {/* header  */}
        <header className="mb-8  relative overflow-hidden  bg-white p-6 sm:p-8 shadow-sm  transition-all duration-300 hover:shadow-md">
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
              className="group  relative inline-flex items-center justify-center gap-2 px-6  py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20  hover:shadow-xl hover:shadow-indigo-600/35 transition-all duration-300   hover:-translate-y-1 active:translate-y-0 active:scale-95 cursor-pointer"
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
              <span >Onboard New Lead</span>
            </button>
          </div>

          {/* metric card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-100">
            <div className="group p-4 rounded-xl bg-slate-50/70 shadow-none hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xl text-slate-500 font-medium  group-hover:text-indigo-700 transition-colors">
                {" "}
                Total Registered
              </p>
              <p className="text-2xl font-bold text-indigo-600  mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {pagination?.totalItems || leads.length}
              </p>
            </div>
            <div className="group p-4 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-indigo-200 shadow-none hover:shadow-md hover:shadow-indigo-500/5 transition-all duration-300 hover:-translate-y-1 cursor-default">
              <p className="text-xl text-slate-500 font-medium group-hover:text-indigo-600 transition-colors:">
                Active Displayed
              </p>
              <p className="text-2xl font-bold text-indigo-600  mt-1 transition-transform duration-300 group-hover:scale-105 origin-left">
                {leads.length}
              </p>
            </div>
          </div>
        </header>

        {/* filter bar with hover Glows */}

        <div className=" grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md">
          <div className="relative md:col-span-6 grounp ">
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
                  d="M21 21L-6-5a7 7 11-14 0 7 7 0 0114 0z"
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
                  page: 1,
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-600 rounded-xl text-sm text-slate-900 outline-none transition-all duration-200 focus:ring-4 focus:ring-indigo-600/10 hover:bg-white cursor-pointer "
            >
              <option value="createdAt-desc">Date Created (Newest)</option>
              <option value="createdAt-asc">Date Created (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* main table container */}
        <div
          className=" relative rounded-2xl bg-white border border-slate-200 shadow-sm
            hover:shadow-md transition-shadow duration-300 overflow-hidden"
        >
          {isLoading && (
            <div
              className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center
                 justify-center transition-all"
            >
              <div
                className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-white border
                   border-slate-200 shadow-xl animate-bounce"
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-indigo-600 border-t-transparent
                     animate-spin"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Fetching Records...
                </span>
              </div>
            </div>
          )}

          <div className="p-1 ">
            <LeadTable
              leads={leads.slice((currentPage-1)*itemsPerPage,currentPage*itemsPerPage)}
              onEdit={(lead) => setModal({ isOpen: true, data: lead })}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onView={handleView}
            />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <Pagination
              pagination={pagination}
              onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
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

        {/*   view */}
        <LeadModal
          isOpen={viewModal.isOpen}
          onClose={() => setViewModal({ isOpen: false, data: null })}
          title="lead details"
        >
          {viewModal.data && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4  p-4 rounded-xl border border-slate-200">
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
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold 
            ${
              viewModal.data.priority === "High"
                ? "bg-rose-50 text-rose-700"
                : viewModal.data.priority === "Medium"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-slate-50 text-slate-700-"
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

              {/* FOLLOW-UP */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/60 space-y-3">
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Follow-Up
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Next Follow-up Date:
                    </p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewModal.data.followUpDate ||
                      viewModal.data.netFollowUp ||
                      viewModal.data.followUp
                        ? new Date(
                            viewModal.data.followUpDate ||
                              viewModal.data.netFollowUp ||
                              viewModal.data.followUp,
                          ).toLocaleDateString()
                        : "NO Follow-Up scheduled"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs  text-slate-500 font-medium">
                      Assigned Personnal:
                    </p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {typeof viewModal.data.assignedEmployee === "object"
                        ? viewModal.data.assignedEmployee?.name
                        : viewModal.data.assignedEmployee ||
                          viewModal.data.assignedTo ||
                          viewModal.data.owner ||
                          "Unassigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Assigned Personnel:
                    </p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewModal.data.assignedTo ||
                        viewModal.data.owner ||
                        "Unassigned"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Note /Remarks::
                    </p>
                    <p className="font-semibold text-slate-800 mt-0.5">
                      {viewModal.data.notes ||
                        viewModal.data.description ||
                        viewModal.data.remark ||
                        "No Additional notes recorded for tgis lead."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </LeadModal>
      </div>
    </div>
  );
}
