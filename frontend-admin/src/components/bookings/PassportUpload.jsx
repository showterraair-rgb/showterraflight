import { useRef, useState } from 'react';

export default function PassportUpload({ record, onUpload, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      await onUpload(file);
      if (inputRef.current) inputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        {record?.passportUrl ? (
          <a
            href={record.passportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            {record.passportFileName || 'View passport'}
          </a>
        ) : (
          <span className="text-sm text-slate-500">No passport uploaded</span>
        )}
        {!disabled && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary text-sm"
            >
              {uploading ? 'Uploading…' : record?.passportUrl ? 'Replace passport' : 'Upload passport'}
            </button>
          </>
        )}
      </div>
      {record?.passportUploadedAt && (
        <p className="text-xs text-slate-400">
          Uploaded {new Date(record.passportUploadedAt).toLocaleString()}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
