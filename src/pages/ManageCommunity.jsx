import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdClose,
  MdDeleteOutline,
  MdEdit,
  MdFavorite,
  MdFavoriteBorder,
  MdSave,
} from "react-icons/md";
import { useConfirmModal } from "../contexts/ConfirmModalContext";
import {
  createCommunityPost,
  deleteCommunityPost,
  getAllCommunityPosts,
  getCommunityPostById,
  getCommunityPostsByAdminId,
  likeCommunityPost,
  unlikeCommunityPost,
  updateCommunityPost,
} from "../api/communityPost";
import {
  createCommunityReply,
  deleteCommunityReply,
  getCommunityReplyById,
  getCommunityRepliesByAdminId,
  updateCommunityReply,
} from "../api/communityReply";

const postTypes = ["Question", "Knowledge", "Suggestion"];
const emptyPost = {
  userId: "",
  title: "",
  description: "",
  type: "Question",
  tags: "",
};
const emptyReply = { postId: "", userId: "", reply: "" };

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
const postIdOf = (reply) => {
  const post = reply?.postId || reply?.post;
  return typeof post === "object" ? idOf(post) || "" : post || "";
};

const ManageCommunity = () => {
  const { showConfirm } = useConfirmModal();
  const queryClient = useQueryClient();
  const adminId = getAdminId();
  const [section, setSection] = useState("posts");
  const [modal, setModal] = useState({ type: "", id: null });
  const [postForm, setPostForm] = useState(emptyPost);
  const [replyForm, setReplyForm] = useState(emptyReply);
  const [reaction, setReaction] = useState({ postId: "", action: "" });
  const [reactionUserId, setReactionUserId] = useState("");

  const {
    data: rawPosts = [],
    isLoading: isLoadingPosts,
    isError: postsError,
  } = useQuery({
    queryKey: ["communityPosts", "admin", adminId],
    queryFn: () => getCommunityPostsByAdminId(adminId),
    enabled: Boolean(adminId),
  });
  const ownPosts = unwrapList(rawPosts, ["posts", "communityPosts"]);

  const { data: rawAllPosts = [] } = useQuery({
    queryKey: ["communityPosts", "all"],
    queryFn: getAllCommunityPosts,
  });
  const allPosts = unwrapList(rawAllPosts, ["posts", "communityPosts"]);

  const {
    data: rawReplies = [],
    isLoading: isLoadingReplies,
    isError: repliesError,
  } = useQuery({
    queryKey: ["communityReplies", "admin", adminId],
    queryFn: () => getCommunityRepliesByAdminId(adminId),
    enabled: Boolean(adminId),
  });
  const ownReplies = unwrapList(rawReplies, ["replies", "communityReplies"]);

  const { data: rawPostDetail, isLoading: isLoadingPostDetail } = useQuery({
    queryKey: ["communityPosts", "detail", modal.id],
    queryFn: () => getCommunityPostById(modal.id),
    enabled: modal.type === "post" && Boolean(modal.id),
  });
  const { data: rawReplyDetail, isLoading: isLoadingReplyDetail } = useQuery({
    queryKey: ["communityReplies", "detail", modal.id],
    queryFn: () => getCommunityReplyById(modal.id),
    enabled: modal.type === "reply" && Boolean(modal.id),
  });

  useEffect(() => {
    if (modal.type !== "post" || !rawPostDetail) return;
    const post = unwrapRecord(rawPostDetail, ["post", "communityPost"]);
    if (!post) return;
    setPostForm({
      userId:
        typeof post.userId === "object"
          ? idOf(post.userId) || ""
          : post.userId || "",
      title: post.title || "",
      description: post.description || "",
      type: post.type || "Question",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : post.tags || "",
    });
  }, [modal.type, rawPostDetail]);

  useEffect(() => {
    if (modal.type !== "reply" || !rawReplyDetail) return;
    const reply = unwrapRecord(rawReplyDetail, ["reply", "communityReply"]);
    if (!reply) return;
    setReplyForm({
      postId: postIdOf(reply),
      userId:
        typeof reply.userId === "object"
          ? idOf(reply.userId) || ""
          : reply.userId || "",
      reply: reply.reply || "",
    });
  }, [modal.type, rawReplyDetail]);

  const closeModal = () => {
    setModal({ type: "", id: null });
    setPostForm(emptyPost);
    setReplyForm(emptyReply);
  };
  const refreshPosts = () => {
    queryClient.invalidateQueries({
      queryKey: ["communityPosts", "admin", adminId],
    });
    queryClient.invalidateQueries({ queryKey: ["communityPosts", "all"] });
  };
  const refreshReplies = () =>
    queryClient.invalidateQueries({
      queryKey: ["communityReplies", "admin", adminId],
    });

  const createPostMutation = useMutation({
    mutationFn: createCommunityPost,
    onSuccess: () => {
      refreshPosts();
      toast.success("Community post created");
      closeModal();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Failed to create post"),
  });
  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => updateCommunityPost(id, data),
    onSuccess: () => {
      refreshPosts();
      toast.success("Community post updated");
      closeModal();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Failed to update post"),
  });
  const deletePostMutation = useMutation({
    mutationFn: deleteCommunityPost,
    onSuccess: () => {
      refreshPosts();
      toast.success("Community post deleted");
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Failed to delete post"),
  });
  const createReplyMutation = useMutation({
    mutationFn: createCommunityReply,
    onSuccess: () => {
      refreshReplies();
      toast.success("Reply created");
      closeModal();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Failed to create reply"),
  });
  const updateReplyMutation = useMutation({
    mutationFn: ({ id, data }) => updateCommunityReply(id, data),
    onSuccess: () => {
      refreshReplies();
      toast.success("Reply updated");
      closeModal();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Failed to update reply"),
  });
  const deleteReplyMutation = useMutation({
    mutationFn: deleteCommunityReply,
    onSuccess: refreshReplies,
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Failed to delete reply"),
  });
  const reactionMutation = useMutation({
    mutationFn: ({ postId, action, data }) =>
      action === "like"
        ? likeCommunityPost(postId, data)
        : unlikeCommunityPost(postId, data),
    onSuccess: () => {
      refreshPosts();
      toast.success(reaction.action === "like" ? "Post liked" : "Post unliked");
      setReaction({ postId: "", action: "" });
      setReactionUserId("");
    },
    onError: (error) =>
      toast.error(
        error?.response?.data?.message || "Failed to update post reaction",
      ),
  });

  const openPost = (post = null) => {
    setPostForm(
      post
        ? {
            userId:
              typeof post.userId === "object"
                ? idOf(post.userId) || ""
                : post.userId || "",
            title: post.title || "",
            description: post.description || "",
            type: post.type || "Question",
            tags: Array.isArray(post.tags)
              ? post.tags.join(", ")
              : post.tags || "",
          }
        : emptyPost,
    );
    setModal({ type: "post", id: post ? idOf(post) : null });
  };
  const openReply = (reply = null) => {
    setReplyForm(
      reply
        ? {
            postId: postIdOf(reply),
            userId:
              typeof reply.userId === "object"
                ? idOf(reply.userId) || ""
                : reply.userId || "",
            reply: reply.reply || "",
          }
        : emptyReply,
    );
    setModal({ type: "reply", id: reply ? idOf(reply) : null });
  };
  const handlePostSubmit = (event) => {
    event.preventDefault();
    const data = {
      ...postForm,
      adminId,
      tags: postForm.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    if (modal.id) updatePostMutation.mutate({ id: modal.id, data });
    else createPostMutation.mutate(data);
  };
  const handleReplySubmit = (event) => {
    event.preventDefault();
    const data = { ...replyForm, adminId };
    if (modal.id)
      updateReplyMutation.mutate({ id: modal.id, data: { reply: data.reply } });
    else createReplyMutation.mutate(data);
  };

  const isSaving =
    createPostMutation.isPending ||
    updatePostMutation.isPending ||
    createReplyMutation.isPending ||
    updateReplyMutation.isPending;
  const isDetailLoading = isLoadingPostDetail || isLoadingReplyDetail;
  const openReaction = (post, action) => {
    setReaction({ postId: idOf(post), action });
    setReactionUserId("");
  };

  return (
    <div className="page-content animate-fade-in">
      <div className="top-header" style={{ margin: "-2rem -2rem 2rem -2rem" }}>
        <h1 className="header-title">Community</h1>
        {section === "posts" ? (
          <button
            className="btn btn-primary"
            onClick={() => openPost()}
            disabled={!adminId}
          >
            <MdAdd size={20} /> Create Post
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => openReply()}
            disabled={!adminId || !allPosts.length}
          >
            <MdAdd size={20} /> Add Reply
          </button>
        )}
      </div>

      <div
        role="tablist"
        aria-label="Community management"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "1.25rem",
        }}
      >
        <button
          role="tab"
          aria-selected={section === "posts"}
          className={`btn ${section === "posts" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSection("posts")}
        >
          Posts
        </button>
        <button
          role="tab"
          aria-selected={section === "replies"}
          className={`btn ${section === "replies" ? "btn-primary" : "btn-outline"}`}
          onClick={() => setSection("replies")}
        >
          Replies
        </button>
      </div>

      {section === "posts" ? (
        <div
          className="glass-panel"
          style={{ padding: "1.5rem", overflowX: "auto" }}
        >
          {!adminId ? (
            <p>
              Admin ID is unavailable. Sign in again to manage community posts.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Tags</th>
                  <th>Likes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingPosts ? (
                  <tr>
                    <td colSpan="5">Loading posts...</td>
                  </tr>
                ) : postsError ? (
                  <tr>
                    <td colSpan="5">Unable to load your posts.</td>
                  </tr>
                ) : ownPosts.length ? (
                  ownPosts.map((post) => (
                    <tr key={idOf(post)}>
                      <td>{post.title || "Untitled"}</td>
                      <td>{post.type || "—"}</td>
                      <td>
                        {Array.isArray(post.tags)
                          ? post.tags.join(", ")
                          : post.tags || "—"}
                      </td>
                      <td>
                        {Array.isArray(post.likes)
                          ? post.likes.length
                          : (post.likeCount ?? 0)}
                      </td>
                      <td>
                        <button
                          className="btn-icon"
                          aria-label="Like post"
                          title="Like"
                          onClick={() => openReaction(post, "like")}
                        >
                          <MdFavorite size={18} />
                        </button>
                        <button
                          className="btn-icon"
                          aria-label="Unlike post"
                          title="Unlike"
                          onClick={() => openReaction(post, "unlike")}
                        >
                          <MdFavoriteBorder size={18} />
                        </button>
                        <button
                          className="btn-icon edit"
                          aria-label="Edit post"
                          title="Edit"
                          onClick={() => openPost(post)}
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          className="btn-icon delete"
                          aria-label="Delete post"
                          title="Delete"
                          onClick={() =>
                            showConfirm("Delete this community post?", () =>
                              deletePostMutation.mutate(idOf(post)),
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
                      colSpan="5"
                      style={{ textAlign: "center", padding: "2rem" }}
                    >
                      No posts created by this admin.
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
          {!adminId ? (
            <p>
              Admin ID is unavailable. Sign in again to manage community
              replies.
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Reply</th>
                  <th>User ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingReplies ? (
                  <tr>
                    <td colSpan="4">Loading replies...</td>
                  </tr>
                ) : repliesError ? (
                  <tr>
                    <td colSpan="4">Unable to load your replies.</td>
                  </tr>
                ) : ownReplies.length ? (
                  ownReplies.map((reply) => {
                    const postId = postIdOf(reply);
                    const post = allPosts.find((item) => idOf(item) === postId);
                    return (
                      <tr key={idOf(reply)}>
                        <td>
                          {post?.title || String(postId || "Unknown post")}
                        </td>
                        <td>{reply.reply || ""}</td>
                        <td>
                          {typeof reply.userId === "object"
                            ? reply.userId.fullName || idOf(reply.userId)
                            : reply.userId || "—"}
                        </td>
                        <td>
                          <button
                            className="btn-icon edit"
                            aria-label="Edit reply"
                            title="Edit"
                            onClick={() => openReply(reply)}
                          >
                            <MdEdit size={18} />
                          </button>
                          <button
                            className="btn-icon delete"
                            aria-label="Delete reply"
                            title="Delete"
                            onClick={() =>
                              showConfirm("Delete this community reply?", () =>
                                deleteReplyMutation.mutate(idOf(reply)),
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
                      No replies created by this admin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {modal.type &&
        createPortal(
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content"
              onClick={(event) => event.stopPropagation()}
              style={{ maxWidth: "680px", width: "92%" }}
            >
              <div className="modal-header">
                <h2>
                  {modal.type === "post"
                    ? `${modal.id ? "Edit" : "Create"} Community Post`
                    : `${modal.id ? "Edit" : "Add"} Community Reply`}
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
              ) : modal.type === "post" ? (
                <form
                  className="modal-body"
                  onSubmit={handlePostSubmit}
                  style={{ display: "grid", gap: "1rem" }}
                >
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-post-user"
                    >
                      User ID
                    </label>
                    <input
                      id="community-post-user"
                      className="input-field"
                      value={postForm.userId}
                      onChange={(event) =>
                        setPostForm({ ...postForm, userId: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-post-admin"
                    >
                      Admin ID
                    </label>
                    <input
                      id="community-post-admin"
                      className="input-field"
                      value={adminId}
                      readOnly
                    />
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-post-title"
                    >
                      Title
                    </label>
                    <input
                      id="community-post-title"
                      className="input-field"
                      value={postForm.title}
                      onChange={(event) =>
                        setPostForm({ ...postForm, title: event.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-post-description"
                    >
                      Description
                    </label>
                    <textarea
                      id="community-post-description"
                      className="input-field"
                      rows="5"
                      value={postForm.description}
                      onChange={(event) =>
                        setPostForm({
                          ...postForm,
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
                      htmlFor="community-post-type"
                    >
                      Type
                    </label>
                    <select
                      id="community-post-type"
                      className="input-field"
                      value={postForm.type}
                      onChange={(event) =>
                        setPostForm({ ...postForm, type: event.target.value })
                      }
                    >
                      {postTypes.map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-post-tags"
                    >
                      Tags
                    </label>
                    <input
                      id="community-post-tags"
                      className="input-field"
                      value={postForm.tags}
                      onChange={(event) =>
                        setPostForm({ ...postForm, tags: event.target.value })
                      }
                      placeholder="Separate tags with commas"
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
                        ? "Update Post"
                        : "Create Post"}
                  </button>
                </form>
              ) : (
                <form
                  className="modal-body"
                  onSubmit={handleReplySubmit}
                  style={{ display: "grid", gap: "1rem" }}
                >
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-reply-post"
                    >
                      Post
                    </label>
                    <select
                      id="community-reply-post"
                      className="input-field"
                      value={replyForm.postId}
                      onChange={(event) =>
                        setReplyForm({
                          ...replyForm,
                          postId: event.target.value,
                        })
                      }
                      required
                    >
                      <option value="" disabled>
                        Select a post
                      </option>
                      {allPosts.map((post) => (
                        <option key={idOf(post)} value={idOf(post)}>
                          {post.title || "Untitled post"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-reply-user"
                    >
                      User ID
                    </label>
                    <input
                      id="community-reply-user"
                      className="input-field"
                      value={replyForm.userId}
                      onChange={(event) =>
                        setReplyForm({
                          ...replyForm,
                          userId: event.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-reply-admin"
                    >
                      Admin ID
                    </label>
                    <input
                      id="community-reply-admin"
                      className="input-field"
                      value={adminId}
                      readOnly
                    />
                  </div>
                  <div className="input-group">
                    <label
                      className="input-label"
                      htmlFor="community-reply-text"
                    >
                      Reply
                    </label>
                    <textarea
                      id="community-reply-text"
                      className="input-field"
                      rows="5"
                      value={replyForm.reply}
                      onChange={(event) =>
                        setReplyForm({
                          ...replyForm,
                          reply: event.target.value,
                        })
                      }
                      required
                      style={{ resize: "vertical" }}
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
                        ? "Update Reply"
                        : "Create Reply"}
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}

      {reaction.action &&
        createPortal(
          <div
            className="modal-overlay"
            onClick={() => setReaction({ postId: "", action: "" })}
          >
            <form
              className="modal-content"
              onClick={(event) => event.stopPropagation()}
              onSubmit={(event) => {
                event.preventDefault();
                reactionMutation.mutate({
                  postId: reaction.postId,
                  action: reaction.action,
                  data: { userId: reactionUserId, adminId },
                });
              }}
              style={{ maxWidth: "420px", width: "92%" }}
            >
              <div className="modal-header">
                <h2>
                  {reaction.action === "like" ? "Like Post" : "Unlike Post"}
                </h2>
                <button
                  className="btn-icon"
                  type="button"
                  aria-label="Close"
                  onClick={() => setReaction({ postId: "", action: "" })}
                >
                  <MdClose size={24} />
                </button>
              </div>
              <div
                className="modal-body"
                style={{ display: "grid", gap: "1rem" }}
              >
                <div className="input-group">
                  <label className="input-label" htmlFor="reaction-user-id">
                    User ID
                  </label>
                  <input
                    id="reaction-user-id"
                    className="input-field"
                    value={reactionUserId}
                    onChange={(event) => setReactionUserId(event.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={reactionMutation.isPending || !adminId}
                >
                  {reactionMutation.isPending
                    ? "Saving..."
                    : reaction.action === "like"
                      ? "Like Post"
                      : "Unlike Post"}
                </button>
              </div>
            </form>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default ManageCommunity;
