import React, { useEffect, useRef, useState } from 'react';
import {
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdFormatQuote,
  MdCode,
  MdInsertLink,
  MdImage,
  MdTableChart,
  MdHorizontalRule,
  MdUndo,
  MdRedo,
  MdFormatClear,
  MdFormatColorText,
  MdFormatColorFill,
  MdVisibility,
  MdEdit,
  MdFormatIndentIncrease,
  MdFormatIndentDecrease,
  MdClose,
  MdCheck,
  MdCloudUpload,
} from 'react-icons/md';

const SACRED_SYMBOLS = ['ॐ', '॥', '।', 'श्री', 'स्वस्ति', '🪔', '🪷', '🙏', '📿', '🔔'];

const RichTextEditor = ({
  value = '',
  onChange,
  placeholder = 'Start writing or formatting content here...',
  minHeight = '185px',
}) => {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const lastEmittedValueRef = useRef(null);

  const [mode, setMode] = useState('visual'); // 'visual' | 'html' | 'preview'
  const [textColor, setTextColor] = useState('#3E1F0C');
  const [bgColor, setBgColor] = useState('#FEF08A');

  // Popover states for link, image, table
  const [activePopover, setActivePopover] = useState(null); // 'link' | 'image' | 'table' | null
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const prevModeRef = useRef(mode);

  // Sync external `value` changes or mode switches into contentEditable without resetting cursor on internal typing
  useEffect(() => {
    const modeChangedToVisual = prevModeRef.current !== 'visual' && mode === 'visual';
    prevModeRef.current = mode;

    if (mode !== 'visual') return;
    const el = editorRef.current;
    if (!el) return;

    if (modeChangedToVisual || (value !== lastEmittedValueRef.current && el.innerHTML !== (value || ''))) {
      el.innerHTML = value || '';
      lastEmittedValueRef.current = value;
    }
  }, [value, mode]);

  const emitChange = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    // Normalize empty <br> left by browsers when content is cleared
    const normalized = html === '<br>' || html === '<div><br></div>' ? '' : html;
    lastEmittedValueRef.current = normalized;
    onChange?.(normalized);
  };

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      }
    }
  };

  const restoreSelection = () => {
    const el = editorRef.current;
    if (el) el.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
    }
  };

  const execCmd = (command, val = null) => {
    if (mode !== 'visual') return;
    restoreSelection();
    document.execCommand(command, false, val);
    saveSelection();
    emitChange();
  };

  const handleInsertHtml = (html) => {
    if (mode === 'html') {
      const next = (value || '') + html;
      lastEmittedValueRef.current = next;
      onChange?.(next);
      return;
    }
    if (mode !== 'visual') return;
    restoreSelection();
    document.execCommand('insertHTML', false, html);
    saveSelection();
    emitChange();
  };

  const handleInsertLink = (e) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;
    const safeUrl = /^https?:\/\//i.test(linkUrl.trim()) || linkUrl.trim().startsWith('/')
      ? linkUrl.trim()
      : `https://${linkUrl.trim()}`;
    const displayText = linkText.trim() || safeUrl;
    handleInsertHtml(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="color: #82001E; text-decoration: underline;">${displayText}</a>`);
    setLinkUrl('');
    setLinkText('');
    setActivePopover(null);
  };

  const handleInsertImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;
    handleInsertHtml(`<img src="${imageUrl.trim()}" alt="Pooja Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`);
    setImageUrl('');
    setActivePopover(null);
  };

  const handleUploadImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleInsertHtml(`<img src="${reader.result}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />`);
      setActivePopover(null);
    };
    reader.readAsDataURL(file);
  };

  const handleInsertTable = (e) => {
    e.preventDefault();
    const rows = Math.max(1, Math.min(12, Number(tableRows) || 3));
    const cols = Math.max(1, Math.min(8, Number(tableCols) || 3));
    let html = '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #D1D5DB;">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          html += `<th style="border: 1px solid #D1D5DB; padding: 8px; background: #FDF9F1; text-align: left; font-weight: 700;">Header ${c + 1}</th>`;
        } else {
          html += `<td style="border: 1px solid #D1D5DB; padding: 8px;">Cell</td>`;
        }
      }
      html += '</tr>';
    }
    html += '</table><p><br/></p>';
    handleInsertHtml(html);
    setActivePopover(null);
  };

  const plainText = (value || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  const wordCount = plainText ? plainText.split(/\s+/).length : 0;
  const charCount = plainText.length;

  return (
    <div className="rte-container">
      {/* Top Bar: Mode Switcher + Sacred Symbols */}
      <div className="rte-top-bar">
        <div className="rte-mode-tabs">
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`rte-mode-btn ${mode === 'visual' ? 'active' : ''}`}
          >
            <MdEdit size={15} /> Visual Editor
          </button>
          <button
            type="button"
            onClick={() => setMode('html')}
            className={`rte-mode-btn ${mode === 'html' ? 'active' : ''}`}
          >
            <MdCode size={16} /> HTML Source
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`rte-mode-btn ${mode === 'preview' ? 'active' : ''}`}
          >
            <MdVisibility size={15} /> Preview
          </button>
        </div>

        {/* Sacred Quick Symbols */}
        {mode !== 'preview' && (
          <div className="rte-symbols-bar" title="Click to insert sacred symbol">
            <span className="rte-symbols-label">Symbols:</span>
            {SACRED_SYMBOLS.map((sym) => (
              <button
                key={sym}
                type="button"
                className="rte-symbol-btn"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleInsertHtml(sym);
                }}
              >
                {sym}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Rich Formatting Toolbar (Active in Visual Mode) */}
      {mode === 'visual' && (
        <div className="rte-toolbar">
          {/* Undo / Redo */}
          <div className="rte-btn-group">
            <button
              type="button"
              className="rte-tool-btn"
              title="Undo"
              onMouseDown={(e) => { e.preventDefault(); execCmd('undo'); }}
            >
              <MdUndo size={17} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Redo"
              onMouseDown={(e) => { e.preventDefault(); execCmd('redo'); }}
            >
              <MdRedo size={17} />
            </button>
          </div>

          <span className="rte-divider" />

          {/* Block Format */}
          <select
            className="rte-select"
            title="Block Format"
            defaultValue="P"
            onChange={(e) => {
              execCmd('formatBlock', e.target.value);
              e.target.value = 'P';
            }}
          >
            <option value="P">Normal Text</option>
            <option value="H1">Heading 1</option>
            <option value="H2">Heading 2</option>
            <option value="H3">Heading 3</option>
            <option value="H4">Heading 4</option>
            <option value="BLOCKQUOTE">Quote / Mantra Block</option>
            <option value="PRE">Code / Preformatted</option>
          </select>

          {/* Font Family */}
          <select
            className="rte-select"
            title="Font Family"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) execCmd('fontName', e.target.value);
              e.target.value = '';
            }}
          >
            <option value="" disabled>Font</option>
            <option value="inherit">Sans-Serif</option>
            <option value="Georgia, serif">Serif (Vedic)</option>
            <option value="Noto Sans Devanagari, sans-serif">Devanagari</option>
            <option value="monospace">Monospace</option>
          </select>

          {/* Font Size */}
          <select
            className="rte-select"
            title="Font Size"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) execCmd('fontSize', e.target.value);
              e.target.value = '';
            }}
          >
            <option value="" disabled>Size</option>
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Medium</option>
            <option value="5">Large</option>
            <option value="6">XL</option>
            <option value="7">XXL</option>
          </select>

          <span className="rte-divider" />

          {/* Text Decorations */}
          <div className="rte-btn-group">
            <button
              type="button"
              className="rte-tool-btn"
              title="Bold (Ctrl+B)"
              onMouseDown={(e) => { e.preventDefault(); execCmd('bold'); }}
            >
              <MdFormatBold size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Italic (Ctrl+I)"
              onMouseDown={(e) => { e.preventDefault(); execCmd('italic'); }}
            >
              <MdFormatItalic size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Underline (Ctrl+U)"
              onMouseDown={(e) => { e.preventDefault(); execCmd('underline'); }}
            >
              <MdFormatUnderlined size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Strikethrough"
              onMouseDown={(e) => { e.preventDefault(); execCmd('strikeThrough'); }}
            >
              <MdFormatStrikethrough size={18} />
            </button>
          </div>

          <span className="rte-divider" />

          {/* Text Color & Highlight */}
          <div className="rte-btn-group">
            <label className="rte-color-btn" title="Text Color">
              <MdFormatColorText size={17} style={{ color: textColor }} />
              <input
                type="color"
                value={textColor}
                onChange={(e) => {
                  setTextColor(e.target.value);
                  execCmd('foreColor', e.target.value);
                }}
              />
            </label>
            <label className="rte-color-btn" title="Highlight Color">
              <MdFormatColorFill size={17} />
              <input
                type="color"
                value={bgColor}
                onChange={(e) => {
                  setBgColor(e.target.value);
                  execCmd('hiliteColor', e.target.value);
                }}
              />
            </label>
          </div>

          <span className="rte-divider" />

          {/* Alignment */}
          <div className="rte-btn-group">
            <button
              type="button"
              className="rte-tool-btn"
              title="Align Left"
              onMouseDown={(e) => { e.preventDefault(); execCmd('justifyLeft'); }}
            >
              <MdFormatAlignLeft size={17} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Align Center"
              onMouseDown={(e) => { e.preventDefault(); execCmd('justifyCenter'); }}
            >
              <MdFormatAlignCenter size={17} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Align Right"
              onMouseDown={(e) => { e.preventDefault(); execCmd('justifyRight'); }}
            >
              <MdFormatAlignRight size={17} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Justify"
              onMouseDown={(e) => { e.preventDefault(); execCmd('justifyFull'); }}
            >
              <MdFormatAlignJustify size={17} />
            </button>
          </div>

          <span className="rte-divider" />

          {/* Lists & Indentation */}
          <div className="rte-btn-group">
            <button
              type="button"
              className="rte-tool-btn"
              title="Bulleted List"
              onMouseDown={(e) => { e.preventDefault(); execCmd('insertUnorderedList'); }}
            >
              <MdFormatListBulleted size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Numbered List"
              onMouseDown={(e) => { e.preventDefault(); execCmd('insertOrderedList'); }}
            >
              <MdFormatListNumbered size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Outdent"
              onMouseDown={(e) => { e.preventDefault(); execCmd('outdent'); }}
            >
              <MdFormatIndentDecrease size={17} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Indent"
              onMouseDown={(e) => { e.preventDefault(); execCmd('indent'); }}
            >
              <MdFormatIndentIncrease size={17} />
            </button>
          </div>

          <span className="rte-divider" />

          {/* Inserts: Quote, Divider, Link, Image, Table, Clear Formatting */}
          <div className="rte-btn-group">
            <button
              type="button"
              className="rte-tool-btn"
              title="Blockquote"
              onMouseDown={(e) => { e.preventDefault(); execCmd('formatBlock', 'BLOCKQUOTE'); }}
            >
              <MdFormatQuote size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Horizontal Line"
              onMouseDown={(e) => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
            >
              <MdHorizontalRule size={18} />
            </button>
            <button
              type="button"
              className={`rte-tool-btn ${activePopover === 'link' ? 'active' : ''}`}
              title="Insert Link"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setActivePopover(activePopover === 'link' ? null : 'link');
              }}
            >
              <MdInsertLink size={18} />
            </button>
            <button
              type="button"
              className={`rte-tool-btn ${activePopover === 'image' ? 'active' : ''}`}
              title="Insert Image"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setActivePopover(activePopover === 'image' ? null : 'image');
              }}
            >
              <MdImage size={18} />
            </button>
            <button
              type="button"
              className={`rte-tool-btn ${activePopover === 'table' ? 'active' : ''}`}
              title="Insert Table"
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelection();
                setActivePopover(activePopover === 'table' ? null : 'table');
              }}
            >
              <MdTableChart size={18} />
            </button>
            <button
              type="button"
              className="rte-tool-btn"
              title="Clear Formatting"
              onMouseDown={(e) => { e.preventDefault(); execCmd('removeFormat'); }}
            >
              <MdFormatClear size={17} />
            </button>
          </div>
        </div>
      )}

      {/* Insert Popover Tray (Link / Image / Table) */}
      {mode === 'visual' && activePopover && (
        <div className="rte-popover-tray">
          {activePopover === 'link' && (
            <div className="rte-popover-row">
              <input
                type="text"
                placeholder="Link text (optional)"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="rte-popover-input"
              />
              <input
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="rte-popover-input"
              />
              <button type="button" onClick={handleInsertLink} className="rte-popover-apply">
                <MdCheck size={16} /> Insert Link
              </button>
              <button type="button" onClick={() => setActivePopover(null)} className="rte-popover-cancel">
                <MdClose size={16} />
              </button>
            </div>
          )}

          {activePopover === 'image' && (
            <div className="rte-popover-row">
              <input
                type="url"
                placeholder="Paste image URL (https://...)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="rte-popover-input"
              />
              <button type="button" onClick={handleInsertImageUrl} className="rte-popover-apply">
                <MdCheck size={16} /> Insert URL
              </button>
              <label className="rte-popover-upload">
                <MdCloudUpload size={16} /> Upload File
                <input type="file" accept="image/*" onChange={handleUploadImageFile} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => setActivePopover(null)} className="rte-popover-cancel">
                <MdClose size={16} />
              </button>
            </div>
          )}

          {activePopover === 'table' && (
            <div className="rte-popover-row">
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rows:</label>
              <input
                type="number"
                min="1"
                max="12"
                value={tableRows}
                onChange={(e) => setTableRows(e.target.value)}
                className="rte-popover-input"
                style={{ maxWidth: '70px' }}
              />
              <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cols:</label>
              <input
                type="number"
                min="1"
                max="8"
                value={tableCols}
                onChange={(e) => setTableCols(e.target.value)}
                className="rte-popover-input"
                style={{ maxWidth: '70px' }}
              />
              <button type="button" onClick={handleInsertTable} className="rte-popover-apply">
                <MdCheck size={16} /> Insert Table
              </button>
              <button type="button" onClick={() => setActivePopover(null)} className="rte-popover-cancel">
                <MdClose size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Editor Area */}
      {mode === 'visual' && (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={() => {
            saveSelection();
            emitChange();
          }}
          onKeyUp={saveSelection}
          onMouseUp={saveSelection}
          data-placeholder={placeholder}
          className="rte-editable-area"
          style={{ minHeight }}
        />
      )}

      {mode === 'html' && (
        <textarea
          value={value || ''}
          onChange={(e) => {
            lastEmittedValueRef.current = e.target.value;
            onChange?.(e.target.value);
          }}
          placeholder="<p>Write or paste any HTML, CSS, tables, Sanskrit verses, etc...</p>"
          className="rte-html-textarea"
          style={{ minHeight }}
        />
      )}

      {mode === 'preview' && (
        <div
          className="rte-preview-area"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{
            __html: value || '<p style="color:#9CA3AF;font-style:italic;">Nothing to preview yet.</p>',
          }}
        />
      )}

      {/* Bottom Stats Bar */}
      <div className="rte-footer-bar">
        <span>
          Format: <strong>{mode === 'visual' ? 'Rich Text (WYSIWYG)' : mode === 'html' ? 'Raw HTML Source' : 'Rendered Preview'}</strong>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>{wordCount} words · {charCount} chars</span>
          {value && (
            <button
              type="button"
              onClick={() => {
                if (editorRef.current) editorRef.current.innerHTML = '';
                lastEmittedValueRef.current = '';
                onChange?.('');
              }}
              className="rte-clear-all-btn"
            >
              Clear Content
            </button>
          )}
        </div>
      </div>

      <style>{`
        .rte-container {
          border: 1px solid var(--border-color, #E5E7EB);
          border-radius: 10px;
          background: #FFFFFF;
          overflow: hidden;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .rte-container:focus-within {
          border-color: var(--primary-color, #82001E);
          box-shadow: 0 0 0 3px rgba(130, 0, 30, 0.08);
        }
        .rte-top-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.4rem;
          padding: 0.35rem 0.6rem;
          background: #FDF9F1;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
        }
        .rte-mode-tabs {
          display: inline-flex;
          gap: 0.25rem;
          background: rgba(130,0,30,0.06);
          padding: 3px;
          border-radius: 7px;
        }
        .rte-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.6rem;
          font-size: 0.76rem;
          font-weight: 600;
          border: none;
          border-radius: 5px;
          background: transparent;
          color: var(--text-secondary, #6B7280);
          cursor: pointer;
          transition: all 0.15s;
        }
        .rte-mode-btn.active {
          background: #FFFFFF;
          color: var(--primary-color, #82001E);
          box-shadow: 0 1px 2px rgba(0,0,0,0.08);
        }
        .rte-symbols-bar {
          display: flex;
          align-items: center;
          gap: 0.2rem;
          flex-wrap: wrap;
        }
        .rte-symbols-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary, #6B7280);
          margin-right: 0.2rem;
        }
        .rte-symbol-btn {
          border: 1px solid #E5E7EB;
          background: #FFFFFF;
          color: var(--primary-color, #82001E);
          border-radius: 4px;
          padding: 0.12rem 0.4rem;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rte-symbol-btn:hover {
          background: var(--primary-color, #82001E);
          color: #FFFFFF;
          border-color: var(--primary-color, #82001E);
        }
        .rte-toolbar {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.15rem;
          padding: 0.35rem 0.5rem;
          background: #F9FAFB;
          border-bottom: 1px solid var(--border-color, #E5E7EB);
        }
        .rte-btn-group {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }
        .rte-tool-btn {
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 5px;
          background: transparent;
          color: #374151;
          cursor: pointer;
          transition: all 0.15s;
        }
        .rte-tool-btn:hover, .rte-tool-btn.active {
          background: #FFFFFF;
          border-color: #D1D5DB;
          color: var(--primary-color, #82001E);
        }
        .rte-color-btn {
          width: 26px;
          height: 26px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 5px;
          cursor: pointer;
          position: relative;
        }
        .rte-color-btn:hover {
          background: #FFFFFF;
          border: 1px solid #D1D5DB;
        }
        .rte-color-btn input[type="color"] {
          position: absolute;
          inset: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        .rte-select {
          height: 28px;
          padding: 0 0.4rem;
          border: 1px solid #D1D5DB;
          border-radius: 5px;
          background: #FFFFFF;
          font-size: 0.76rem;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
        }
        .rte-divider {
          width: 1px;
          height: 20px;
          background: #E5E7EB;
          margin: 0 0.2rem;
        }
        .rte-popover-tray {
          background: #FFFBEB;
          border-bottom: 1px solid #FDE68A;
          padding: 0.5rem 0.75rem;
        }
        .rte-popover-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .rte-popover-input {
          flex: 1;
          min-width: 140px;
          padding: 0.35rem 0.6rem;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 0.82rem;
          background: #FFFFFF;
        }
        .rte-popover-apply, .rte-popover-upload {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.35rem 0.7rem;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          border: none;
          background: var(--primary-color, #82001E);
          color: #FFFFFF;
          cursor: pointer;
        }
        .rte-popover-upload {
          background: #374151;
        }
        .rte-popover-cancel {
          border: none;
          background: transparent;
          color: #6B7280;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .rte-editable-area {
          padding: 0.7rem;
          outline: none;
          overflow-y: auto;
          max-height: 360px;
          font-size: 0.88rem;
          line-height: 1.55;
          color: var(--text-primary, #1F2937);
          background: #FFFFFF;
        }
        .rte-editable-area:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        .rte-editable-area blockquote, .rte-preview-area blockquote {
          border-left: 4px solid var(--primary-color, #82001E);
          background: #FDF9F1;
          padding: 0.5rem 0.85rem;
          margin: 0.5rem 0;
          border-radius: 0 8px 8px 0;
          font-style: italic;
        }
        .rte-editable-area ul, .rte-editable-area ol,
        .rte-preview-area ul, .rte-preview-area ol {
          padding-left: 1.35rem;
          margin: 0.4rem 0;
        }
        .rte-editable-area h1, .rte-editable-area h2, .rte-editable-area h3,
        .rte-preview-area h1, .rte-preview-area h2, .rte-preview-area h3 {
          color: var(--primary-color, #82001E);
          margin: 0.45rem 0 0.25rem 0;
        }
        .rte-html-textarea {
          width: 100%;
          padding: 0.7rem;
          border: none;
          outline: none;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.82rem;
          line-height: 1.5;
          background: #1E293B;
          color: #E2E8F0;
          resize: vertical;
        }
        .rte-preview-area {
          padding: 0.75rem;
          overflow-y: auto;
          max-height: 360px;
          font-size: 0.88rem;
          line-height: 1.55;
          background: #FFFFFF;
        }
        .rte-footer-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.3rem 0.65rem;
          background: #F9FAFB;
          border-top: 1px solid var(--border-color, #E5E7EB);
          font-size: 0.72rem;
          color: var(--text-secondary, #6B7280);
        }
        .rte-clear-all-btn {
          background: none;
          border: none;
          color: #DC2626;
          font-size: 0.74rem;
          font-weight: 600;
          cursor: pointer;
        }
        .rte-clear-all-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
