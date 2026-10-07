import re

file_path = 'src/pages/DocumentDetail.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for restore
state_action_loading = 'const [actionLoading, setActionLoading] = useState(false);'
new_states = """const [actionLoading, setActionLoading] = useState(false);
  const [trashModalOpen, setTrashModalOpen] = useState(false);"""
content = content.replace(state_action_loading, new_states)

# Replace handleDelete
handle_delete_orig = """  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await documentService.deleteDocument(documentId);
      navigate("/documents");
    } catch (err) {
      alert(err.message || "Không thể xóa tài liệu!");
      setActionLoading(false);
    }
  };"""

handle_delete_new = """  const handleMoveToTrash = async () => {
    setActionLoading(true);
    try {
      await documentService.moveToTrash(documentId);
      navigate("/documents");
    } catch (err) {
      alert(err.message || "Không thể đưa vào thùng rác!");
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      const updatedDoc = await documentService.restoreFromTrash(documentId);
      setDocument(updatedDoc);
    } catch (err) {
      alert(err.message || "Không thể khôi phục tài liệu!");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePermanently = async () => {
    setActionLoading(true);
    try {
      await documentService.permanentlyDelete(documentId);
      navigate("/trash");
    } catch (err) {
      alert(err.message || "Không thể xóa vĩnh viễn tài liệu!");
      setActionLoading(false);
    }
  };"""
content = content.replace(handle_delete_orig, handle_delete_new)
# regex fallback
if handle_delete_orig not in content:
    content = re.sub(r'const handleDelete = async \(\) => \{[\s\S]*?\};\n', handle_delete_new + '\n', content)


# Modify Action buttons
actions_orig = """          <div className="action-buttons-stack">
            {document.owner === currentUser?.email && (
              <button className="btn btn-secondary" onClick={handleEditOpen}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                </svg>
                Sửa Metadata
              </button>
            )}
            <button className="btn btn-primary" onClick={handleDownload}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Tải xuống (S3 Presigned)
            </button>
            <button className="btn btn-danger-outline" onClick={() => setDeleteModalOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
              Xóa tài liệu (S3 & DB)
            </button>
            <Link to="/documents" className="btn btn-secondary-outline text-center">
              Quay lại danh sách
            </Link>
          </div>"""

actions_new = """          {document.deletedAt ? (
            <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
              <strong>Tài liệu này đang trong Thùng rác.</strong> Không thể xem chi tiết hoặc tải xuống cho đến khi được khôi phục.
            </div>
          ) : null}
          <div className="action-buttons-stack">
            {document.deletedAt === null ? (
              <>
                {document.owner === currentUser?.email && (
                  <button className="btn btn-secondary" onClick={handleEditOpen}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    Sửa Metadata
                  </button>
                )}
                <button className="btn btn-primary" onClick={handleDownload}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="btn-icon">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Tải xuống (S3 Presigned)
                </button>
                {document.owner === currentUser?.email && (
                  <button className="btn btn-danger-outline" onClick={() => setTrashModalOpen(true)}>
                    Đưa vào thùng rác
                  </button>
                )}
              </>
            ) : (
              <>
                {document.owner === currentUser?.email && (
                  <>
                    <button className="btn btn-primary" onClick={handleRestore} disabled={actionLoading}>
                      Khôi phục tài liệu
                    </button>
                    <button className="btn btn-danger-outline" onClick={() => setDeleteModalOpen(true)}>
                      Xóa vĩnh viễn
                    </button>
                  </>
                )}
              </>
            )}
            <Link to="/documents" className="btn btn-secondary-outline text-center">
              Quay lại danh sách
            </Link>
          </div>"""

# Ensure the replacement matches any previous modifications to the buttons stack
content = re.sub(r'<div className="action-buttons-stack">[\s\S]*?<Link to="/documents" className="btn btn-secondary-outline text-center">\s*Quay lại danh sách\s*</Link>\s*</div>', actions_new, content)

# Modify the Delete Confirmation Modal and add Trash Modal
modals_orig = r'\{\/\* Delete Confirmation Modal \*\/\}([\s\S]*?)<h2>Không tìm thấy tập tin!</h2>'
modals_replacement = """{/* Move to Trash Confirmation Modal */}
      {trashModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Đưa vào thùng rác</h3>
              <button className="modal-close-btn" onClick={() => setTrashModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn đưa tài liệu <strong>{document.fileName}</strong> vào Thùng rác không?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTrashModalOpen(false)} disabled={actionLoading}>Hủy bỏ</button>
              <button className="btn btn-danger" onClick={handleMoveToTrash} disabled={actionLoading}>Đưa vào Thùng rác</button>
            </div>
          </div>
        </div>
      )}

      {/* Permanently Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Xác nhận xóa vĩnh viễn</h3>
              <button className="modal-close-btn" onClick={() => setDeleteModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc chắn muốn xóa vĩnh viễn tệp <strong>{document.fileName}</strong>?</p>
              <p className="delete-warning">Thao tác này không thể hoàn tác. Tài liệu sẽ bị xóa hoàn toàn khỏi hệ thống.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteModalOpen(false)} disabled={actionLoading}>Hủy bỏ</button>
              <button className="btn btn-danger" onClick={handleDeletePermanently} disabled={actionLoading}>Xác nhận xóa vĩnh viễn</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentDetail;"""

content = re.sub(r'\{\/\* Delete Confirmation Modal \*\/\}[\s\S]*?export default DocumentDetail;', modals_replacement, content)

# Also block favorite toggle for trashed document
toggle_fav_orig = 'const updatedDoc = await documentService.toggleFavorite(documentId);'
toggle_fav_new = """if (document.deletedAt !== null) {
        alert("Không thể thao tác với tài liệu trong thùng rác!");
        return;
      }
      const updatedDoc = await documentService.toggleFavorite(documentId);"""
content = content.replace(toggle_fav_orig, toggle_fav_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
