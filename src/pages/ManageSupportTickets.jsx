import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdEdit,
  MdSave,
} from "react-icons/md";
import { useConfirmModal } from "../contexts/ConfirmModalContext";
import {
  createSupportTicketCategory,
  deleteSupportTicketCategory,
  getAllSupportTicketCategories,
  getSupportTicketCategoryById,
  updateSupportTicketCategory,
} from "../api/supportTicketCategory";
import {
  createSupportTicket,
  deleteSupportTicket,
  getSupportTicketById,
  getSupportTicketsByAdminId,
  updateSupportTicket,
} from "../api/supportTicket";

const ticketStatuses = ["Pending", "Resolved", "Closed"];
const emptyTicket = {
  userId: "",
  categoryId: "",
  subject: "",
  description: "",
  remarks: "",
  status: "Pending",
};

const getAdminId = () => {
  try {
    const stored = JSON.parse(localStorage.getItem("adminUser") || "null");
    const admin = stored?.data?.user || stored?.data || stored?.user || stored;
    return admin?._id || admin?.id || admin?.adminId || "";
  } catch {
    return "";
  }
};

const unwrapList = (response, keys) => {
  let value = response;
  for (let depth = 0; depth < 4 && value; depth += 1) {
    if (Array.isArray(value)) return value;
    for (const key of keys) {
      if (Array.isArray(value[key])) return value[key];
    }
    value = value.data;
  }
  return [];
};

const unwrapRecord = (response, keys) => {
  let value = response;
  for (let depth = 0; depth < 4 && value && !Array.isArray(value); depth += 1) {
    for (const key of keys) {
      if (value[key] && typeof value[key] === "object") return value[key];
    }
    if (!value.data || typeof value.data !== "object") break;
    value = value.data;
  }
  return Array.isArray(value) ? value[0] : value;
};

const idOf = (record) => record?._id || record?.id;
const categoryIdOf = (ticket) => {
  const category = ticket?.categoryId || ticket?.category;
  return typeof category === "object" ? idOf(category) || "" : category || "";
};

