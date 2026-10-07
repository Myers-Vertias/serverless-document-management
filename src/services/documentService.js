import { mockDocuments } from "../data/mockDocuments";
import { authService } from "./authService";

const DOCUMENTS_KEY = "sdms_documents";

// Initialize localStorage with mock documents if empty
const initDocuments = () => {
  const existingDocs = localStorage.getItem(DOCUMENTS_KEY);
  if (!existingDocs) {
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(mockDocuments));
    return mockDocuments;
  }
  return JSON.parse(existingDocs);
};

const getStoredDocuments = () => {
  return initDocuments();
};

const saveDocuments = (documents) => {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
};

export const documentService = {
  // Get all documents (can filter or search if needed, but we can do it on frontend)
  getDocuments: async () => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    return getStoredDocuments();
  },

  // Get single document by ID
  getDocumentById: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.documentId === documentId);
    if (!doc) {
      throw new Error("Không tìm thấy tài liệu yêu cầu!");
    }
    return doc;
  },

  // Toggle Favorite
  toggleFavorite: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (!doc.favoritedBy) doc.favoritedBy = [];

    const userEmail = currentUser.email;
    const isFavorited = doc.favoritedBy.includes(userEmail);

    if (isFavorited) {
      doc.favoritedBy = doc.favoritedBy.filter(email => email !== userEmail);
    } else {
      doc.favoritedBy.push(userEmail);
    }

    saveDocuments(docs);
    return doc;
  },

  // Get favorite documents
  getFavoriteDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    // Filter docs where currentUser's email is in favoritedBy and doc is not in trash
    // (Trash logic is not implemented yet, so we assume all are active for now)
    return docs.filter(doc => doc.favoritedBy && doc.favoritedBy.includes(currentUser.email));
  },

  // Upload document
  // In future AWS, this would:
  // 1. Ask Lambda for an S3 Presigned URL (POST /documents)
  // 2. Upload file directly to S3 with that presigned URL
  // 3. Confirm upload status to DB
  uploadDocument: async (file, description = "") => {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate S3 direct upload speed

    if (!file) {
      throw new Error("Vui lòng chọn một tệp tin!");
    }

    const currentUser = authService.getCurrentUser();
    const docs = getStoredDocuments();
    
    const docId = "doc-" + Math.random().toString(36).substring(2, 9);
    const fileExtension = file.name.split(".").pop().toLowerCase();

    const newDoc = {
      documentId: docId,
      fileName: file.name,
      fileType: fileExtension,
      fileSize: file.size,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: currentUser ? currentUser.email : "guest@university.edu.vn",
      status: "active", // In real life, could be "processing" until Lambda triggers finish processing
      s3Key: `uploads/${docId}/${file.name}`,
      description: description,
      favoritedBy: []
    };

    docs.unshift(newDoc); // Add to beginning of list
    saveDocuments(docs);
    return newDoc;
  },

  // Delete document
  deleteDocument: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const docs = getStoredDocuments();
    const filteredDocs = docs.filter((d) => d.documentId !== documentId);
    
    if (docs.length === filteredDocs.length) {
      throw new Error("Không tìm thấy tài liệu để xóa!");
    }

    saveDocuments(filteredDocs);
    return { success: true };
  },

  // Mock download file
  downloadDocument: async (doc) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Create a mock download action by building a dummy text content and triggering file download
    const element = document.createElement("a");
    const fileContent = `[MOCK S3 DOWNLOAD]\nDocument ID: ${doc.documentId}\nFile Name: ${doc.fileName}\nS3 Key: ${doc.s3Key}\nSize: ${doc.fileSize} bytes\nOwner: ${doc.owner}\n\nĐây là nội dung giả lập tải xuống trực tiếp từ AWS S3 thông qua Presigned URL.`;
    const file = new Blob([fileContent], { type: "text/plain" });
    
    element.href = URL.createObjectURL(file);
    element.download = doc.fileName + ".txt"; // append mock extension to indicate mock file
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
};
