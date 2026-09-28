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

const emptyForm = { title: "", description: "", textEditor: "" };

const extractRecord = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data[0] || null;
  return data?.record || data?.termAndCondition || data?.privacyPolicy || data;
};

const getBannerPath = (record) => {
  const image = record?.bannerImage;
  if (typeof image === "string") return image;
  return image?.url || image?.path || image?.secure_url || "";
};

const ManageLegalContent = ({ config }) => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [bannerImage, setBannerImage] = useState(null);

  const { data: rawRecords, isLoading } = useQuery({
    queryKey: [config.queryKey],
    queryFn: config.getAll,
  });

  const records = Array.isArray(rawRecords)
    ? rawRecords
    : rawRecords?.data ||
      rawRecords?.records ||
      rawRecords?.[config.collectionKey] ||
      [];

  const { data: rawDetail, isLoading: isDetailLoading } = useQuery({
    queryKey: [config.queryKey, "detail", editingId],
    queryFn: () => config.getById(editingId),
    enabled: Boolean(isModalOpen && editingId),
  });

  useEffect(() => {
    if (!editingId || !rawDetail) return;
    const record = extractRecord(rawDetail);
    if (!record) return;
    setFormData({
      title: record.title || "",
      description: record.description || "",
      textEditor: record.textEditor || "",
    });
  }, [editingId, rawDetail]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(emptyForm);
    setBannerImage(null);
  };

  const createMutation = useMutation({
    mutationFn: config.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast.success(`${config.label} created successfully`);
      closeModal();
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || `Failed to create ${config.label}`,
      ),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => config.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast.success(`${config.label} updated successfully`);
      closeModal();
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || `Failed to update ${config.label}`,
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: config.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [config.queryKey] });
      toast.success(`${config.label} deleted successfully`);
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || `Failed to delete ${config.label}`,
      ),
  });

  const openAddModal = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setBannerImage(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    const id = record._id || record.id;
    setEditingId(id);
    setFormData({
      title: record.title || "",
      description: record.description || "",
      textEditor: record.textEditor || "",
    });
    setBannerImage(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("textEditor", formData.textEditor);
    if (bannerImage) data.append("bannerImage", bannerImage);

    if (editingId) updateMutation.mutate({ id: editingId, data });
    else createMutation.mutate(data);
  };

  const getImageUrl = (record) => {
    const path = getBannerPath(record);
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) return path;
    const baseUrl = import.meta.env.DEV
      ? "http://localhost:5000"
      : "https://backend.viprasaarthi.com";
    return `${baseUrl}/${path.replace(/^\//, "")}`;
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: "-2rem -2rem 2rem -2rem" }}>
        <h1 className="header-title">Manage {config.label}</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <MdAdd size={20} /> Add {config.label}
        </button>
      </div>

      <div
        className="glass-panel"
        style={{ padding: "1.5rem", overflowX: "auto" }}
      >
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "100px" }}>Banner</th>
              <th>Title</th>
              <th>Description</th>
              <th style={{ width: "110px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="4">Loading...</td>
              </tr>
            ) : records.length ? (
              records.map((record) => {
                const id = record._id || record.id;
                const imageUrl = getImageUrl(record);
                return (
                  <tr key={id}>
                    <td>
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${record.title || config.label} banner`}
                          style={{
                            width: "72px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                        />
                      ) : (
                        "No image"
                      )}
                    </td>
                    <td>{record.title || "Untitled"}</td>
                    <td style={{ maxWidth: "360px" }}>
                      {record.description || "—"}
                    </td>
                    <td>
                      <button
                        className="btn-icon edit"
                        aria-label={`Edit ${config.label}`}
                        title="Edit"
                        onClick={() => openEditModal(record)}
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        className="btn-icon delete"
                        aria-label={`Delete ${config.label}`}
                        title="Delete"
                        onClick={() =>
                          showConfirm(`Delete this ${config.label}?`, () =>
                            deleteMutation.mutate(id),
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
                  colSpan="4"
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No {config.label.toLowerCase()} records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen &&
        createPortal(
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content glass-panel"
              onClick={(event) => event.stopPropagation()}
              style={{ maxWidth: "760px", width: "92%" }}
            >
              <div className="modal-header">
                <h2 className="modal-title">
                  {editingId ? `Edit ${config.label}` : `Add ${config.label}`}
                </h2>
                <button
                  className="modal-close-btn"
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <MdClose size={24} />
                </button>
              </div>
              <div className="modal-body" style={{ padding: "1.5rem" }}>
                {isDetailLoading ? (
                  <p>Loading record...</p>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    style={{ display: "grid", gap: "1rem" }}
                  >
                    <div className="input-group">
                      <label
                        className="input-label"
                        htmlFor={`${config.queryKey}-title`}
                      >
                        Title
                      </label>
                      <input
                        id={`${config.queryKey}-title`}
                        className="input-field"
                        value={formData.title}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            title: event.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label
                        className="input-label"
                        htmlFor={`${config.queryKey}-description`}
                      >
                        Description
                      </label>
                      <textarea
                        id={`${config.queryKey}-description`}
                        className="input-field"
                        rows="3"
                        value={formData.description}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            description: event.target.value,
                          })
                        }
                        required
                        style={{ resize: "vertical" }}
                      />
                    </div>
                    <div className="input-group">
                      <label
                        className="input-label"
                        htmlFor={`${config.queryKey}-text-editor`}
                      >
                        Text Editor (HTML/Rich Text)
                      </label>
                      <textarea
                        id={`${config.queryKey}-text-editor`}
                        className="input-field"
                        rows="7"
                        value={formData.textEditor}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            textEditor: event.target.value,
                          })
                        }
                        required
                        style={{ resize: "vertical", fontFamily: "monospace" }}
                      />
                    </div>
                    <div className="input-group">
                      <label
                        className="input-label"
                        htmlFor={`${config.queryKey}-banner`}
                      >
                        Banner Image
                      </label>
                      {editingId &&
                        getImageUrl(extractRecord(rawDetail)) &&
                        !bannerImage && (
                          <img
                            src={getImageUrl(extractRecord(rawDetail))}
                            alt="Current banner"
                            style={{
                              display: "block",
                              width: "160px",
                              height: "90px",
                              objectFit: "cover",
                              borderRadius: "4px",
                              marginBottom: "0.75rem",
                            }}
                          />
                        )}
                      <input
                        id={`${config.queryKey}-banner`}
                        type="file"
                        className="input-field"
                        accept="image/*"
                        onChange={(event) =>
                          setBannerImage(event.target.files?.[0] || null)
                        }
                        required={!editingId}
                      />
                      {bannerImage && <small>{bannerImage.name}</small>}
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving || isDetailLoading}
                    >
                      <MdSave size={20} />{" "}
                      {isSaving ? "Saving..." : editingId ? "Update" : "Save"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ManageLegalContent;
