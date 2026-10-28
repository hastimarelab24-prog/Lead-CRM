const handleRemoveUser = async (userId, userName) => {
  if (!userId) {
    alert("User ID not found.");
    return;
  }

  if (
    !window.confirm(
      `Are you sure you want to remove ${userName} from the team?`
    )
  ) {
    return;
  }

  try {
    const result = await apiRequest(`/users/${userId}`, "DELETE");

    setUsers((prev) =>
      prev.filter((user) => String(user._id || user.id) !== String(userId))
    );

    alert(result.message || "Team member deleted successfully.");
  } catch (err) {
    console.error(
      "Failed to remove user:",
      err.response?.data || err
    );

    alert(
      err.response?.data?.message ||
        "Failed to delete team member."
    );
  }
};