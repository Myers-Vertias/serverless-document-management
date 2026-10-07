import re

file_path = 'src/pages/Upload.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
state_desc = 'const [description, setDescription] = useState("");'
state_cat_tags = """const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [tagsInput, setTagsInput] = useState("");"""
content = content.replace(state_desc, state_cat_tags)

# Update submit logic
upload_call = 'await documentService.uploadDocument(selectedFile, description);'
upload_call_new = """
      const processedTags = tagsInput.split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t)
        .filter((t, index, self) => self.indexOf(t) === index);

      await documentService.uploadDocument(selectedFile, description, category, processedTags);
"""
content = content.replace(upload_call, upload_call_new)

# Update reset logic
reset_desc = 'setDescription("");'
reset_cat_tags = """setDescription("");
      setCategory("Other");
      setTagsInput("");"""
content = content.replace(reset_desc, reset_cat_tags)

# Add form fields
form_group_desc = '<div className="form-group margin-top-lg">'
form_group_cat_tags = """<div className="form-group margin-top-md">
              <label htmlFor="category">Danh mục (Category)</label>
              <select
                id="category"
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={uploading}
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
              <label htmlFor="tags">Thẻ (Tags)</label>
              <input
                type="text"
                id="tags"
                className="form-control"
                placeholder="Nhập thẻ cách nhau bằng dấu phẩy (vd: aws, report)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={uploading}
              />
            </div>

            <div className="form-group margin-top-md">"""
content = content.replace(form_group_desc, form_group_cat_tags)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
