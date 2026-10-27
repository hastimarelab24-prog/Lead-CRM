// import React from "react";

// export default function LeadTable({ leads, onEdit, onDelete, onStatusChange }) {
//   return (
//     <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
//       <table className="w-full text-left border-collapse">
//         <thead className="bg-gray-50 border-b text-xs text-gray-700 uppercase">
//           <tr>
//             <th className="p-4">Name</th>
//             <th className="p-4">Company</th>
//             <th className="p-4">Email</th>
//             <th className="p-4">Source</th>
//             <th className="p-4">Status</th>
//             <th className="p-4 text-right">Actions</th>
//           </tr>
//         </thead>
//         <tbody className="divide-y text-sm">
//           {leads.length === 0 ? (
//             <tr>
//               <td colSpan="6" className="p-6 text-center text-gray-500">
//                 No active leads found in the system registry.
//               </td>
//             </tr>
//           ) : (
//             leads.map((lead, index) => (
//               <tr key={lead._id || index} className="hover:bg-gray-50">
//                 <td className="p-4 font-medium text-gray-950">
//                   {lead.name || lead.Name || lead.leadName || lead.clientName || "-"}
//                 </td>
//                 <td className="p-4 text-gray-600">
//                   {lead.company || lead.Company || lead.companyName || "-"}
//                 </td>
//                 <td className="p-4 text-gray-600">
//                   {lead.email || lead.Email || lead.clientEmail || "-"}
//                 </td>
//                 <td className="p-4 text-gray-600">
//                   {lead.source || "Website"}
//                 </td>
//                 <td className="p-4">
//                   <select
//                     value={lead.status || "New"}
//                     onChange={(e) => onStatusChange(lead._id, e.target.value)}
//                     className="border rounded px-2 py-1 text-sm bg-white"
//                   >
//                     {["New", "Contacted", "Qualified", "Proposal Sent", "Nurturing", "Lost", "Won"].map((s) => (
//                       <option key={s} value={s}>{s}</option>
//                     ))}
//                   </select>
//                 </td>
//                 <td className="p-4 text-right space-x-2">
//                   <button
//                     onClick={() => onEdit(lead)}
//                     className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
//                   >
//                     Edit
//                   </button>
//                   <button
//                     onClick={() => onDelete(lead._id)}
//                     className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
//                   >
//                     Delete
//                   </button>
//                 </td>
//               </tr>
//             ))
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// }


import React from "react";

export default function LeadTable({ leads, onEdit, onDelete, onStatusChange, onView }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-100/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="py-4 px-6">Name</th>
            <th className="py-4 px-6">Company</th>
            <th className="py-4 px-6">Email</th>
            <th className="py-4 px-6">Source</th>
            <th className="py-4 px-6">Status</th>
            <th className="py-4 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {leads.length === 0 ? (
            <tr>
              <td colSpan="6" className="p-8 text-center text-slate-400 font-medium">
                No active leads found in the system registry.
              </td>
            </tr>
          ) : (
            leads.map((lead, index) => (
              <tr 
                key={lead._id || index} 
                className="transition-colors hover:bg-slate-50/80 group border-b border-slate-100 last:border-none"
              >
                <td className="py-4 px-6 font-semibold text-slate-900">
                  {lead.name || lead.Name || lead.leadName || lead.clientName || "-"}
                </td>
                <td className="py-4 px-6 text-slate-600">
                  {lead.company || lead.Company || lead.companyName || "-"}
                </td>
                <td className="py-4 px-6 text-slate-600 font-mono text-xs">
                  {lead.email || lead.Email || lead.clientEmail || "-"}
                </td>
                <td className="py-4 px-6">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                    {lead.source || "Website"}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <select
                    value={lead.status || "New"}
                    onChange={(e) => onStatusChange(lead._id, e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 focus:border-indigo-600 rounded-lg text-xs font-medium text-slate-700 outline-none transition-all duration-200 focus:ring-2 focus:ring-indigo-600/10 cursor-pointer"
                  >
                    {["New", "Contacted", "Qualified", "Proposal Sent", "Nurturing", "Lost", "Won"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* View Icon Button */}
                    {onView && (
                      <button
                        onClick={() => onView(lead)}
                        title="View Details"
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}

                    {/* Edit Icon Button */}
                    <button
                      onClick={() => onEdit(lead)}
                      title="Edit Lead"
                      className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

                    {/* Delete Icon Button */}
                    <button
                      onClick={() => onDelete(lead._id)}
                      title="Delete Lead"
                      className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}