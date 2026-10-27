import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { Link } from "react-router-dom";
import RoleSelector from "./RoleSelector";

const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get current logged-in user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const loadUsers = useCallback(async () => {
    try {
      setError("");
      setLoading(true);
      const data = await apiRequest("/users", "GET");

      setUsers(
        Array.isArray(data)
          ? data
          : Array.isArray(data.users)
          ? data.users
          : []
      );
    } catch (err) {
      console.error("Failed to load users:", err.response?.data || err);
      setError(
        err.response?.data?.message || err.message || "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // If not admin, do not try to load users and show custom message
    if (currentUser.role !== "administrator") {
      setLoading(false);
      setError("Access denied. Administrator privileges required.");
      return;
    }
    loadUsers();
  }, [loadUsers, currentUser.role]);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Team Management</h2>
        {currentUser.role === "administrator" && (
          <Link to="/team/create" className="btn btn-primary">
            + Add User
          </Link>
        )}
      </div>

      {loading && <p>Loading users...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id || user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    <RoleSelector
                      user={user}
                      onUpdated={loadUsers}
                    />
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Team;