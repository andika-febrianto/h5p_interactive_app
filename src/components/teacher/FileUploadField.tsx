import { useRef, useState } from 'react';
import { uploadFile, ApiError } from '../../lib/api';

export function FileUploadField({
  label,
  accept,
  value,
  onChange,
  urlPlaceholder,
}: {
  label: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  urlPlaceholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const result = await uploadFile(file);
      onChange(result.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mengunggah file.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-field">
      <span className="upload-field-label">{label}</span>
      <div className="upload-field-row">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={urlPlaceholder ?? 'https://... atau unggah file'}
          className="upload-field-url"
        />
        <button
          type="button"
          className="btn-secondary btn-small"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Mengunggah...' : '⬆ Unggah'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelected}
          style={{ display: 'none' }}
        />
      </div>
      {error && <p className="auth-error" style={{ marginTop: 6 }}>{error}</p>}
      {value && !error && (
        <p className="upload-field-preview">
          {/^https?:\/\/.*\.(png|jpe?g|webp|gif)$/i.test(value) ? (
            <img src={value} alt="" className="upload-field-thumb" />
          ) : (
            <span className="upload-field-filename">{value.split('/').pop()}</span>
          )}
        </p>
      )}
    </div>
  );
}
