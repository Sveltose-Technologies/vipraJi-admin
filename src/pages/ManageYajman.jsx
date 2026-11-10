import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllYajmanEntries, updateYajmanEntry } from "../api/yajmanEntry";
import toast from "react-hot-toast";
import ManageYajmanCategory from "./ManageYajmanCategory";
import {
  MdPerson,
  MdOutlineErrorOutline,
  MdSearch,
  MdClose,
} from "react-icons/md";

const ManageYajman = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("yajmans");
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["yajman-entries"],
    queryFn: getAllYajmanEntries,
  });

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
        <h2>Error Loading Yajman Entries</h2>
        <p>
          {error.message ||
            "An unexpected error occurred while fetching yajman data."}
        </p>
      </div>
    );
  }

  // Fallback to empty array if structure differs slightly
  const yajmans = data?.data || data?.yajmans || data || [];
  // Ensure it's an array
  const yajmanList = Array.isArray(yajmans)
    ? yajmans
    : Array.isArray(data?.entries)
      ? data.entries
      : [];
  const getCategoryName = (yajman) => {
    const category = yajman.category;
    if (typeof category === "object" && category !== null) {
      return category.name || category.categoryName || "General";
    }
    return category || "General";
  };
  const getPhone = (yajman) =>
    yajman.mobile || yajman.phone || yajman.mobileNumber || "";
  const getLocation = (yajman) =>
    yajman.city || yajman.location || yajman.address || "";
  const filteredYajmans = yajmanList.filter((yajman) => {
    const searchableText = [
      yajman.name,
      yajman.fullName,
      getCategoryName(yajman),
      getPhone(yajman),
      getLocation(yajman),
      yajman.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return searchableText.includes(searchQuery.trim().toLowerCase());
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => updateYajmanEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["yajman-entries"]);
      toast.success("Yajman status updated successfully");
    },
    onError: () => {
      toast.error("Failed to update yajman status");
    }
  });

  const handleStatusToggle = (yajman) => {
    const yajmanId = yajman._id || yajman.id;
    if (!yajmanId) return;
    const currentStatus = (yajman.status || "active").toLowerCase();
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    statusMutation.mutate({ id: yajmanId, data: { status: newStatus } });
  };

  return (
    <div className="page-content animate-fade-in">
      <div
        className="top-header"
        style={{ marginBottom: "0.75rem", padding: 0, borderBottom: "none", minHeight: "unset" }}
      >
        <div>
          <h1
            className="page-title"
            style={{ color: "var(--text-primary)", marginBottom: "0.15rem", fontSize: "1.15rem" }}
          >
            Manage Yajman
          </h1>
          <p
            className="page-subtitle"
            style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: 0 }}
          >
            Manage Yajman entries and categories
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-color)' }}>
        <button
          className={`tab-btn ${activeTab === "yajmans" ? "active" : ""}`}
          onClick={() => setActiveTab("yajmans")}
          style={{
            padding: '0.45rem 0.9rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === "yajmans" ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === "yajmans" ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === "yajmans" ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.84rem'
          }}
        >
          Yajmans
        </button>
        <button
          className={`tab-btn ${activeTab === "categories" ? "active" : ""}`}
          onClick={() => setActiveTab("categories")}
          style={{
            padding: '0.45rem 0.9rem',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === "categories" ? '2px solid var(--primary-color)' : '2px solid transparent',
            color: activeTab === "categories" ? 'var(--primary-color)' : 'var(--text-secondary)',
            fontWeight: activeTab === "categories" ? 600 : 400,
            cursor: 'pointer',
            fontSize: '0.84rem'
          }}
        >
          Categories
        </button>
      </div>

      {activeTab === "yajmans" ? (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.85rem",
              maxWidth: "460px",
            }}
          >
            <div style={{ position: "relative", flex: 1 }}>
              <MdSearch
                size={18}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "0.65rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <input
                type="search"
                className="input-field"
                aria-label="Search Yajman entries"
                placeholder="Search name, category, phone, location, or status"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                style={{ paddingLeft: "2.15rem" }}
              />
            </div>
            {searchQuery && (
              <button
                className="btn-icon"
                type="button"
                aria-label="Clear search"
                title="Clear search"
                onClick={() => setSearchQuery("")}
              >
                <MdClose size={18} />
              </button>
            )}
          </div>

          {yajmanList.length === 0 ? (
            <div
              className="glass-panel"
              style={{ padding: "1.85rem", textAlign: "center" }}
            >
              <MdPerson
                size={44}
                style={{ color: "var(--border-color)", marginBottom: "0.65rem" }}
              />
              <h3 style={{ fontSize: "1rem", marginBottom: "0.25rem" }}>No Yajman Entries Found</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                There are no yajman entries registered yet.
              </p>
            </div>
          ) : filteredYajmans.length === 0 ? (
            <div
              className="glass-panel"
              style={{
                padding: "1.65rem",
                textAlign: "center",
                color: "var(--text-secondary)",
              }}
            >
              <h3 style={{ color: "var(--text-primary)", fontSize: "1rem", marginBottom: "0.25rem" }}>
                No matching Yajman entries
              </h3>
              <p style={{ fontSize: "0.84rem" }}>
                Try a different name, category, phone number, location, or status.
              </p>
            </div>
          ) : (
            <div className="glass-panel" style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ minWidth: "680px" }}>
                <thead>
                  <tr>
                    <th>Yajman</th>
                    <th>Category</th>
                    <th>Phone</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredYajmans.map((yajman, index) => {
                    const name = yajman.name || yajman.fullName || "Unknown Yajman";
                    const image = yajman.image || yajman.photo;
                    const status = yajman.status || "Active";
                    return (
                      <tr key={yajman._id || yajman.id || index}>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.55rem",
                              minWidth: "160px",
                            }}
                          >
                            <div className="yajman-avatar">
                              {image ? (
                                <img src={image} alt="" className="avatar-img" />
                              ) : (
                                <span>{name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              {name}
                            </span>
                          </div>
                        </td>
                        <td>{getCategoryName(yajman)}</td>
                        <td>{getPhone(yajman) || "—"}</td>
                        <td>{getLocation(yajman) || "—"}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                            <label className="toggle-switch" style={{ transform: "scale(0.85)" }}>
                              <input
                                type="checkbox"
                                checked={status.toLowerCase() === "active"}
                                onChange={() => handleStatusToggle(yajman)}
                                disabled={statusMutation.isLoading}
                              />
                              <span className="toggle-slider"></span>
                            </label>
                            <span
                              className={`yajman-status-badge ${status.toLowerCase() === "active" ? "active" : "inactive"}`}
                              style={{ display: "inline-block" }}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <style>{`
        .yajman-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(245, 166, 35, 0.15);
          color: var(--secondary-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 700;
          overflow: hidden;
          flex: 0 0 30px;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .yajman-status-badge {
          background-color: rgba(230, 126, 34, 0.1);
          color: var(--primary-color);
          padding: 0.18rem 0.48rem;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
        }
      `}</style>
        </>
      ) : (
        <ManageYajmanCategory isEmbedded={true} />
      )}
    </div>
  );
};

export default ManageYajman;
