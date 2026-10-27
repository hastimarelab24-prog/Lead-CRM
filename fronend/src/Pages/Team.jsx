import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../api/api";
import { Link } from "react-router-dom";


const Team = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    loadUsers();
  }, [loadUsers]);

  return (
    <div className="container-fluid px-4 mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Team Management</h2>
        <Link to="/team/create" className="btn btn-primary">
          + Add User
        </Link>
      </div>

      {loading && <p>Loading users...</p>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && (
        <div className="card shadow-sm">
          <div className="table-responsive">
            <table className="table table-bordered table-hover mb-0 align-middle">
              <thead className="table-dark">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th style={{ width: "180px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id || user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span
                        className={`badge ${
                          user.isActive ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                    
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-muted">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;