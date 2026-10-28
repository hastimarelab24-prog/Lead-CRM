import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";

const CreateUser = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setError("");
      setLoading(true);

      const data = await apiRequest("/users", "post", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      alert(data.message || "team member created SUCCESSFULLY!");
      setForm({
        name: "",
        email: "",
        password: "",
        role: "employee",
      });

      if (onSuccess) onSuccess();
      if (onClose) onClose();
      // navigate("/team");
    } catch (error) {
      console.error("Create user failed:", error.response?.data || error);

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to create user",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Add team member
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Create a new team record and assign system roles.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-rose-200 text-rose-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block  text-xs font-semibold text-slate-700 uppercase mb-1">
              Full Name
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-sm outline-none"
              name="name"
              type="text"
              placeholder="e.g. enter name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="block  text-xs font-semibold text-slate-700 uppercase mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-sm outline-none"
              name="email"
              value={form.email}
              placeholder="enter Your email "
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="block  text-xs font-semibold text-slate-700 uppercase mb-1">
              Temporary Password
            </label>
            <input
              type="password"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-sm outline-none"
              name="password"
              minLength={8}
              placeholder="Enter Password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="block  text-xs font-semibold text-slate-700 uppercase mb-1">
              Role
            </label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl text-sm outline-none"
              name="role"
              value={form.role}
              onChange={handleChange}
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors cursor-pointer"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all disabled:opacity-50 cursor-pointer text-white text-xs font-semibold shadow-lg shadow-indigo-600/20" 
            disabled={loading}>
            {loading ? "Creating..." : "Create User"}
          </button>
          </div>
          
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
