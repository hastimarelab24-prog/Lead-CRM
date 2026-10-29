import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faHourglassHalf, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { IoRemoveCircle } from "react-icons/io5";

export default function FollowUp() {
  const [pending, setPending] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); 

  useEffect(() => {
    fetchFollowUps();
  }, []);

  const getAuthHeader = () => {
    const token = localStorage.getItem("token") || localStorage.getItem("authToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchFollowUps = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/leads/follow-ups/all", {
        headers: getAuthHeader(),
      });
      setPending(res.data.pending || []);
      setCompleted(res.data.completed || res.data.complated || []);
      setOverdue(res.data.overdue || []);
    } catch (err) {
      console.error("Error fetching follow-ups", err);
    }
  };

  const markAsCompleted = async (id) => {
    try {
      await axios.put(
        `http://localhost:5000/api/leads/follow-ups/${id}`,
        { followUpStatus: "Completed" },
        { headers: getAuthHeader() }
      );
      fetchFollowUps(); // Refresh data
    } catch (err) {
      alert("Failed to update status");
    }
  };

const deleteFollowUp = async (id) => {
  if (
    !window.confirm(
      "Are you sure you want to remove this follow-up?"
    )
  ) {
    return;
  }

  try {
    const response = await axios.delete(
      `http://localhost:5000/api/leads/follow-ups/${id}`,
      {
        headers: getAuthHeader(),
      }
    );

    console.log(response.data.message);

    await fetchFollowUps();
  } catch (err) {
    console.error(
      "Delete error:",
      err.response?.status,
      err.response?.data || err.message
    );

    alert(
      err.response?.data?.message ||
        "Failed to remove follow-up."
    );
  }
};

  // Combine all follow-ups for the "All" tab
  const allFollowUps = [...pending, ...completed];

  // Determine list to display based on active tab
  const getDisplayedData = () => {
    switch (activeTab) {
      case "pending":
        return pending;
      case "completed":
        return completed;
      case "all":
      default:
        return allFollowUps;
    }
  };

  // Helper to identify item status (Pending vs Completed)
  const isCompletedItem = (item) => {
    return (
      item.followUpStatus === "Completed" ||
      completed.some((compItem) => compItem._id === item._id)
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Follow-ups Management</h2>

      {/* Notifications / Overdue Alert Box */}
      {overdue.length > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow">
          <p className="font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faExclamationTriangle} /> Notification / Overdue Alert
          </p>
          <p>You have {overdue.length} overdue follow-up tasks that require your attention!</p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex space-x-4 border-b mb-4 pb-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "all"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          All Follow-ups ({allFollowUps.length})
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "pending"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Pending Follow-ups ({pending.length})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 font-semibold ${
            activeTab === "completed"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Completed Follow-ups ({completed.length})
        </button>
      </div>

      {/* Table Content */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Follow-up Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status / Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {getDisplayedData().map((item) => {
              const completedStatus = isCompletedItem(item);
              return (
                <tr key={item._id} className="group hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{item.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.followUpDate ? new Date(item.followUpDate).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        item.priority === "High"
                          ? "bg-red-200 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.priority || "Medium"}
                    </span>
                  </td>
                  <td className="px-6 py-4">{item.followUpNote || "No notes"}</td>
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                    {completedStatus ? (
                      <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
                        <FontAwesomeIcon icon={faCheck} />
                      </span>
                    ) : (
                      <button
                        onClick={() => markAsCompleted(item._id)}
                        className="text-amber-600 hover:text-amber-800 px-2 py-1 rounded text-lg transition-colors"
                        title="Mark as Completed"
                      >
                        <FontAwesomeIcon icon={faHourglassHalf} />
                      </button>
                    )}
                    
                    {/* Delete button appears only on row hover */}
                    <button
                      onClick={() => deleteFollowUp(item._id)}
                      className="text-red-500 hover:text-red-700 p-1 text-xl transition-opacity duration-200 opacity-0 group-hover:opacity-100"
                      title="Delete Follow-up"
                    >
                      <IoRemoveCircle />
                    </button>
                  </td>
                </tr>
              );
            })}
            {getDisplayedData().length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No follow-ups found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}