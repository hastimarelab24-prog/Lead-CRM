import React from "react";

export default function LeadTable({ leads, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-gray-50 border-b text-xs text-gray-700 uppercase">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Company</th>
            <th className="p-4">Email</th>
            <th className="p-4">Source</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y text-sm">
          {leads.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-6 text-center text-gray-500">
                No active leads found in the system registry.
              </td>
            </tr>
          ) : (
            leads.map((lead, index) => (
              <tr key={lead._id || index} className="hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-950">
                  {lead.name || lead.Name || lead.leadName || lead.clientName || "-"}
                </td>
                <td className="p-4 text-gray-600">
                  {lead.company || lead.Company || lead.companyName || "-"}
                </td>
                <td className="p-4 text-gray-600">
                  {lead.email || lead.Email || lead.clientEmail || "-"}
                </td>
                <td className="p-4 text-gray-600">
                  {lead.source || "Website"}
                </td>
                <td className="p-4">
                  <select
                    value={lead.status || "New"}
                    onChange={(e) => onStatusChange(lead._id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm bg-white"
                  >
                    {["New", "Contacted", "Qualified", "Proposal Sent", "Nurturing", "Lost", "Won"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => onEdit(lead)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(lead._id)}
                    className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}