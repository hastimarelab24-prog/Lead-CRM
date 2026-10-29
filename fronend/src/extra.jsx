import React, { useState } from "react";
import Pagination from "../Components/Pagination";

// Inside your Leads component:
const [currentPage, setCurrentPage] = useState(1);
const itemsPerPage = 10;

// `leads` should be your complete records array.
const totalPage = Math.max(1, Math.ceil(leads.length / itemsPerPage));

const startIndex = (currentPage - 1) * itemsPerPage;
const currentLeads = leads.slice(
  startIndex,
  startIndex + itemsPerPage
);

const pagination = {
  currentPage,
  totalPage,
};

// Render `currentLeads` instead of `leads` in your table.
// Add this below your table:
<Pagination
  pagination={pagination}
  onPageChange={setCurrentPage}
/>



import React from "react";

export default function Pagination({ pagination, onPageChange }) {
  const { currentPage, totalPage } = pagination;
  const total = totalPage || 1;

  return (
    <div className="flex items-center justify-between gap-4 mt-4">
      <span>
        Page {currentPage} of {total}
      </span>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={currentPage >= total}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

setLeads(leadsData);

const pageData = response?.pagination || {
  currentPage: filters.page || 1,
  totalPages: Math.max(1, Math.ceil(leadsData.length / itemsPerPage)),
  totalItems: leadsData.length,
};

setPagination(pageData);
setCurrentPage(pageData.currentPage || filters.page || 1);

setTotalLeads(pageData.totalItems ?? leadsData.length); 