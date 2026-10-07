import re

file_path = 'src/services/documentService.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

update_metadata_code = """
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

  // Upload document"""

# Add updateMetadata before uploadDocument
content = content.replace('  // Upload document', update_metadata_code)

# Modify uploadDocument to accept category and tags
upload_sig = 'uploadDocument: async (file, description = "") => {'
new_upload_sig = 'uploadDocument: async (file, description = "", category = "Other", tags = []) => {'
content = content.replace(upload_sig, new_upload_sig)

upload_obj = """      description: description,
      favoritedBy: []
    };"""
new_upload_obj = """      description: description,
      favoritedBy: [],
      category: category,
      tags: tags
    };"""
content = content.replace(upload_obj, new_upload_obj)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
