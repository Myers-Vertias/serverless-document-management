import re

file_path = 'src/services/documentService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update getDocumentById to check access
get_by_id_old = """  getDocumentById: async (documentId) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const docs = getStoredDocuments();
    const doc = docs.find((d) => d.documentId === documentId);
    if (!doc) {
      throw new Error("Không tìm thấy tài liệu yêu cầu!");
    }
    return doc;
  },"""
get_by_id_new = """  getDocumentById: async (documentId) => {
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
  },"""
# Fallback regex due to unicode / encoding
content = re.sub(r'  getDocumentById: async \(documentId\) => \{[\s\S]*?return doc;\n  \},', get_by_id_new, content)

# 2. Add share methods
share_methods = """  // Sharing methods
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

  // Upload document"""
content = content.replace('  // Upload document', share_methods)

# 3. Update uploadDocument
upload_old = """      tags: tags,
      deletedAt: null
    };"""
upload_new = """      tags: tags,
      deletedAt: null,
      sharedWith: []
    };"""
content = content.replace(upload_old, upload_new)

# 4. Helper function 'canView' (though we check it inline mostly, but just in case)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
