
/// <reference types="vite/client" />
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

/**
 * Gets the full URL for an uploaded file
 * @param path The relative path from the backend (e.g. /uploads/file.png)
 * @returns Full URL
 */
export const getFileUrl = (path: string | undefined | null) => {
 if (!path) return '';
 if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
 
 // If it's already an API path
 if (path.startsWith('/api/v1/upload/')) {
 return `${API_BASE_URL}${path}`;
 }
 
 // If the path already has /uploads, we just prepend the base
 if (path.startsWith('/uploads/')) {
 return `${API_BASE_URL}${path}`;
 }
 
 // Fallback for cases where it's just the filename
 return `${UPLOADS_URL}/${path}`;
};
