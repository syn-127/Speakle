export interface Media {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText: string | null;
  caption: string | null;
  uploadedBy: string;
  createdAt: number;
}
