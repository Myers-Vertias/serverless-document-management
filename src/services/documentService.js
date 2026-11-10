import api from "./api";
import { authService } from "./authService";

const documentPath = (documentId) => `/documents/${encodeURIComponent(documentId)}`;
const itemsFrom = (response) => response.data.items || [];

const downloadBlob = async (url, fileName) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("errors.downloadFailed");
  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
};

export const documentService = {
  getDocuments: async () => itemsFrom(await api.get("/documents", { params: { view: "owned", status: "active" } })),

  getDocumentById: async (documentId) => (await api.get(documentPath(documentId))).data,

  toggleFavorite: async (documentId) => {
    const currentUser = authService.getCurrentUser();
    const document = await documentService.getDocumentById(documentId);
    const isFavorited = document.favoritedBy?.includes(currentUser?.email);
    const response = isFavorited
      ? await api.delete(`${documentPath(documentId)}/favorite`)
      : await api.put(`${documentPath(documentId)}/favorite`);
    return response.data;
  },

  getFavoriteDocuments: async () => itemsFrom(await api.get("/favorites")),

  updateMetadata: async (documentId, updates) =>
    (await api.patch(documentPath(documentId), updates)).data,

  shareDocument: async (documentId, targetEmail) =>
    (await api.post(`${documentPath(documentId)}/shares`, { email: targetEmail.trim().toLowerCase() })).data,

  revokeShare: async (documentId, targetEmail) => {
    const document = await documentService.getDocumentById(documentId);
    const share = document.shares?.find((item) => item.recipientEmail?.toLowerCase() === targetEmail.toLowerCase());
    if (!share?.recipientSub) return document;
    return (await api.delete(`${documentPath(documentId)}/shares/${encodeURIComponent(share.recipientSub)}`)).data;
  },

  getSharedDocuments: async () => itemsFrom(await api.get("/documents/shared")),

  uploadDocument: async (file, description = "", category = "Other", tags = []) => {
    if (!file) throw new Error("errors.selectFileRequired");
    const contentType = file.type || "application/octet-stream";
    const { data: upload } = await api.post("/documents/upload-url", {
      fileName: file.name,
      fileSize: file.size,
      contentType,
    });

    const putResponse = await fetch(upload.uploadUrl, {
      method: "PUT",
      // S3's presigner hoists x-amz-meta-document-id into the signed URL query.
      // Sending it again as a request header causes S3 to reject the unsigned header.
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });
    if (!putResponse.ok) {
      const responseText = await putResponse.text();
      let s3Code = "";
      let s3Message = "";
      try {
        const xml = new DOMParser().parseFromString(responseText, "application/xml");
        s3Code = xml.querySelector("Code")?.textContent?.trim() || "";
        s3Message = xml.querySelector("Message")?.textContent?.trim() || "";
      } catch {
        // Keep the HTTP status even if S3 returned an unreadable error body.
      }
      const error = new Error("errors.s3UploadFailed");
      error.s3Details = [putResponse.status, s3Code, s3Message].filter(Boolean).join(" ");
      throw error;
    }

    return (await api.post(`${documentPath(upload.documentId)}/complete`, {
      fileName: file.name,
      description,
      category,
      tags,
    })).data;
  },

  getTrashedDocuments: async () => itemsFrom(await api.get("/documents", { params: { view: "owned", status: "trash" } })),

  moveToTrash: async (documentId) =>
    (await api.post(`${documentPath(documentId)}/trash`)).data,

  restoreFromTrash: async (documentId) =>
    (await api.post(`${documentPath(documentId)}/restore`)).data,

  permanentlyDelete: async (documentId) =>
    (await api.delete(documentPath(documentId))).data,

  deleteDocument: async (documentId) => documentService.permanentlyDelete(documentId),

  downloadDocument: async (doc) => {
    const { data } = await api.get(`${documentPath(doc.documentId)}/download-url`);
    await downloadBlob(data.downloadUrl, data.fileName || doc.fileName);
  },
};
