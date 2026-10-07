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
    await new Promise((resolve) => setTimeout(resolve, 600));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");
    const docs = getStoredDocuments();
    return docs.filter(doc => doc.owner === currentUser.email && doc.deletedAt === null);
  },

  // Get single document by ID
  getDocumentById: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.documentId === documentId);
    if (!doc) {
      throw new Error("Không tìm thấy tài liệu yêu cầu!");
    }
    
    // Check access
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");
    
    const isOwner = doc.owner === currentUser.email;
    const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
    
    if (!isOwner && !isShared) {
      throw new Error("Bạn không có quyền truy cập tài liệu này!");
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
    
    // Check access
    const isOwner = doc.owner === currentUser.email;
    const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
    if (!isOwner && !isShared) {
      throw new Error("Không có quyền thao tác trên tài liệu này!");
    }

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
    return docs.filter(doc => {
      const isOwner = doc.owner === currentUser.email;
      const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
      const isFavorited = doc.favoritedBy && doc.favoritedBy.includes(currentUser.email);
      return isFavorited && doc.deletedAt === null && (isOwner || isShared);
    });
  },


  // Update document metadata
  updateMetadata: async (documentId, updates) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) {
      throw new Error("Chỉ chủ sở hữu mới có quyền chỉnh sửa siêu dữ liệu (metadata)!");
    }

    if (updates.category !== undefined) doc.category = updates.category;
    if (updates.tags !== undefined) doc.tags = updates.tags;
    if (updates.description !== undefined) doc.description = updates.description;
    
    doc.updatedAt = new Date().toISOString();

    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  // Sharing methods
  shareDocument: async (documentId, targetEmail) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền chia sẻ!");
    
    targetEmail = targetEmail.toLowerCase();
    if (doc.owner === targetEmail) throw new Error("Không thể tự chia sẻ cho chính mình!");

    const userExists = await authService.checkUserExists(targetEmail);
    if (!userExists) throw new Error("Tài khoản không tồn tại trong hệ thống.");

    if (!doc.sharedWith) doc.sharedWith = [];
    if (doc.sharedWith.includes(targetEmail)) throw new Error("Tài liệu đã được chia sẻ với người này!");

    doc.sharedWith.push(targetEmail);
    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  revokeShare: async (documentId, targetEmail) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền thu hồi chia sẻ!");

    if (!doc.sharedWith) return doc;
    
    doc.sharedWith = doc.sharedWith.filter(e => e !== targetEmail.toLowerCase());
    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  getSharedDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    return docs.filter(doc => 
      doc.sharedWith && 
      doc.sharedWith.includes(currentUser.email) && 
      doc.deletedAt === null && 
      doc.owner !== currentUser.email
    );
  },

  // Upload document
  // In future AWS, this would:
  // 1. Ask Lambda for an S3 Presigned URL (POST /documents)
  // 2. Upload file directly to S3 with that presigned URL
  // 3. Confirm upload status to DB
  uploadDocument: async (file, description = "", category = "Other", tags = []) => {
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
      favoritedBy: [],
      category: category,
      tags: tags,
      deletedAt: null,
      sharedWith: []
    };

    docs.unshift(newDoc); // Add to beginning of list
    saveDocuments(docs);
    return newDoc;
  },

  // Get trashed documents
  getTrashedDocuments: async () => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    return docs.filter(doc => doc.owner === currentUser.email && doc.deletedAt !== null);
  },

  // Move document to Trash (Soft Delete)
  moveToTrash: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền đưa vào thùng rác!");

    doc.deletedAt = new Date().toISOString();
    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  // Restore document from Trash
  restoreFromTrash: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const docIndex = docs.findIndex((d) => d.documentId === documentId);
    if (docIndex === -1) throw new Error("Không tìm thấy tài liệu!");

    const doc = docs[docIndex];
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền khôi phục!");

    doc.deletedAt = null;
    doc.updatedAt = new Date().toISOString();
    docs[docIndex] = doc;
    saveDocuments(docs);
    return doc;
  },

  // Permanently delete document
  permanentlyDelete: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");

    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.documentId === documentId);
    if (!doc) throw new Error("Không tìm thấy tài liệu!");
    if (doc.owner !== currentUser.email) throw new Error("Chỉ chủ sở hữu mới có quyền xóa vĩnh viễn!");

    const filteredDocs = docs.filter((d) => d.documentId !== documentId);
    saveDocuments(filteredDocs);
    return { success: true };
  },

  // Mock download file
  downloadDocument: async (doc) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) throw new Error("Chưa đăng nhập!");
    
    const isOwner = doc.owner === currentUser.email;
    const isShared = doc.sharedWith && doc.sharedWith.includes(currentUser.email);
    if (!isOwner && !isShared) {
      throw new Error("Không có quyền tải xuống tài liệu này!");
    }
    
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
