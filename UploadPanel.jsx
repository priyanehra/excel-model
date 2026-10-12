import { useRef, useState } from 'react';

export default function UploadPanel({ onUpload, loading, meta, status }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (file) => {
    if (file && !loading) onUpload(file);
  };

  return (
    <section className="card upload" aria-label="Upload transactions">
      <div
        className={`dropzone${dragging ? ' dragging' : ''}${loading ? ' busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
        onClick={() => !loading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          hidden
          onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }}
        />
        {loading ? (
          <div className="loading"><span className="spinner" /> Importing and analysing…</div>
        ) : (
          <>
            <div className="drop-title">Drag &amp; drop an Excel file here, or <span className="link">browse</span></div>
            <div className="drop-sub">.xlsx only · columns: Date, Description, Category, Amount · max 5 MB</div>
          </>
        )}
      </div>

      {meta?.fileName && (
        <div className="file-info">
          <span><strong>File:</strong> {meta.fileName}</span>
          <span><strong>Rows imported:</strong> {meta.rowCount.toLocaleString('en-IN')}</span>
        </div>
      )}

      {status && (
        <div className={`alert ${status.type}`} role="alert">
          <div>{status.text}</div>
          {status.warnings?.map((w) => <div key={w} className="alert-sub">⚠ {w}</div>)}
        </div>
      )}
    </section>
  );
}
