
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/api";

const CreateUser = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

 

 
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
    setError("")
    setLoading(true);

   const data= await apiRequest( "/users","post" ,{
    name:form.name,email:form.email,password:form.password,role:form.role,   });
    alert(data.message || "team member created SUCCESSFULLY!")
    setForm(  {
      name:"",email:"",password:"",role:"employee",
    })

    // navigate("/team");

} catch (error) {
  console.error("Create user failed:", error.response?.data || error);

  setError(
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    "Failed to create user"
  );
} finally {
  setLoading(false);
}

};
 return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <h2>Create Team Member</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Full Name</label>
          <input
            className="form-control"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Temporary Password</label>
          <input
            type="password"
            className="form-control"
            name="password"
            minLength={8}
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Role</label>
          <select
            className="form-select"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="administrator">Administrator</option>
          </select>
        </div>

        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Creating..." : "Create User"}
        </button>

        <button
          type="button"
          className="btn btn-secondary ms-2"
          onClick={() => navigate("/team")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
};

export default CreateUser;
