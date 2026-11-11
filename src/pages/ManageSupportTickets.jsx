import React, { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdEdit,
  MdSave,
  MdSearch,
  MdRefresh,
  MdPerson,
  MdEmail,
  MdPhone,
  MdVisibility,
  MdCheckCircle,
  MdPending,
  MdAssignmentInd,
  MdLayers,
  MdConfirmationNumber,
} from "react-icons/md";
import { useConfirmModal } from "../contexts/ConfirmModalContext";
import {
  getAllSupportTicketCategories,
  getSupportTicketCategoryById,
  createSupportTicketCategory,
  updateSupportTicketCategory,
  deleteSupportTicketCategory,
} from "../api/supportTicketCategory";
import {
  getAllSupportTickets,
  getSupportTicketById,
  createSupportTicket,
  updateSupportTicket,
  deleteSupportTicket,
  getSupportTicketsByUserId,
  getSupportTicketsByAdminId,
} from "../api/supportTicket";
import { getAllUsers } from "../api/auth";

const TICKET_STATUSES = ["Pending", "Resolved", "Closed"];

const getAdminInfo = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("adminUser") || "null");
    const admin = stored?.data?.user || stored?.data || stored?.user || stored;
    return {
      id: admin?._id || admin?.id || admin?.adminId || "6acf153354960408d52b2558",
      fullName: admin?.fullName || admin?.name || "Admin",
      email: admin?.email || "admin@viprasaarthi.com",
    };
  } catch {
    return {
      id: "6acf153354960408d52b2558",
      fullName: "Admin",
      email: "admin@viprasaarthi.com",
    };
  }
};

const unwrapList = (response, keys = []) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  for (const key of keys) {
    if (Array.isArray(response[key])) return response[key];
    if (response.data && Array.isArray(response.data[key])) return response.data[key];
  }
  return [];
};

const idOf = (record) => {
  if (!record) return "";
  if (typeof record === "string") return record;
  return record._id || record.id || "";
};

const emptyTicketForm = {
  userId: "",
  categoryId: "",
  subject: "",
  description: "",
  remarks: "",
  status: "Pending",
  adminId: "",
};

const emptyCategoryForm = {
  categoryName: "",
  isActive: true,
};

