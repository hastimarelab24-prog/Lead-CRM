
import React, { useEffect, useState } from "react";
import { apiRequest } from "../../api/api";
import { data } from "react-router-dom";

const SOURCES = [
  "website",
  "referral",
  "cold outreach",
  "inbound call",
  "social media",
];

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal sent",
  "nurturing",
  "lost",
  "won",
];

const INITIAL_FORM = { name: "", company: "", email: "", phone: "", source: "", status: "new", assignedEmployee: "", followUpDate: "", followUpTime:"", followUpType:"", priority: "Medium", followUpNote: "",
};

export default function LeadForm({
  initialData = null,
  onSubmit,
  onClose,
}) {
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Load active employees
  useEffect(() => {
    let cancelled = false;

    const fetchEmployees = async () => {
      try {
        setLoadingEmployees(true);
        const data = await apiRequest("get", "/users/employees");
        const users = Array.isArray(data)
          ? data
          : data?.users || data?.data || [];

        const employeeList = users.filter(
          (user) =>
            user.role?.toLowerCase() === "employee" &&
            user.isActive !== false
        );

        if (!cancelled) {
          setEmployees(employeeList);
        }
      } catch (error) {
        console.error(
          "Failed to load employees:",
          error.response?.data || error.message
        );

        if (!cancelled) {
          setSubmitError(
            error.response?.data?.message ||
              "Could not load employees. Check your login and permissions."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingEmployees(false);
        }
      }
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      const assignedEmployee =
        typeof initialData.assignedEmployee === "object"
          ? initialData.assignedEmployee?._id || ""
          : initialData.assignedEmployee || "";

      let formattedDate = ""; let formattedTime= "";
      const dataeObje=new Date(initialData.followUpDate);
      if(!isNaN(dataeObje)){
        formattedDate = dataeObje.toISOString().split("T")[0];
        formattedTime= dataeObje.toTimeString().substring(0,5)
      }
      // if (initialData.followUpDate) {
      //   formattedDate = initialData.followUpDate.includes("T")
      //     ? initialData.followUpDate.split("T")[0]
      //     : initialData.followUpDate.substring(0, 10);
      // }

      setFormData({
        name: initialData.name || "",
        company: initialData.company || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        source: initialData.source || "",
        status: initialData.status || "new",
        assignedEmployee,
        followUpDate: formattedDate,
        followUpTime:formattedTime || initialData.followUpTime || "",
        activityTYpe:initialData.activityTYpe || "Call",
        priority: initialData.priority || "Medium",
        followUpNote: initialData.followUpNote || "",
      });
    } else {
      setFormData({ ...INITIAL_FORM });
    }

    setErrors({});
    setSubmitError("");
  }, [initialData]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitError("");
  };

  const validateForm = () => {
    const nextErrors = {};

    if (formData.name.trim().length < 2) {
      nextErrors.name = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!SOURCES.includes(formData.source)) {
      nextErrors.source = "Please select a lead source.";
    }

    if (!STATUSES.includes(formData.status)) {
      nextErrors.status = "Please select a lead status.";
    }

    if (!formData.assignedEmployee) {
      nextErrors.assignedEmployee = "Please select an employee.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setErrors({});
    setSubmitError("");

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    let cominedDateTime = null;
    if(formData.followUpDate){
      const timeString = formData.followUpTime ? formData.followUpTime :"00:00";
      cominedDateTime=new Date(`${formData.followUpDate }T${timeString}:00`).toISOString()
    }
    const payload = {
      name: formData.name.trim(),
      company: formData.company.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      source: formData.source,
      status: formData.status,
      assignedEmployee: formData.assignedEmployee,
      followUpDate: cominedDateTime,
      activityTYpe:formData.activityTYpe,
      priority: formData.priority,
      followUpNote: formData.followUpNote.trim(),
    };

    try {
      setSaving(true);

      if (typeof onSubmit !== "function") {
        throw new Error("Lead submit handler is missing.");
      }

      await onSubmit(payload);
    } catch (error) {
      console.error(
        "Save lead failed:",
        error.response?.data || error
      );

      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "Unable to save lead. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100";

  const labelClass =
    "mb-1.5 block text-sm font-semibold text-gray-700";

  const renderError = (field) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-600" role="alert">
        {errors[field]}
      </p>
    ) : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-xl bg-white p-5 sm:p-7"
    >
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          {initialData ? "Update Lead" : "Register New Lead"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Enter lead details and select an employee.
        </p>
      </div>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>
          Full Name *
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter full name"
          required
          minLength={2}
          className={inputClass}
          aria-invalid={Boolean(errors.name)}
        />
        {renderError("name")}
      </div>

      <div>
        <label htmlFor="company" className={labelClass}>
          Company
        </label>
        <input
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="Enter company name"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email Address *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@example.com"
          required
          className={inputClass}
          aria-invalid={Boolean(errors.email)}
        />
        {renderError("email")}
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone Number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter phone number"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="source" className={labelClass}>
          Lead Source *
        </label>
        <select
          id="source"
          name="source"
          value={formData.source}
          onChange={handleChange}
          required
          className={inputClass}
          aria-invalid={Boolean(errors.source)}
        >
          <option value="">Select lead source</option>
          {SOURCES.map((source) => (
            <option key={source} value={source}>
              {source.replace(/\b\w/g, (char) => char.toUpperCase())}
            </option>
          ))}
        </select>
        {renderError("source")}
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Lead Status *
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
          className={inputClass}
          aria-invalid={Boolean(errors.status)}
        >
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace(/\b\w/g, (char) => char.toUpperCase())}
            </option>
          ))}
        </select>
        {renderError("status")}
      </div>

      <div>
        <label htmlFor="assignedEmployee" className={labelClass}>
          Assigned Employee *
        </label>
        <select
          id="assignedEmployee"
          name="assignedEmployee"
          value={formData.assignedEmployee}
          onChange={handleChange}
          required
          disabled={loadingEmployees}
          className={inputClass}
          aria-invalid={Boolean(errors.assignedEmployee)}
        >
          <option value="">
            {loadingEmployees
              ? "Loading employees..."
              : employees.length
                ? "Select Employee"
                : "No active employees found"}
          </option>

          {employees.map((employee) => (
            <option
              key={employee._id || employee.id}
              value={employee._id || employee.id}
            >
              {employee.name} ({employee.email})
            </option>
          ))}
        </select>
        {renderError("assignedEmployee")}
      </div>

      {/* Follow-up Section */}
      <div className="border-t pt-4">
        <h4 className="text-md font-bold text-gray-800 mb-3">Follow-up Details</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Follow-up Date</label>
            <input 
              type="date" 
              name="followUpDate" 
              value={formData.followUpDate} 
              onChange={handleChange} 
              className={inputClass} 
            />
          </div>

          <div>
            <label htmlFor="" className={labelClass}> Time</label>
            <input type="time" name="FollowupTime" value={formData.followUpTime} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <select 
              name="priority" 
              value={formData.priority} 
              onChange={handleChange} 
              className={inputClass}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <label className={labelClass}>Follow-up Note</label>
          <textarea 
            name="followUpNote" 
            value={formData.followUpNote} 
            onChange={handleChange} 
            placeholder="enter follow-ups remarks.."
            rows={3} 
            className={inputClass} 
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || loadingEmployees}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving
            ? "Saving..."
            : initialData
              ? "Update Lead"
              : "Save Lead"}
        </button>
      </div>
    </form>
  );
}