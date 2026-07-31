import { useState, useCallback } from 'react';
import type { UploadStatus } from '@/types';

interface UploadResult {
  text: string;
  pages: number;
  characters: number;
}

interface UseResumeUploadReturn {
  status: UploadStatus;
  fileName: string | null;
  fileSize: number | null;
  lastModified: number | null;
  extractedText: string | null;
  pageCount: number | null;
  fileData: string | null;
  error: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

export function useResumeUpload(): UseResumeUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [lastModified, setLastModified] = useState<number | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setFileName(null);
    setFileSize(null);
    setLastModified(null);
    setExtractedText(null);
    setPageCount(null);
    setFileData(null);
    setError(null);
  }, []);

  const upload = useCallback(async (file: File) => {
    try {
      setError(null);
      setFileName(file.name);
      setFileSize(file.size);
      setLastModified(file.lastModified);
      setStatus('uploading');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setFileData(e.target.result);
        }
      };
      reader.readAsDataURL(file);

      // Simulate slight delay for UX
      await new Promise((r) => setTimeout(r, 400));

      setStatus('extracting');

      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to extract text');
      }

      const result = data as UploadResult;
      setExtractedText(result.text);
      setPageCount(result.pages);
      setStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setStatus('error');
    }
  }, []);

  return {
    status,
    fileName,
    fileSize,
    lastModified,
    extractedText,
    pageCount,
    fileData,
    error,
    upload,
    reset,
  };
}
