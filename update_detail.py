import re

file_path = 'src/pages/DocumentDetail.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add States
state_action_loading = 'const [actionLoading, setActionLoading] = useState(false);'
new_states = """const [actionLoading, setActionLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState("Other");
  const [editTagsInput, setEditTagsInput] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const currentUser = authService.getCurrentUser();"""
content = content.replace(state_action_loading, new_states)

# Add Edit functions
handle_delete_end = """      alert(err.message || "Không thể xóa tài liệu!");
      setActionLoading(false);
    }
  };"""
handle_edit_funcs = """

  const handleEditOpen = () => {
    setEditCategory(document.category || "Other");
    setEditTagsInput(document.tags ? document.tags.join(", ") : "");
    setEditDescription(document.description || "");
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const processedTags = editTagsInput.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t)
        .filter((t, index, self) => self.indexOf(t) === index);
        
      const updatedDoc = await documentService.updateMetadata(documentId, {
        category: editCategory,
        tags: processedTags,
        description: editDescription
      });
      setDocument(updatedDoc);
      setEditModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err.message || "Lỗi khi cập nhật metadata!");
    } finally {
      setActionLoading(false);
    }
  };"""
content = content.replace(handle_delete_end, handle_delete_end + handle_edit_funcs)
# fallback for string differences
content = re.sub(r'alert\(err\.message \|\| "[^"]+"\);\s+setActionLoading\(false\);\s+\}\s+\};', lambda m: m.group(0) + handle_edit_funcs, content)


# Display Category and Tags in meta-fields-grid
format_size = """<div className="meta-field-item">
                <span className="meta-label">Kích thước tệp</span>
                <span className="meta-val">{formatBytes(document.fileSize)} ({document.fileSize.toLocaleString()} bytes)</span>
              </div>"""
format_cat_tags = """<div className="meta-field-item">
                <span className="meta-label">Kích thước tệp</span>
                <span className="meta-val">{formatBytes(document.fileSize)} ({document.fileSize.toLocaleString()} bytes)</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Danh mục</span>
                <span className="meta-val">{document.category || "N/A"}</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Thẻ (Tags)</span>
                <span className="meta-val">
                  {document.tags && document.tags.length > 0 
                    ? document.tags.map(t => <span key={t} className="badge badge-tag" style={{marginRight: '4px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem'}}>{t}</span>) 
                    : "N/A"}
                </span>
              </div>"""
# regex to handle encoding issues
content = re.sub(r'<div className="meta-field-item">\s*<span className="meta-label">K[^<]+</span>\s*<span className="meta-val">\{formatBytes[^<]+</span>\s*</div>', format_cat_tags, content)


# Add Edit Button if owner
button_download = """<button className="btn btn-primary" onClick={handleDownload}>"""
button_edit = """
            {document.owner === currentUser?.email && (
              <button className="btn btn-secondary" onClick={handleEditOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                Sửa Metadata
              </button>
            )}
            <button className="btn btn-primary" onClick={handleDownload}>"""
content = content.replace(button_download, button_edit)


# Add Edit Modal
modal_delete = '{/* Delete Confirmation Modal */}'
modal_edit = """
      {/* Edit Metadata Modal */}
      {editModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Chỉnh sửa siêu dữ liệu</h3>
              <button className="modal-close-btn" onClick={() => setEditModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="editCategory">Danh mục</label>
                  <select
                    id="editCategory"
                    className="form-control"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="Other">Khác (Other)</option>
                    <option value="Work">Công việc (Work)</option>
                    <option value="Finance">Tài chính (Finance)</option>
                    <option value="HR">Nhân sự (HR)</option>
                    <option value="Technical">Kỹ thuật (Technical)</option>
                    <option value="Meeting">Cuộc họp (Meeting)</option>
                  </select>
                </div>
                <div className="form-group margin-top-md">
                  <label htmlFor="editTags">Thẻ (Tags)</label>
                  <input
                    type="text"
                    id="editTags"
                    className="form-control"
                    placeholder="Nhập thẻ cách nhau bởi dấu phẩy"
                    value={editTagsInput}
                    onChange={(e) => setEditTagsInput(e.target.value)}
                    disabled={actionLoading}
                  />
                </div>
                <div className="form-group margin-top-md">
                  <label htmlFor="editDescription">Mô tả tài liệu</label>
                  <textarea
                    id="editDescription"
                    className="form-control"
                    rows="3"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    disabled={actionLoading}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={() => setEditModalOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary" 
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}"""
content = content.replace(modal_delete, modal_edit)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