const ManageSupportTickets = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const adminId = getAdminId();
  const [section, setSection] = useState("tickets");
  const [modal, setModal] = useState({ type: "", id: null });
  const [ticketForm, setTicketForm] = useState(emptyTicket);
  const [categoryForm, setCategoryForm] = useState({
    categoryName: "",
    isActive: true,
  });

  const { data: rawCategories = [], isLoading: isLoadingCategories } = useQuery(
    {
      queryKey: ["supportTicketCategories"],
      queryFn: getAllSupportTicketCategories,
    },
  );
  const categories = unwrapList(rawCategories, [
    "categories",
    "supportTicketCategories",
  ]);

  const {
    data: rawTickets = [],
    isLoading: isLoadingTickets,
    isError: ticketsError,
  } = useQuery({
    queryKey: ["supportTickets", "admin", adminId],
    queryFn: () => getSupportTicketsByAdminId(adminId),
    enabled: Boolean(adminId),
  });
  const tickets = unwrapList(rawTickets, ["tickets", "supportTickets"]);

  const { data: rawTicketDetail, isLoading: isLoadingTicketDetail } = useQuery({
    queryKey: ["supportTickets", "detail", modal.id],
    queryFn: () => getSupportTicketById(modal.id),
    enabled: modal.type === "ticket" && Boolean(modal.id),
  });
  const { data: rawCategoryDetail, isLoading: isLoadingCategoryDetail } =
    useQuery({
      queryKey: ["supportTicketCategories", "detail", modal.id],
      queryFn: () => getSupportTicketCategoryById(modal.id),
      enabled: modal.type === "category" && Boolean(modal.id),
    });

  useEffect(() => {
    if (modal.type !== "ticket" || !rawTicketDetail) return;
    const ticket = unwrapRecord(rawTicketDetail, ["ticket", "supportTicket"]);
    if (!ticket) return;
    setTicketForm({
      userId:
        typeof ticket.userId === "object"
          ? idOf(ticket.userId) || ""
          : ticket.userId || "",
      categoryId: categoryIdOf(ticket),
      subject: ticket.subject || "",
      description: ticket.description || "",
      remarks: ticket.remarks || "",
      status: ticket.status || "Pending",
    });
  }, [modal.type, rawTicketDetail]);

  useEffect(() => {
    if (modal.type !== "category" || !rawCategoryDetail) return;
    const category = unwrapRecord(rawCategoryDetail, [
      "category",
      "supportTicketCategory",
    ]);
    if (!category) return;
    setCategoryForm({
      categoryName: category.categoryName || "",
      isActive: Boolean(category.isActive),
    });
  }, [modal.type, rawCategoryDetail]);

  const closeModal = () => {
    setModal({ type: "", id: null });
    setTicketForm(emptyTicket);
    setCategoryForm({ categoryName: "", isActive: true });
  };
  const refreshTickets = () =>
    queryClient.invalidateQueries({
      queryKey: ["supportTickets", "admin", adminId],
    });
  const refreshCategories = () =>
    queryClient.invalidateQueries({ queryKey: ["supportTicketCategories"] });

  const createTicketMutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: () => {
      refreshTickets();
      toast.success("Support ticket created");
      closeModal();
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to create support ticket",
      ),
  });
  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupportTicket(id, data),
    onSuccess: () => {
      refreshTickets();
      toast.success("Support ticket updated");
      closeModal();
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to update support ticket",
      ),
  });
  const deleteTicketMutation = useMutation({
    mutationFn: deleteSupportTicket,
    onSuccess: () => {
      refreshTickets();
      toast.success("Support ticket deleted");
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to delete support ticket",
      ),
  });
  const createCategoryMutation = useMutation({
    mutationFn: createSupportTicketCategory,
    onSuccess: () => {
      refreshCategories();
      toast.success("Category created");
      closeModal();
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to create category",
      ),
  });
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => updateSupportTicketCategory(id, data),
    onSuccess: () => {
      refreshCategories();
      toast.success("Category updated");
      closeModal();
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to update category",
      ),
  });
  const deleteCategoryMutation = useMutation({
    mutationFn: deleteSupportTicketCategory,
    onSuccess: () => {
      refreshCategories();
      toast.success("Category deleted");
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to delete category",
      ),
  });

  const openTicket = (ticket = null) => {
    setTicketForm(
      ticket
        ? {
            userId:
              typeof ticket.userId === "object"
                ? idOf(ticket.userId) || ""
                : ticket.userId || "",
            categoryId: categoryIdOf(ticket),
            subject: ticket.subject || "",
            description: ticket.description || "",
            remarks: ticket.remarks || "",
            status: ticket.status || "Pending",
          }
        : emptyTicket,
    );
    setModal({ type: "ticket", id: ticket ? idOf(ticket) : null });
  };
  const openCategory = (category = null) => {
    setCategoryForm(
      category
        ? {
            categoryName: category.categoryName || "",
            isActive: Boolean(category.isActive),
          }
        : { categoryName: "", isActive: true },
    );
    setModal({ type: "category", id: category ? idOf(category) : null });
  };
  const handleTicketSubmit = (event) => {
    event.preventDefault();
    const data = { ...ticketForm, adminId };
    if (modal.id) updateTicketMutation.mutate({ id: modal.id, data });
    else createTicketMutation.mutate(data);
  };
  const handleCategorySubmit = (event) => {
    event.preventDefault();
    if (modal.id)
      updateCategoryMutation.mutate({ id: modal.id, data: categoryForm });
    else createCategoryMutation.mutate(categoryForm);
  };

  const isSaving =
    createTicketMutation.isPending ||
    updateTicketMutation.isPending ||
    createCategoryMutation.isPending ||
    updateCategoryMutation.isPending;
  const isDetailLoading = isLoadingTicketDetail || isLoadingCategoryDetail;

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: "-2rem -2rem 2rem -2rem" }}>
        <h1 className="header-title">Support Tickets</h1>
        {section === "tickets" ? (
          <button
            className="btn btn-primary"
            onClick={() => openTicket()}
            disabled={!adminId}
          >
            <MdAdd size={20} /> Create Ticket
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => openCategory()}>
            <MdAdd size={20} /> Add Category
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Support ticket management"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.25rem",
        }}
      >
        <button
          role="tab"
          aria-selected={section === "tickets"}
          className={`btn ${section === "tickets" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSection("tickets")}
        >
          My Tickets
        </button>
        <button
          role="tab"
          aria-selected={section === "categories"}
          className={`btn ${section === "categories" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSection("categories")}
        >
          Categories
        </button>
      </div>

      {section === "tickets" ? (
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", overflowX: "auto" }}
        >
          {!adminId ? (
            <p>
              Admin ID is unavailable. Sign in again to manage your tickets.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>User ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTickets ? (
                  <tr>
                    <td colSpan="5">Loading tickets...</td>
                  </tr>
                ) : ticketsError ? (
                  <tr>
                    <td colSpan="5">Unable to load your tickets.</td>
                  </tr>
                ) : tickets.length ? (
                  tickets.map((ticket) => {
                    const category = ticket.categoryId || ticket.category;
                    const categoryName =
                      typeof category === "object"
                        ? category.categoryName
                        : categories.find((item) => idOf(item) === category)
                            ?.categoryName;
                    return (
                      <tr key={idOf(ticket)}>
                        <td>{ticket.subject || "Untitled"}</td>
                        <td>
                          {typeof ticket.userId === "object"
                            ? ticket.userId.fullName || idOf(ticket.userId)
                            : ticket.userId || "—"}
                        </td>
                        <td>{categoryName || "—"}</td>
                        <td>
                          <span
                            className={`badge ${ticket.status === "Resolved" || ticket.status === "Closed" ? "badge-success" : "badge-warning"}`}
                          >
                            {ticket.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-icon edit"
                            aria-label="Edit ticket"
                            title="Edit"
                            onClick={() => openTicket(ticket)}
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            className="btn-icon delete"
                            aria-label="Delete ticket"
                            title="Delete"
                            onClick={() =>
                              showConfirm("Delete this support ticket?", () =>
                                deleteTicketMutation.mutate(idOf(ticket)),
                              )
                            }
                          >
                            <MdDeleteOutline size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      No tickets assigned to this admin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", overflowX: "auto" }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Status</th>
                <th style={{ width: "110px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCategories ? (
                <tr>
                  <td colSpan="3">Loading categories...</td>
                </tr>
              ) : categories.length ? (
                categories.map((category) => (
                  <tr key={idOf(category)}>
                    <td>{category.categoryName}</td>
                    <td>
                      <span
                        className={`badge ${category.isActive ? "badge-success" : "badge-danger"}`}
                      >
                        {category.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-icon edit"
                        aria-label="Edit category"
                        title="Edit"
                        onClick={() => openCategory(category)}
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        className="btn-icon delete"
                        aria-label="Delete category"
                        title="Delete"
                        onClick={() =>
                          showConfirm(
                            "Delete this support ticket category?",
                            () => deleteCategoryMutation.mutate(idOf(category)),
                          )
                        }
                      >
                        <MdDeleteOutline size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="3"
                    style={{ textAlign: "center", padding: "2rem" }}
                  >
                    No support ticket categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {modal.type &&
        createPortal(
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content animate-slide-up"
              onClick={(event) => event.stopPropagation()}
              style={{
                maxWidth: modal.type === "ticket" ? "680px" : "500px",
                width: "92%",
              }}
            >
              <div className="modal-header">
                <h2>
                  {modal.type === "ticket"
                    ? `${modal.id ? "Edit" : "Create"} Support Ticket`
                    : `${modal.id ? "Edit" : "Add"} Category`}
                </h2>
                <button
                  className="btn-icon"
                  type="button"
                  aria-label="Close"
                  onClick={closeModal}
                >
                  <MdClose size={24} />
                </button>
              </div>
              {isDetailLoading ? (
                <div className="modal-body">Loading details...</div>
              ) : modal.type === "ticket" ? (
                <form
                  className="modal-body"
                  onSubmit={handleTicketSubmit}
                  style={{ display: "grid", gap: "1rem" }}
                >
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-user-id">
                      User ID
                    </label>
                    <input
                      id="ticket-user-id"
                      className="input-field"
                      value={ticketForm.userId}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          userId: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-category">
                      Category
                    </label>
                    <select
                      id="ticket-category"
                      className="input-field"
                      value={ticketForm.categoryId}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          categoryId: event.target.value,
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select a category
                      </option>
                      {categories
                        .filter((category) => category.isActive)
                        .map((category) => (
                          <option key={idOf(category)} value={idOf(category)}>
                            {category.categoryName}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-subject">
                      Subject
                    </label>
                    <input
                      id="ticket-subject"
                      className="input-field"
                      value={ticketForm.subject}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          subject: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-description">
                      Description
                    </label>
                    <textarea
                      id="ticket-description"
                      className="input-field"
                      rows="4"
                      value={ticketForm.description}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          description: event.target.value,
                        })
                      }
                      required
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-remarks">
                      Remarks
                    </label>
                    <textarea
                      id="ticket-remarks"
                      className="input-field"
                      rows="3"
                      value={ticketForm.remarks}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          remarks: event.target.value,
                        })
                      }
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-status">
                      Status
                    </label>
                    <select
                      id="ticket-status"
                      className="input-field"
                      value={ticketForm.status}
                      onChange={(event) =>
                        setTicketForm({
                          ...ticketForm,
                          status: event.target.value,
                        })
                      }
                    >
                      {ticketStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="input-label" htmlFor="ticket-admin-id">
                      Admin ID
                    </label>
                    <input
                      id="ticket-admin-id"
                      className="input-field"
                      value={adminId}
                      readOnly
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving || !adminId}
                  >
                    <MdSave size={20} />{" "}
                    {isSaving
                      ? "Saving..."
                      : modal.id
                        ? "Update Ticket"
                        : "Create Ticket"}
                  </button>
                </form>
              ) : (
                <form
                  className="modal-body"
                  onSubmit={handleCategorySubmit}
                  style={{ display: "grid", gap: "1rem" }}
                >
                  <div className="input-group">
                    <label className="input-label" htmlFor="category-name">
                      Category Name
                    </label>
                    <input
                      id="category-name"
                      className="input-field"
                      value={categoryForm.categoryName}
                      onChange={(event) =>
                        setCategoryForm({
                          ...categoryForm,
                          categoryName: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <label
                    className="input-group"
                    htmlFor="category-active"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.65rem",
                    }}
                  >
                    <input
                      id="category-active"
                      type="checkbox"
                      checked={categoryForm.isActive}
                      onChange={(event) =>
                        setCategoryForm({
                          ...categoryForm,
                          isActive: event.target.checked,
                        })
                      }
                    />
                    <span className="input-label" style={{ margin: 0 }}>
                      Active
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSaving}
                  >
                    <MdSave size={20} />{" "}
                    {isSaving
                      ? "Saving..."
                      : modal.id
                        ? "Update Category"
                        : "Save Category"}
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ManageSupportTickets;
