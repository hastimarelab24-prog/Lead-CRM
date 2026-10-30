
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faHourglassHalf,
  faExclamationTriangle,
  faCalendarAlt,
  faRefresh
} from "@fortawesome/free-solid-svg-icons";
import { IoRemoveCircle } from "react-icons/io5";

const API = "http://localhost:5000/api/follow-ups";

export default function FollowUp() {
  const [followUps, setFollowUps] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  const getAuthHeader = () => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken");

    return token
      ? { Authorization: `Bearer ${token}` }
      : {};
  };

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);

      const res = await axios.get(API, {
        headers: getAuthHeader()
      });

      // Backend returns all records from FollowUp collection
      setFollowUps(res.data.followUps || []);

    } catch (error) {
      console.error(
        "Fetch Follow-ups Error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
        "Failed to load follow-ups."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const getStatus = (item) =>
    String(item.status || "pending").toLowerCase();

  const pending = followUps.filter(
    item => getStatus(item) === "pending"
  );

  const completed = followUps.filter(
    item => getStatus(item) === "completed"
  );

  const cancelled = followUps.filter(
    item => getStatus(item) === "cancelled"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = pending.filter(item => {
    if (!item.dueDate) return false;

    const due = new Date(item.dueDate);
    due.setHours(0, 0, 0, 0);

    return due < today;
  });

  const getDisplayedData = () => {
    switch (activeTab) {
      case "pending":
        return pending;

      case "completed":
        return completed;

      case "overdue":
        return overdue;

      case "cancelled":
        return cancelled;

      case "all":
      default:
        return followUps;
    }
  };

  const markAsCompleted = async (id) => {
    try {
      await axios.patch(
        `${API}/${id}/complete`,
        {},
        { headers: getAuthHeader() }
      );

      await fetchFollowUps();

    } catch (error) {
      console.error("Complete Error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to complete follow-up."
      );
    }
  };

  const deleteFollowUp = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel this follow-up?"
      )
    ) {
      return;
    }

    try {
      await axios.delete(`${API}/${id}`, {
        headers: getAuthHeader()
      });

      await fetchFollowUps();

    } catch (error) {
      console.error("Delete Error:", error);

      alert(
        error.response?.data?.message ||
        "Failed to cancel follow-up."
      );
    }
  };

  const getPriorityClass = (priority) => {
    switch (String(priority || "medium").toLowerCase()) {
      case "urgent":
      case "high":
        return "bg-red-100 text-red-700";

      case "low":
        return "bg-green-100 text-green-700";

      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "cancelled":
        return "bg-gray-100 text-gray-600";

      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsed = new Date(date);

    return Number.isNaN(parsed.getTime())
      ? "N/A"
      : parsed.toLocaleDateString("en-IN");
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">

      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Follow-ups Management
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Manage all lead follow-up activities.
          </p>
        </div>

        <button
          onClick={fetchFollowUps}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FontAwesomeIcon icon={faRefresh} className="mr-2" />
          Refresh
        </button>
      </div>

      {overdue.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <p className="font-semibold text-red-700">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="mr-2"
            />
            Overdue Follow-ups
          </p>

          <p className="text-sm text-red-600 mt-1">
            You have {overdue.length} overdue follow-up tasks.
          </p>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">All Follow-ups</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {followUps.length}
          </h3>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Pending</p>
          <h3 className="text-2xl font-bold text-blue-600">
            {pending.length}
          </h3>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Completed</p>
          <h3 className="text-2xl font-bold text-green-600">
            {completed.length}
          </h3>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm text-gray-500">Overdue</p>
          <h3 className="text-2xl font-bold text-red-600">
            {overdue.length}
          </h3>
        </div>

      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b mb-5 pb-2">

        {[
          ["all", `All (${followUps.length})`],
          ["pending", `Pending (${pending.length})`],
          ["completed", `Completed (${completed.length})`],
          ["overdue", `Overdue (${overdue.length})`],
          ["cancelled", `Cancelled (${cancelled.length})`]
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-semibold ${
              activeTab === key
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}

      </div>

      {/* Follow-up Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">

        <table className="min-w-[950px] w-full">

          <thead className="bg-gray-100">
            <tr>
              {[
                "Lead Name",
                "Phone",
                "Follow-up Title",
                "Type",
                "Date",
                "Priority",
                "Assigned To",
                "Notes",
                "Status",
                "Action"
              ].map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">

            {loading ? (
              <tr>
                <td colSpan="10" className="text-center py-10">
                  Loading follow-ups...
                </td>
              </tr>
            ) : getDisplayedData().length === 0 ? (
              <tr>
                <td
                  colSpan="10"
                  className="text-center py-10 text-gray-500"
                >
                  No follow-ups found.
                </td>
              </tr>
            ) : (
              getDisplayedData().map(item => {

                const status = getStatus(item);

                const lead =
                  item.lead && typeof item.lead === "object"
                    ? item.lead
                    : {};

                return (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50"
                  >

                    <td className="px-4 py-4 font-medium text-gray-800">
                      {lead.name || item.name || "N/A"}
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {lead.phone || item.phone || "N/A"}
                    </td>

                    <td className="px-4 py-4 text-sm font-medium">
                      {item.title || "Follow-up"}
                    </td>

                    <td className="px-4 py-4 text-sm capitalize">
                      {item.type || item.activityType || "Call"}
                    </td>

                    <td className="px-4 py-4 text-sm whitespace-nowrap">
                      <FontAwesomeIcon
                        icon={faCalendarAlt}
                        className="mr-2 text-gray-400"
                      />
                      {formatDate(item.dueDate)}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityClass(item.priority)}`}>
                        {item.priority || "Medium"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm">
                      {item.assignedTo?.name || "N/A"}
                    </td>

                    <td className="px-4 py-4 text-sm max-w-[180px]">
                      {item.notes || "No notes"}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${getStatusClass(status)}`}>
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap">

                      <div className="flex items-center gap-3">

                        {status === "pending" && (
                          <button
                            onClick={() => markAsCompleted(item._id)}
                            title="Mark as completed"
                            className="text-green-600 hover:text-green-800"
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                        )}

                        {status === "pending" && (
                          <button
                            onClick={() => deleteFollowUp(item._id)}
                            title="Cancel follow-up"
                            className="text-red-500 hover:text-red-700 text-xl"
                          >
                            <IoRemoveCircle />
                          </button>
                        )}

                        {status === "completed" && (
                          <span className="text-green-600">
                            <FontAwesomeIcon icon={faCheck} />
                          </span>
                        )}

                        {status === "cancelled" && (
                          <span className="text-gray-400">
                            Cancelled
                          </span>
                        )}

                      </div>

                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>
      </div>

    </div>
  );
}
