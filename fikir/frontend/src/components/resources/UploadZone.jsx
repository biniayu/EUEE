import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

function uploadWithProgress({ url, file, subjectId, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((100 * e.loaded) / e.total));
      else onProgress(null);
    };

    xhr.onload = () => {
      let data = {};
      try {
        data = JSON.parse(xhr.responseText || '{}');
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.success) resolve(data);
      else reject(new Error(data.error || `Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error('Network error during upload.'));

    const fd = new FormData();
    fd.append('file', file);
    if (subjectId != null && subjectId !== '') fd.append('subjectId', String(subjectId));
    xhr.send(fd);
  });
}

export default function UploadZone({ subjectId, onUploaded, disabled }) {
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setError(null);
      setMessage(null);
      setProgress(0);
      setBusy(true);
      try {
        await uploadWithProgress({
          url: '/api/resources/upload',
          file,
          subjectId,
          onProgress: (p) => setProgress((prev) => (p == null ? (prev ?? 0) : p)),
        });
        setMessage('Upload complete — your file is saved.');
        setProgress(100);
        onUploaded?.();
      } catch (e) {
        setError(e.message || 'Upload failed.');
        setProgress(null);
      } finally {
        setBusy(false);
      }
    },
    [subjectId, onUploaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    accept: ACCEPT,
    disabled: busy || disabled,
    onDropRejected: (rej) => {
      const r = rej[0];
      const msg =
        r?.errors?.[0]?.code === 'file-too-large'
          ? 'File is larger than 10MB.'
          : r?.errors?.[0]?.message || 'File type not supported.';
      setError(msg);
    },
  });

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-sm sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-deep-blue">Upload</h3>
      <p className="mt-1 text-xs text-neutral-600">PDF, images (JPEG/PNG/WebP/GIF), or Word (.doc/.docx). Max 10MB.</p>

      <div
        {...getRootProps()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition ${
          isDragActive
            ? 'border-brand-emerald bg-brand-emerald/5'
            : 'border-neutral-300 bg-neutral-50/80 hover:border-brand-emerald/50'
        } ${busy || disabled ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input {...getInputProps()} />
        <p className="text-sm font-semibold text-deep-blue">
          {isDragActive ? 'Drop file here…' : 'Drag & drop a file, or click to browse'}
        </p>
        <p className="mt-2 text-xs text-neutral-500">Uses Cloudinary — configure server keys to enable uploads.</p>
      </div>

      {busy && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
            {progress == null ? (
              <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-emerald" />
            ) : (
              <div
                className="h-full rounded-full bg-brand-emerald transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
          <p className="mt-1 text-center text-xs font-medium text-neutral-600">
            {progress == null ? 'Uploading…' : `${progress}%`}
          </p>
        </div>
      )}

      {message && <p className="mt-3 text-sm font-medium text-brand-emerald">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
