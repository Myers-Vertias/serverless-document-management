import re

def fix_ui(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the whole filter-search-container down to search-box-wrapper end
    pattern = r'<div className="filter-search-container">\s*<div className="search-box-wrapper">[\s\S]*?<input[\s\S]*?onChange=\{\(e\) => setSearchQuery\(e\.target\.value\)\}\s*/>\s*</div>'
    
    ui_new = """<div className="filter-search-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
            <div className="search-box-wrapper" style={{ flex: 1, minWidth: '300px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="search-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Tìm kiếm tên, người sở hữu, danh mục, thẻ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="form-control" 
              style={{ width: '200px', height: '42px', flexShrink: 0 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              <option value="Other">Khác (Other)</option>
              <option value="Work">Công việc (Work)</option>
              <option value="Finance">Tài chính (Finance)</option>
              <option value="HR">Nhân sự (HR)</option>
              <option value="Technical">Kỹ thuật (Technical)</option>
              <option value="Meeting">Cuộc họp (Meeting)</option>
            </select>
          </div>"""
          
    if re.search(pattern, content):
        content = re.sub(pattern, ui_new, content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed UI in {file_path}")
    else:
        print(f"UI pattern not found in {file_path}")

fix_ui('src/pages/Documents.jsx')
fix_ui('src/pages/Favorites.jsx')
