import re

with open('src/pages/DocumentDetail.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I will find the div containing formatBytes and replace it.
pattern = r'<div className="meta-field-item">\s*<span className="meta-label">[^<]+</span>\s*<span className="meta-val">\{formatBytes\(document\.fileSize\)\} \(\{document\.fileSize\.toLocaleString\(\)\} bytes\)</span>\s*</div>'

format_cat_tags = """<div className="meta-field-item">
                <span className="meta-label">Kích thước tệp</span>
                <span className="meta-val">{formatBytes(document.fileSize)} ({document.fileSize.toLocaleString()} bytes)</span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Danh mục (Category)</span>
                <span className="meta-val">
                  <span className="badge badge-outline">{document.category || "Other"}</span>
                </span>
              </div>
              <div className="meta-field-item">
                <span className="meta-label">Thẻ (Tags)</span>
                <span className="meta-val">
                  {document.tags && document.tags.length > 0 
                    ? document.tags.map(t => <span key={t} className="badge badge-tag" style={{marginRight: '4px', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem'}}>{t}</span>) 
                    : <span className="text-muted">Không có thẻ</span>}
                </span>
              </div>"""

if re.search(pattern, content):
    content = re.sub(pattern, format_cat_tags, content)
    with open('src/pages/DocumentDetail.jsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced formatBytes div successfully!")
else:
    print("Could not find formatBytes div!")
