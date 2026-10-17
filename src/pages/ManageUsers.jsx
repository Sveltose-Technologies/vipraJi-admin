import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, updateUserStatus } from "../api/auth";
import toast from "react-hot-toast";
import {
  MdPerson,
  MdEmail,
  MdPhone,
  MdVerified,
  MdOutlineErrorOutline,
  MdSearch,
  MdFilterList,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import Modal from "../components/Modal";

const ManageUsers = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users"],
    queryFn: getAllUsers,
  });

  // Persistent status overrides to ensure UI reacts immediately and persists even if backend projection omits status
  const [statusOverrides, setStatusOverrides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user_status_overrides') || '{}');
    } catch {
      return {};
    }
  });

  const getUserStatus = (user) => {
    const userId = user._id || user.id;
    if (userId && statusOverrides[userId]) {
      return statusOverrides[userId];
    }
    return user.status === "deactive" || user.status === "inactive" ? "deactive" : "active";
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateUserStatus(id, status),
  });

  const handleStatusToggle = (user) => {
    const userId = user._id || user.id;
    if (!userId) return;
    const currentStatus = getUserStatus(user);
    const newStatus = currentStatus === "active" ? "deactive" : "active";

    // Immediate optimistic update
    setStatusOverrides((prev) => {
      const updated = { ...prev, [userId]: newStatus };
      try {
        localStorage.setItem('user_status_overrides', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    statusMutation.mutate(
      { id: userId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(newStatus === "active" ? "User status changed to Active" : "User status changed to Deactive");
        },
        onError: () => {
          // Rollback on error
          setStatusOverrides((prev) => {
            const reverted = { ...prev, [userId]: currentStatus };
            try {
              localStorage.setItem('user_status_overrides', JSON.stringify(reverted));
            } catch (e) {
              console.error(e);
            }
            return reverted;
          });
          toast.error("Failed to update status on server");
        }
      }
    );
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const users = data?.data || data?.auths || data?.users || (Array.isArray(data) ? data : []);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // 1. Search Query (Name, Email, Phone)
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (user.fullName && user.fullName.toLowerCase().includes(query)) ||
        (user.displayName && user.displayName.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.mobileNumber && user.mobileNumber.toLowerCase().includes(query));

      // 2. Role Filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      // 3. Status Filter
      const userStatus = getUserStatus(user);
      const matchesStatus =
        statusFilter === "all" || userStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter, statusOverrides]);

  if (isLoading) {
    return (
      <div
        className="page-content"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <div
          className="spinner"
          style={{
            width: "40px",
            height: "40px",
            borderTopColor: "var(--primary-color)",
          }}
        ></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div
        className="page-content"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          color: "var(--error-color)",
        }}
      >
        <MdOutlineErrorOutline size={48} style={{ marginBottom: "1rem" }} />
        <h2>Error Loading Users</h2>
        <p>
          {error.message ||
            "An unexpected error occurred while fetching users."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="animate-fade-in ecom-layout"
      style={{ paddingTop: "0.5rem" }}
    >
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        title="Filters"
      >
        <div className="filter-section">
          <h4>Role</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input
                type="radio"
                name="role"
                checked={roleFilter === "all"}
                onChange={() => setRoleFilter("all")}
              />
              All Roles
            </label>
            <label className="filter-label">
              <input
                type="radio"
                name="role"
                checked={roleFilter === "admin"}
                onChange={() => setRoleFilter("admin")}
              />
              Admin
            </label>
            <label className="filter-label">
              <input
                type="radio"
                name="role"
                checked={roleFilter === "user"}
                onChange={() => setRoleFilter("user")}
              />
              User
            </label>
          </div>
        </div>

        <div className="filter-section">
          <h4>Account Status</h4>
          <div className="filter-options">
            <label className="filter-label">
              <input
                type="radio"
                name="status"
                checked={statusFilter === "all"}
                onChange={() => setStatusFilter("all")}
              />
              All Status
            </label>
            <label className="filter-label">
              <input
                type="radio"
                name="status"
                checked={statusFilter === "active"}
                onChange={() => setStatusFilter("active")}
              />
              Active
            </label>
            <label className="filter-label">
              <input
                type="radio"
                name="status"
                checked={statusFilter === "deactive" || statusFilter === "inactive"}
                onChange={() => setStatusFilter("deactive")}
              />
              Deactive
            </label>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: "1rem" }}
          onClick={() => setIsFilterModalOpen(false)}
        >
          Apply Filters
        </button>
      </Modal>

      <div className="ecom-container">
        {/* RIGHT MAIN: LIST VIEW & SEARCH */}
        <main className="ecom-main">
          {/* Search Bar */}
          <div
            className="search-container glass-panel"
            style={{
              position: "sticky",
              top: "0.75rem",
              zIndex: 40,
              marginBottom: "1.25rem",
              display: "flex",
              gap: "1rem",
              alignItems: "center",
              padding: "0.75rem 1.5rem",
              background: "rgba(255, 255, 255, 0.97)",
              border: "1px solid var(--border-color)",
              boxShadow: "0 8px 20px rgba(31, 41, 55, 0.08)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
              <MdSearch className="search-icon" size={24} />
              <input
                type="text"
                className="search-input"
                aria-label="Search users"
                style={{ padding: "0.5rem 0", minWidth: 0 }}
                placeholder="Search users by name, email, or mobile number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Active Filters */}
            <div
              style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
            >
              {statusFilter !== "all" && (
                <span
                  className="detail-tag"
                  style={{ margin: 0, textTransform: "capitalize" }}
                >
                  Status: {statusFilter}
                </span>
              )}
              {roleFilter !== "all" && (
                <span
                  className="detail-tag"
                  style={{ margin: 0, textTransform: "capitalize" }}
                >
                  Role: {roleFilter}
                </span>
              )}

              {(statusFilter !== "all" ||
                roleFilter !== "all" ||
                searchQuery !== "") && (
                <button
                  className="btn btn-outline"
                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.85rem" }}
                  onClick={() => {
                    setRoleFilter("all");
                    setStatusFilter("all");
                    setSearchQuery("");
                  }}
                >
                  Clear All
                </button>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setIsFilterModalOpen(true)}
              style={{
                padding: "0.5rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <MdFilterList size={20} />
              Filters
            </button>
          </div>

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "3rem",
                textAlign: "center",
                marginTop: "1.5rem",
              }}
            >
              <MdPerson
                size={64}
                style={{ color: "var(--border-color)", marginBottom: "1rem" }}
              />
              <h3>No Users Found</h3>
              <p style={{ color: "var(--text-secondary)" }}>
                Try adjusting your search query or filters.
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ overflowX: "auto" }}>
              <table
                className="data-table users-table"
                style={{ minWidth: "900px", tableLayout: "fixed" }}
              >
                <colgroup>
                  <col style={{ width: "24%" }} />
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left" }}>Name</th>
                    <th style={{ textAlign: "left" }}>Contact</th>
                    <th style={{ textAlign: "left" }}>Role</th>
                    <th style={{ textAlign: "left" }}>Status</th>
                    <th style={{ textAlign: "left" }}>Joined</th>
                    <th style={{ textAlign: "left" }}>Reset OTP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const userStatus = getUserStatus(user);
                    const isDeactive = userStatus === "deactive";
                    return (
                    <tr key={user._id || user.id}>
                      <td style={{ textAlign: "left" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            minWidth: "170px",
                          }}
                        >
                          <div
                            className="user-avatar-large"
                            style={{
                              width: "38px",
                              height: "38px",
                              flex: "0 0 38px",
                              fontSize: "1rem",
                            }}
                          >
                            {user.profilePhoto ? (
                              <img
                                src={user.profilePhoto}
                                alt=""
                                className="avatar-img"
                              />
                            ) : (
                              <span>
                                {user.displayName
                                  ? user.displayName.charAt(0).toUpperCase()
                                  : user.fullName
                                  ? user.fullName.charAt(0).toUpperCase()
                                  : "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                overflowWrap: "anywhere",
                              }}
                            >
                              {user.displayName || user.fullName || "Unnamed User"}
                            </div>
                            {user.displayName && user.fullName && user.displayName !== user.fullName && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                {user.fullName}
                              </div>
                            )}
                          </div>
                        </div>
                        {user.experience ? (
                          <div
                            style={{
                              color: "var(--text-secondary)",
                              fontSize: "0.8rem",
                              margin: "0.3rem 0 0 3.25rem",
                            }}
                          >
                            {user.experience} yrs experience
                          </div>
                        ) : null}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        <div
                          style={{
                            display: "grid",
                            gap: "0.35rem",
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.4rem",
                              overflowWrap: "anywhere",
                            }}
                          >
                            <MdEmail
                              style={{
                                flex: "0 0 auto",
                                color: "var(--text-secondary)",
                                marginTop: "0.15rem",
                              }}
                            />
                            {user.email || "—"}
                          </span>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.4rem",
                            }}
                          >
                            <MdPhone
                              style={{
                                flex: "0 0 auto",
                                color: "var(--text-secondary)",
                              }}
                            />
                            {user.mobileNumber || "—"}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: "left" }}>
                        <span
                          className="user-role-badge"
                          style={{ display: "inline-block", width: "auto" }}
                        >
                          {user.role || "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "left" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "6px" }}>
                          <label
                            className="toggle-switch"
                            title={isDeactive ? "Click to Activate" : "Click to Deactivate"}
                            style={{ cursor: "pointer" }}
                          >
                            <input 
                              type="checkbox" 
                              checked={!isDeactive}
                              onChange={() => handleStatusToggle(user)}
                              disabled={statusMutation.isPending}
                            />
                            <span
                              className="toggle-slider"
                              style={{
                                backgroundColor: !isDeactive ? "#16a34a" : "#cbd5e1",
                                transition: "background-color 0.3s ease"
                              }}
                            ></span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleStatusToggle(user)}
                            disabled={statusMutation.isPending}
                            className={`user-status-badge ${isDeactive ? "inactive" : "active"}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "auto",
                              border: "none",
                              cursor: "pointer",
                              padding: "0.25rem 0.65rem",
                              borderRadius: "12px",
                              transition: "all 0.2s ease"
                            }}
                            title={`Status: ${isDeactive ? "Deactive" : "Active"}. Click to toggle.`}
                          >
                            {isDeactive ? "DEACTIVE" : "ACTIVE"}
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td style={{ textAlign: "left" }}>
                        {user.resetOtpVerified ? (
                          <span
                            style={{
                              color: "var(--success-color)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <MdCheckCircle /> Verified
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--error-color)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                            }}
                          >
                            <MdCancel /> Not verified
                          </span>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
      <style>{`
        .users-table th,
        .users-table td {
          padding: 0.9rem 0.8rem;
          vertical-align: middle;
        }

        @media (max-width: 720px) {
          .search-container {
            flex-wrap: wrap;
            padding: 0.75rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ManageUsers;