const ManageSupportTickets = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const currentAdmin = getAdminInfo();

  // Navigation tab: 'tickets' or 'categories'
  const [activeTab, setActiveTab] = useState("tickets");

  // Ticket filters & search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ticketScope, setTicketScope] = useState("all"); // 'all' | 'assigned_to_me'

  // Modals
  const [ticketModal, setTicketModal] = useState({ isOpen: false, id: null });
  const [ticketForm, setTicketForm] = useState(emptyTicketForm);
  const [detailModalTicket, setDetailModalTicket] = useState(null);

  const [categoryModal, setCategoryModal] = useState({ isOpen: false, id: null });
  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);

  // 1. Fetch Categories
  const {
    data: rawCategories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ["supportTicketCategories"],
    queryFn: getAllSupportTicketCategories,
  });
  const categories = useMemo(
    () => unwrapList(rawCategories, ["categories", "supportTicketCategories"]),
    [rawCategories]
  );

  // 2. Fetch All Tickets (so admin can manage ALL user tickets)
  const {
    data: rawAllTickets,
    isLoading: isLoadingAllTickets,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["supportTickets", "all"],
    queryFn: getAllSupportTickets,
  });
  const allTickets = useMemo(
    () => unwrapList(rawAllTickets, ["tickets", "supportTickets"]),
    [rawAllTickets]
  );

  // 3. Fetch Registered Users for easy ticket creation/reassignment
  const { data: rawUsers } = useQuery({
    queryKey: ["users-for-tickets"],
    queryFn: getAllUsers,
  });
  const users = useMemo(
    () => unwrapList(rawUsers, ["auths", "users"]),
    [rawUsers]
  );

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      // 1. Scope filter
      if (ticketScope === "assigned_to_me") {
        const assignedId = idOf(ticket.adminId);
        if (assignedId !== currentAdmin.id) return false;
      }

      // 2. Status filter
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false;
      }

      // 3. Category filter
      if (categoryFilter !== "all") {
        const catId = idOf(ticket.categoryId || ticket.category);
        if (catId !== categoryFilter) return false;
      }

      // 4. Search query (subject, description, remarks, user name/email/phone)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const user = ticket.userId || {};
        const subject = (ticket.subject || "").toLowerCase();
        const desc = (ticket.description || "").toLowerCase();
        const remarks = (ticket.remarks || "").toLowerCase();
        const userName = (user.fullName || user.displayName || "").toLowerCase();
        const userEmail = (user.email || "").toLowerCase();
        const userPhone = (user.mobileNumber || "").toLowerCase();

        return (
          subject.includes(q) ||
          desc.includes(q) ||
          remarks.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q) ||
          userPhone.includes(q)
        );
      }

      return true;
    });
  }, [allTickets, ticketScope, statusFilter, categoryFilter, searchQuery, currentAdmin.id]);

  // Statistics
  const stats = useMemo(() => {
    const total = allTickets.length;
    const pending = allTickets.filter((t) => t.status === "Pending").length;
    const resolved = allTickets.filter((t) => t.status === "Resolved").length;
    const closed = allTickets.filter((t) => t.status === "Closed").length;
    const assignedToMe = allTickets.filter((t) => idOf(t.adminId) === currentAdmin.id).length;
    return { total, pending, resolved, closed, assignedToMe };
  }, [allTickets, currentAdmin.id]);

  // Mutations for Tickets
  const createTicketMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
      toast.success("Support ticket created successfully");
      closeTicketModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create support ticket");
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
      toast.success("Support ticket updated successfully");
      closeTicketModal();
      if (detailModalTicket) {
        setDetailModalTicket(null);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update support ticket");
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: deleteSupportTicket,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
      toast.success("Support ticket deleted successfully");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete support ticket");
    },
  });

  // Mutations for Categories
  const createCategoryMutation = useMutation({
    mutationFn: createSupportTicketCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTicketCategories"] });
      toast.success("Support ticket category created");
      closeCategoryModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to create category");
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupportTicketCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTicketCategories"] });
      toast.success("Support ticket category updated");
      closeCategoryModal();
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update category");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteSupportTicketCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTicketCategories"] });
      toast.success("Category deleted");
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete category");
    },
  });

  // Ticket Handlers
  const openCreateTicketModal = () => {
    setTicketForm({
      ...emptyTicketForm,
      adminId: currentAdmin.id,
      categoryId: categories.length > 0 ? idOf(categories[0]) : "",
    });
    setTicketModal({ isOpen: true, id: null });
  };

  const openEditTicketModal = (ticket) => {
    const rawUser = ticket.userId;
    const rawCat = ticket.categoryId || ticket.category;
    const rawAdmin = ticket.adminId;

    setTicketForm({
      userId: idOf(rawUser) || (typeof rawUser === "string" ? rawUser : ""),
      categoryId: idOf(rawCat) || (typeof rawCat === "string" ? rawCat : ""),
      subject: ticket.subject || "",
      description: ticket.description || "",
      remarks: ticket.remarks || "",
      status: ticket.status || "Pending",
      adminId: idOf(rawAdmin) || currentAdmin.id,
    });
    setTicketModal({ isOpen: true, id: idOf(ticket) });
  };

  const closeTicketModal = () => {
    setTicketModal({ isOpen: false, id: null });
    setTicketForm(emptyTicketForm);
  };

  const handleTicketSubmit = (e) => {
    e.preventDefault();

    if (!ticketForm.userId) {
      toast.error("Please select or enter a User ID");
      return;
    }
    if (!ticketForm.categoryId) {
      toast.error("Please select a Category");
      return;
    }
    if (!ticketForm.subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    if (!ticketForm.description.trim()) {
      toast.error("Description is required");
      return;
    }

    const payload = {
      userId: ticketForm.userId.trim(),
      categoryId: ticketForm.categoryId.trim(),
      subject: ticketForm.subject.trim(),
      description: ticketForm.description.trim(),
      remarks: (ticketForm.remarks || "").trim(),
      status: ticketForm.status || "Pending",
      adminId: ticketForm.adminId ? ticketForm.adminId.trim() : currentAdmin.id,
    };

    if (ticketModal.id) {
      updateTicketMutation.mutate({ id: ticketModal.id, data: payload });
    } else {
      createTicketMutation.mutate(payload);
    }
  };

  const handleDeleteTicket = (ticket) => {
    const id = idOf(ticket);
    showConfirm(`Delete ticket "${ticket.subject || id}"? This action cannot be undone.`, () => {
      deleteTicketMutation.mutate(id);
    });
  };

  // Quick Status change directly from row or view modal
  const handleQuickStatusChange = (ticket, newStatus) => {
    const id = idOf(ticket);
    const payload = {
      userId: idOf(ticket.userId),
      categoryId: idOf(ticket.categoryId || ticket.category),
      subject: ticket.subject || "",
      description: ticket.description || "",
      remarks: ticket.remarks || "",
      status: newStatus,
      adminId: idOf(ticket.adminId) || currentAdmin.id,
    };
    updateTicketMutation.mutate({ id, data: payload });
  };

  // Category Handlers
  const openCreateCategoryModal = () => {
    setCategoryForm(emptyCategoryForm);
    setCategoryModal({ isOpen: true, id: null });
  };

  const openEditCategoryModal = (category) => {
    setCategoryForm({
      categoryName: category.categoryName || "",
      isActive: Boolean(category.isActive),
    });
    setCategoryModal({ isOpen: true, id: idOf(category) });
  };

  const closeCategoryModal = () => {
    setCategoryModal({ isOpen: false, id: null });
    setCategoryForm(emptyCategoryForm);
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (!categoryForm.categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    const payload = {
      categoryName: categoryForm.categoryName.trim(),
      isActive: Boolean(categoryForm.isActive),
    };

    if (categoryModal.id) {
      updateCategoryMutation.mutate({ id: categoryModal.id, data: payload });
    } else {
      createCategoryMutation.mutate(payload);
    }
  };

  const handleDeleteCategory = (category) => {
    const id = idOf(category);
    showConfirm(`Delete category "${category.categoryName}"?`, () => {
      deleteCategoryMutation.mutate(id);
    });
  };

  const isSaving =
    createTicketMutation.isPending ||
    updateTicketMutation.isPending ||
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending;

  return (
    <div className="page-content animate-fade-in">
      {/* TOP HEADER */}
      <div className="top-header" style={{ margin: "-0.95rem -1.25rem 0.9rem -1.25rem" }}>
        <div>
          <h1 className="header-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <MdConfirmationNumber size={21} />
            Support Ticket Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", marginTop: "0.15rem", marginBottom: 0 }}>
            Resolve user queries, manage support requests, and configure ticket categories.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              refetchTickets();
              refetchCategories();
              toast.success("Tickets refreshed");
            }}
            title="Refresh"
          >
            <MdRefresh size={16} />
          </button>

          {activeTab === "tickets" ? (
            <button className="btn btn-primary" onClick={openCreateTicketModal}>
              <MdAdd size={17} /> Create Ticket
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openCreateCategoryModal}>
              <MdAdd size={17} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS + COMPACT STAT PILLS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <div
          role="tablist"
          aria-label="Support ticket tabs"
          style={{ display: "flex", gap: "0.4rem" }}
        >
          <button
            role="tab"
            aria-selected={activeTab === "tickets"}
            className={`btn ${activeTab === "tickets" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("tickets")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          >
            <MdConfirmationNumber size={15} />
            Support Tickets ({allTickets.length})
          </button>

          <button
            role="tab"
            aria-selected={activeTab === "categories"}
            className={`btn ${activeTab === "categories" ? "btn-primary" : "btn-outline"}`}
            onClick={() => setActiveTab("categories")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
          >
            <MdLayers size={15} />
            Categories ({categories.length})
          </button>
        </div>

        <div className="compact-stat-pills">
          <button
            type="button"
            className={`compact-stat-pill clickable ${statusFilter === "all" && ticketScope === "all" ? "active-primary" : ""}`}
            onClick={() => {
              setActiveTab("tickets");
              setStatusFilter("all");
              setTicketScope("all");
            }}
          >
            <span className="compact-stat-pill-label">Total</span>
            <strong className="compact-stat-pill-val">{stats.total}</strong>
          </button>

          <button
            type="button"
            className={`compact-stat-pill clickable ${statusFilter === "Pending" ? "active-warning" : ""}`}
            onClick={() => {
              setActiveTab("tickets");
              setStatusFilter((prev) => (prev === "Pending" ? "all" : "Pending"));
            }}
            title="Filter Pending tickets"
          >
            <MdPending size={14} color="#D97706" />
            <span className="compact-stat-pill-label">Pending</span>
            <strong className="compact-stat-pill-val" style={{ color: "#B45309" }}>{stats.pending}</strong>
          </button>

          <button
            type="button"
            className={`compact-stat-pill clickable ${statusFilter === "Resolved" ? "active-success" : ""}`}
            onClick={() => {
              setActiveTab("tickets");
              setStatusFilter((prev) => (prev === "Resolved" ? "all" : "Resolved"));
            }}
            title="Filter Resolved tickets"
          >
            <MdCheckCircle size={14} color="#059669" />
            <span className="compact-stat-pill-label">Resolved</span>
            <strong className="compact-stat-pill-val" style={{ color: "#047857" }}>{stats.resolved}</strong>
          </button>

          <button
            type="button"
            className={`compact-stat-pill clickable ${ticketScope === "assigned_to_me" ? "active-info" : ""}`}
            onClick={() => {
              setActiveTab("tickets");
              setTicketScope((prev) => (prev === "assigned_to_me" ? "all" : "assigned_to_me"));
            }}
            title="Filter Assigned to Me"
          >
            <MdAssignmentInd size={14} color="#2563EB" />
            <span className="compact-stat-pill-label">Mine</span>
            <strong className="compact-stat-pill-val" style={{ color: "#1D4ED8" }}>{stats.assignedToMe}</strong>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SUPPORT TICKETS LIST                             */}
      {/* ======================================================== */}
      {activeTab === "tickets" && (
        <div>
          {/* COMPACT SEARCH & FILTERS BAR */}
          <div className="compact-controls-bar">
            <div className="compact-search-wrap" style={{ maxWidth: "320px" }}>
              <MdSearch size={16} className="compact-search-icon" />
              <input
                type="text"
                placeholder="Search subject, user name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="compact-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="compact-search-clear"
                  title="Clear search"
                >
                  <MdClose size={14} />
                </button>
              )}
            </div>

            <div className="compact-filter-toolbar">
              <select
                className="compact-filter-select"
                value={ticketScope}
                onChange={(e) => setTicketScope(e.target.value)}
              >
                <option value="all">All Platform Tickets</option>
                <option value="assigned_to_me">Assigned to Me</option>
              </select>

              <select
                className="compact-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                className="compact-filter-select"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={idOf(c)} value={idOf(c)}>
                    {c.categoryName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE OF TICKETS */}
          <div className="clean-table-wrap">
            <div className="clean-table-header">
              <span className="clean-table-count">
                Showing <strong>{filteredTickets.length}</strong> of <strong>{allTickets.length}</strong> support tickets
              </span>
            </div>
            <table className="clean-table">
              <thead>
                <tr>
                  <th>Subject & Ticket ID</th>
                  <th>User Information</th>
                  <th>Category</th>
                  <th>Assigned Admin</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingAllTickets ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "1.75rem" }}>
                      <div className="spinner" style={{ width: "26px", height: "26px", margin: "0 auto", borderTopColor: "var(--primary-color)" }}></div>
                      <p style={{ marginTop: "0.55rem", fontSize: "0.85rem", color: "var(--text-secondary)" }}>Loading support tickets...</p>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "1.75rem" }}>
                      <MdConfirmationNumber size={36} style={{ color: "var(--border-color)", marginBottom: "0.5rem" }} />
                      <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>No Support Tickets Found</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.84rem", margin: 0 }}>
                        {searchQuery || statusFilter !== "all" || categoryFilter !== "all" || ticketScope !== "all"
                          ? "No tickets match your filter criteria. Try resetting filters."
                          : "No support tickets have been created yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const ticketId = idOf(ticket);
                    const user = ticket.userId || {};
                    const isUserObj = typeof user === "object";
                    const category = ticket.categoryId || ticket.category;
                    const catName = typeof category === "object" ? category.categoryName : categories.find((c) => idOf(c) === category)?.categoryName;
                    const admin = ticket.adminId;
                    const adminName = typeof admin === "object" && admin ? admin.fullName || admin.displayName : admin ? "Assigned" : "Unassigned";

                    return (
                      <tr key={ticketId}>
                        <td>
                          <div style={{ fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            {ticket.subject || "Untitled"}
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            ID: {ticketId.slice(-6)}
                          </span>
                        </td>

                        <td>
                          {isUserObj ? (
                            <div>
                              <div style={{ fontWeight: "600", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                <MdPerson size={15} color="var(--primary-color)" />
                                {user.fullName || user.displayName || "User"}
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                                {user.email || user.mobileNumber || user.id || "—"}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                              {user || "—"}
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            style={{
                              fontSize: "0.8rem",
                              background: "rgba(130, 0, 30, 0.06)",
                              color: "var(--primary-color)",
                              padding: "0.2rem 0.55rem",
                              borderRadius: "4px",
                              border: "1px solid rgba(130, 0, 30, 0.15)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {catName || "General"}
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: "0.8rem", color: adminName === "Unassigned" ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: adminName === "Unassigned" ? "normal" : "500" }}>
                            {adminName}
                          </span>
                        </td>

                        <td>
                          <select
                            value={ticket.status || "Pending"}
                            onChange={(e) => handleQuickStatusChange(ticket, e.target.value)}
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "12px",
                              cursor: "pointer",
                              border: "none",
                              background:
                                ticket.status === "Resolved"
                                  ? "rgba(23, 74, 13, 0.12)"
                                  : ticket.status === "Closed"
                                  ? "#F3F4F6"
                                  : "rgba(245, 166, 35, 0.15)",
                              color:
                                ticket.status === "Resolved"
                                  ? "var(--success-color)"
                                  : ticket.status === "Closed"
                                  ? "#4B5563"
                                  : "#B45309",
                            }}
                          >
                            {TICKET_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                          </span>
                        </td>

                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "inline-flex", gap: "0.3rem" }}>
                            <button
                              className="btn-icon-sm"
                              title="View Details"
                              onClick={() => setDetailModalTicket(ticket)}
                            >
                              <MdVisibility size={15} />
                            </button>
                            <button
                              className="btn-icon-sm edit"
                              title="Edit Ticket"
                              onClick={() => openEditTicketModal(ticket)}
                            >
                              <MdEdit size={15} />
                            </button>
                            <button
                              className="btn-icon-sm delete"
                              title="Delete Ticket"
                              onClick={() => handleDeleteTicket(ticket)}
                            >
                              <MdDeleteOutline size={15} />
                            </button>
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
      )}

      {/* ======================================================== */}
      {/* TAB 2: CATEGORIES LIST                                  */}
      {/* ======================================================== */}
      {activeTab === "categories" && (
        <div className="clean-table-wrap">
          <div className="clean-table-header">
            <span className="clean-table-count">
              Showing <strong>{categories.length}</strong> support categories
            </span>
          </div>
          <table className="clean-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Category ID</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCategories ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "1.25rem" }}>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "1.25rem" }}>
                    No support ticket categories found.
                  </td>
                </tr>
              ) : (
                categories.map((category) => {
                  const catId = idOf(category);
                  return (
                    <tr key={catId}>
                      <td>
                        <strong style={{ color: "var(--text-primary)" }}>{category.categoryName}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{catId}</span>
                      </td>
                      <td>
                        <span
                          className={`clean-flag-pill ${category.isActive ? "is-active" : "is-draft"}`}
                          style={{ cursor: "default" }}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.3rem" }}>
                          <button
                            className="btn-icon-sm edit"
                            title="Edit Category"
                            onClick={() => openEditCategoryModal(category)}
                          >
                            <MdEdit size={15} />
                          </button>
                          <button
                            className="btn-icon-sm delete"
                            title="Delete Category"
                            onClick={() => handleDeleteCategory(category)}
                          >
                            <MdDeleteOutline size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT SUPPORT TICKET                     */}
      {/* ======================================================== */}
      {ticketModal.isOpen && (
        <div className="modal-overlay" onClick={closeTicketModal}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "600px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <MdConfirmationNumber size={18} />
                {ticketModal.id ? "Edit Support Ticket" : "Create New Support Ticket"}
              </h2>
              <button className="modal-close-btn" onClick={closeTicketModal}>
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1, padding: "1rem 1.15rem", gap: "0.7rem" }}>
              {/* User Selection */}
              <div className="input-group">
                <label className="input-label" htmlFor="ticket-user">
                  Target User <span style={{ color: "var(--error-color)" }}>*</span>
                </label>
                {users.length > 0 ? (
                  <select
                    id="ticket-user"
                    className="input-field"
                    value={ticketForm.userId}
                    onChange={(e) => setTicketForm({ ...ticketForm, userId: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      Select user...
                    </option>
                    {users.map((u) => (
                      <option key={idOf(u)} value={idOf(u)}>
                        {u.fullName || u.displayName || "User"} ({u.email || u.mobileNumber || idOf(u)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id="ticket-user"
                    className="input-field"
                    placeholder="Enter User ID (e.g. 6acf153badd026dca2d87f0f)"
                    value={ticketForm.userId}
                    onChange={(e) => setTicketForm({ ...ticketForm, userId: e.target.value })}
                    required
                  />
                )}
              </div>

              {/* Category */}
              <div className="input-group">
                <label className="input-label" htmlFor="ticket-category">
                  Category <span style={{ color: "var(--error-color)" }}>*</span>
                </label>
                <select
                  id="ticket-category"
                  className="input-field"
                  value={ticketForm.categoryId}
                  onChange={(e) => setTicketForm({ ...ticketForm, categoryId: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Select category...
                  </option>
                  {categories.map((c) => (
                    <option key={idOf(c)} value={idOf(c)}>
                      {c.categoryName} {!c.isActive && "(Inactive)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject */}
              <div className="input-group">
                <label className="input-label" htmlFor="ticket-subject">
                  Subject <span style={{ color: "var(--error-color)" }}>*</span>
                </label>
                <input
                  id="ticket-subject"
                  className="input-field"
                  placeholder="e.g. Payment receipt download issue"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="input-group">
                <label className="input-label" htmlFor="ticket-desc">
                  Description <span style={{ color: "var(--error-color)" }}>*</span>
                </label>
                <textarea
                  id="ticket-desc"
                  className="input-field"
                  rows="4"
                  placeholder="Provide complete detail regarding the issue or user query..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  required
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Remarks */}
              <div className="input-group">
                <label className="input-label" htmlFor="ticket-remarks">
                  Admin Remarks / Resolution Notes
                </label>
                <textarea
                  id="ticket-remarks"
                  className="input-field"
                  rows="2"
                  placeholder="Notes for resolution, team tracking, or gateway reference..."
                  value={ticketForm.remarks}
                  onChange={(e) => setTicketForm({ ...ticketForm, remarks: e.target.value })}
                  style={{ resize: "vertical" }}
                />
              </div>

              {/* Status & Assigned Admin Row */}
              <div className="responsive-form-grid-2">
                <div className="input-group">
                  <label className="input-label" htmlFor="ticket-status">
                    Status
                  </label>
                  <select
                    id="ticket-status"
                    className="input-field"
                    value={ticketForm.status}
                    onChange={(e) => setTicketForm({ ...ticketForm, status: e.target.value })}
                  >
                    {TICKET_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label" htmlFor="ticket-admin-id">
                    Assigned Admin ID
                  </label>
                  <input
                    id="ticket-admin-id"
                    className="input-field"
                    value={ticketForm.adminId || currentAdmin.id}
                    onChange={(e) => setTicketForm({ ...ticketForm, adminId: e.target.value })}
                    placeholder="Admin ID"
                  />
                </div>
              </div>

              {/* FOOTER ACTIONS */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.55rem", marginTop: "0.35rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-color)" }}>
                <button type="button" className="btn btn-outline" onClick={closeTicketModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <MdSave size={16} />
                  {isSaving ? "Saving..." : ticketModal.id ? "Update Ticket" : "Create Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VIEW TICKET DETAILS                              */}
      {/* ======================================================== */}
      {detailModalTicket && (
        <div className="modal-overlay" onClick={() => setDetailModalTicket(null)}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "560px", width: "92%", maxHeight: "90vh", overflowY: "auto", padding: "1.15rem" }}
          >
            <div className="modal-header" style={{ padding: "0 0 0.7rem 0", marginBottom: "0.85rem" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    padding: "0.18rem 0.55rem",
                    borderRadius: "4px",
                    background:
                      detailModalTicket.status === "Resolved"
                        ? "rgba(23, 74, 13, 0.12)"
                        : detailModalTicket.status === "Closed"
                        ? "#F3F4F6"
                        : "rgba(245, 166, 35, 0.15)",
                    color:
                      detailModalTicket.status === "Resolved"
                        ? "var(--success-color)"
                        : detailModalTicket.status === "Closed"
                        ? "#4B5563"
                        : "#B45309",
                    textTransform: "uppercase",
                  }}
                >
                  {detailModalTicket.status}
                </span>
                <h2 className="modal-title" style={{ marginTop: "0.3rem", color: "var(--primary-color)" }}>
                  {detailModalTicket.subject}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailModalTicket(null)}>
                <MdClose size={20} />
              </button>
            </div>

            {/* User Info Card */}
            {detailModalTicket.userId && typeof detailModalTicket.userId === "object" && (
              <div style={{ background: "var(--bg-color)", padding: "0.75rem 0.9rem", borderRadius: "7px", border: "1px solid var(--border-color)", marginBottom: "0.85rem" }}>
                <div style={{ fontSize: "0.7rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.35rem" }}>
                  Requester Details
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <div className="user-avatar-large" style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}>
                    {detailModalTicket.userId.fullName ? detailModalTicket.userId.fullName.charAt(0) : "U"}
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.88rem", color: "var(--text-primary)" }}>{detailModalTicket.userId.fullName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", display: "flex", gap: "0.75rem" }}>
                      <span><MdEmail size={12} /> {detailModalTicket.userId.email}</span>
                      <span><MdPhone size={12} /> {detailModalTicket.userId.mobileNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: "0.85rem" }}>
              <h4 style={{ fontSize: "0.76rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                Description
              </h4>
              <p style={{ background: "#FAFAFA", padding: "0.7rem 0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)", lineHeight: "1.45", fontSize: "0.86rem", margin: 0, color: "var(--text-primary)" }}>
                {detailModalTicket.description}
              </p>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "0.76rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                Admin Remarks
              </h4>
              <p style={{ background: "#FAFAFA", padding: "0.65rem 0.85rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "0.85rem", color: detailModalTicket.remarks ? "var(--text-primary)" : "var(--text-secondary)", fontStyle: detailModalTicket.remarks ? "normal" : "italic", margin: 0 }}>
                {detailModalTicket.remarks || "No remarks added yet."}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.55rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  const t = detailModalTicket;
                  setDetailModalTicket(null);
                  openEditTicketModal(t);
                }}
              >
                <MdEdit size={15} /> Edit Ticket
              </button>
              <button className="btn btn-primary" onClick={() => setDetailModalTicket(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT CATEGORY                           */}
      {/* ======================================================== */}
      {categoryModal.isOpen && (
        <div className="modal-overlay" onClick={closeCategoryModal}>
          <div
            className="modal-content glass-panel animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "420px", width: "92%", padding: "1rem 1.15rem" }}
          >
            <div className="modal-header" style={{ padding: "0 0 0.65rem 0" }}>
              <h2 className="modal-title">
                {categoryModal.id ? "Edit Category" : "Add Ticket Category"}
              </h2>
              <button className="modal-close-btn" onClick={closeCategoryModal}>
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} style={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginTop: "0.75rem" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="cat-name">
                  Category Name <span style={{ color: "var(--error-color)" }}>*</span>
                </label>
                <input
                  id="cat-name"
                  className="input-field"
                  placeholder="e.g. Technical Issues, Payment & Billing"
                  value={categoryForm.categoryName}
                  onChange={(e) => setCategoryForm({ ...categoryForm, categoryName: e.target.value })}
                  required
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", cursor: "pointer", userSelect: "none", fontSize: "0.86rem" }}>
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                />
                <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>Active Status</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.55rem", marginTop: "0.35rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeCategoryModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <MdSave size={16} />
                  {isSaving ? "Saving..." : categoryModal.id ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSupportTickets;
