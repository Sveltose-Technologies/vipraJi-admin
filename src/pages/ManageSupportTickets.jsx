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
  MdAccessTime,
  MdOutlineChatBubbleOutline
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
    <div className="page-content animate-fade-in" style={{ paddingTop: "0.5rem" }}>
      {/* TOP HEADER */}
      <div className="top-header" style={{ margin: "-2rem -2rem 1.5rem -2rem" }}>
        <div>
          <h1 className="header-title" style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
            <MdConfirmationNumber size={28} />
            Support Ticket Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Resolve user queries, manage support requests, and configure ticket categories.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <button
            className="btn btn-outline"
            onClick={() => {
              refetchTickets();
              refetchCategories();
              toast.success("Tickets refreshed");
            }}
            title="Refresh"
            style={{ padding: "0.6rem 0.9rem" }}
          >
            <MdRefresh size={19} />
          </button>

          {activeTab === "tickets" ? (
            <button className="btn btn-primary" onClick={openCreateTicketModal}>
              <MdAdd size={20} /> Create Ticket
            </button>
          ) : (
            <button className="btn btn-primary" onClick={openCreateCategoryModal}>
              <MdAdd size={20} /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* STATS TILES */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
          marginBottom: "1.75rem",
        }}
      >
        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(130, 0, 30, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-color)" }}>
            <MdConfirmationNumber size={26} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Total Tickets</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--primary-color)", lineHeight: 1.2 }}>{stats.total}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(245, 166, 35, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#D97706" }}>
            <MdPending size={26} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Pending Action</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "#D97706", lineHeight: 1.2 }}>{stats.pending}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(23, 74, 13, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success-color)" }}>
            <MdCheckCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Resolved</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "var(--success-color)", lineHeight: 1.2 }}>{stats.resolved}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: "1.25rem 1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(59, 130, 246, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB" }}>
            <MdAssignmentInd size={26} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Assigned to Me</div>
            <div style={{ fontSize: "1.6rem", fontWeight: "700", color: "#2563EB", lineHeight: 1.2 }}>{stats.assignedToMe}</div>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div
        role="tablist"
        aria-label="Support ticket tabs"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.5rem",
        }}
      >
        <button
          role="tab"
          aria-selected={activeTab === "tickets"}
          className={`btn ${activeTab === "tickets" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("tickets")}
          style={{ borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <MdConfirmationNumber size={18} />
          Support Tickets ({allTickets.length})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === "categories"}
          className={`btn ${activeTab === "categories" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setActiveTab("categories")}
          style={{ borderRadius: "8px 8px 0 0", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          <MdLayers size={18} />
          Categories ({categories.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SUPPORT TICKETS LIST                             */}
      {/* ======================================================== */}
      {activeTab === "tickets" && (
        <div>
          {/* SEARCH & FILTERS BAR */}
          <div
            className="glass-panel"
            style={{
              padding: "1rem 1.5rem",
              marginBottom: "1.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {/* Search Input */}
            <div style={{ display: "flex", alignItems: "center", flex: "1 1 280px", gap: "0.5rem", background: "#FFFFFF", padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
              <MdSearch size={22} color="var(--text-secondary)" />
              <input
                type="text"
                placeholder="Search by subject, description, user name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", outline: "none", width: "100%", fontSize: "0.9rem", color: "var(--text-primary)" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
                >
                  <MdClose size={16} />
                </button>
              )}
            </div>

            {/* Scope Toggle: All vs Assigned to Me */}
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <select
                className="input-field"
                value={ticketScope}
                onChange={(e) => setTicketScope(e.target.value)}
                style={{ width: "auto", padding: "0.5rem 0.75rem", fontWeight: "500" }}
              >
                <option value="all">All Platform Tickets</option>
                <option value="assigned_to_me">Assigned to Me</option>
              </select>

              {/* Status Filter */}
              <select
                className="input-field"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: "auto", padding: "0.5rem 0.75rem" }}
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>

              {/* Category Filter */}
              <select
                className="input-field"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "auto", padding: "0.5rem 0.75rem" }}
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
          <div className="glass-panel" style={{ padding: "1.25rem", overflowX: "auto" }}>
            <table className="data-table">
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
                    <td colSpan="7" style={{ textAlign: "center", padding: "3rem" }}>
                      <div className="spinner" style={{ width: "32px", height: "32px", margin: "0 auto", borderTopColor: "var(--primary-color)" }}></div>
                      <p style={{ marginTop: "0.75rem", color: "var(--text-secondary)" }}>Loading support tickets...</p>
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "3rem" }}>
                      <MdConfirmationNumber size={48} style={{ color: "var(--border-color)", marginBottom: "0.75rem" }} />
                      <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>No Support Tickets Found</h3>
                      <p style={{ color: "var(--text-secondary)", margin: 0 }}>
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
                          <button
                            className="btn-icon"
                            title="View Details"
                            onClick={() => setDetailModalTicket(ticket)}
                            style={{ marginRight: "0.25rem" }}
                          >
                            <MdVisibility size={18} />
                          </button>
                          <button
                            className="btn-icon edit"
                            title="Edit Ticket"
                            onClick={() => openEditTicketModal(ticket)}
                            style={{ marginRight: "0.25rem" }}
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            className="btn-icon delete"
                            title="Delete Ticket"
                            onClick={() => handleDeleteTicket(ticket)}
                          >
                            <MdDeleteOutline size={18} />
                          </button>
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
        <div className="glass-panel" style={{ padding: "1.25rem", overflowX: "auto" }}>
          <table className="data-table">
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
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
                    Loading categories...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "2rem" }}>
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
                          className={`badge ${category.isActive ? "badge-success" : "badge-danger"}`}
                          style={{
                            padding: "0.25rem 0.65rem",
                            borderRadius: "12px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            background: category.isActive ? "rgba(23, 74, 13, 0.1)" : "rgba(155, 42, 31, 0.1)",
                            color: category.isActive ? "var(--success-color)" : "var(--error-color)",
                          }}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-icon edit"
                          title="Edit Category"
                          onClick={() => openEditCategoryModal(category)}
                          style={{ marginRight: "0.25rem" }}
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Delete Category"
                          onClick={() => handleDeleteCategory(category)}
                        >
                          <MdDeleteOutline size={18} />
                        </button>
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
            style={{ maxWidth: "680px", width: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          >
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <MdConfirmationNumber />
                {ticketModal.id ? "Edit Support Ticket" : "Create New Support Ticket"}
              </h2>
              <button className="modal-close-btn" onClick={closeTicketModal}>
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} style={{ display: "flex", flexDirection: "column", overflowY: "auto", flex: 1, padding: "1.5rem", gap: "1rem" }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
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
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)" }}>
                <button type="button" className="btn btn-outline" onClick={closeTicketModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <MdSave size={18} />
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
            style={{ maxWidth: "640px", width: "92%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}
          >
            <div className="modal-header" style={{ marginBottom: "1.25rem" }}>
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    padding: "0.2rem 0.6rem",
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
                <h2 className="modal-title" style={{ marginTop: "0.4rem", color: "var(--primary-color)" }}>
                  {detailModalTicket.subject}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setDetailModalTicket(null)}>
                <MdClose size={24} />
              </button>
            </div>

            {/* User Info Card */}
            {detailModalTicket.userId && typeof detailModalTicket.userId === "object" && (
              <div style={{ background: "var(--bg-color)", padding: "1rem 1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                  Requester Details
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div className="user-avatar-large" style={{ width: "42px", height: "42px", fontSize: "1.1rem" }}>
                    {detailModalTicket.userId.fullName ? detailModalTicket.userId.fullName.charAt(0) : "U"}
                  </div>
                  <div>
                    <div style={{ fontWeight: "700", color: "var(--text-primary)" }}>{detailModalTicket.userId.fullName}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", display: "flex", gap: "1rem" }}>
                      <span><MdEmail size={13} /> {detailModalTicket.userId.email}</span>
                      <span><MdPhone size={13} /> {detailModalTicket.userId.mobileNumber}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div style={{ marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Description
              </h4>
              <p style={{ background: "#FAFAFA", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border-color)", lineHeight: "1.5", margin: 0, color: "var(--text-primary)" }}>
                {detailModalTicket.description}
              </p>
            </div>

            {/* Remarks */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "0.85rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "0.35rem" }}>
                Admin Remarks
              </h4>
              <p style={{ background: "#FAFAFA", padding: "0.75rem 1rem", borderRadius: "6px", border: "1px solid var(--border-color)", color: detailModalTicket.remarks ? "var(--text-primary)" : "var(--text-secondary)", fontStyle: detailModalTicket.remarks ? "normal" : "italic", margin: 0 }}>
                {detailModalTicket.remarks || "No remarks added yet."}
              </p>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  const t = detailModalTicket;
                  setDetailModalTicket(null);
                  openEditTicketModal(t);
                }}
              >
                <MdEdit size={16} /> Edit Ticket
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
            style={{ maxWidth: "480px", width: "92%", padding: "1.5rem" }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                {categoryModal.id ? "Edit Category" : "Add Ticket Category"}
              </h2>
              <button className="modal-close-btn" onClick={closeCategoryModal}>
                <MdClose size={24} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
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

              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={categoryForm.isActive}
                  onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                />
                <span style={{ fontWeight: "500", color: "var(--text-primary)" }}>Active Status</span>
              </label>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" className="btn btn-outline" onClick={closeCategoryModal} disabled={isSaving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  <MdSave size={18} />
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
