import { apiClient } from '@/api/client';

export interface UploadImageResponse {
  image_path: string;
  image_url: string;
}

export const itemImageApi = {
  upload: async (itemId: number, file: File): Promise<UploadImageResponse> => {
    const form = new FormData();
    form.append('file', file);
    const { data } = await apiClient.post<UploadImageResponse>(
      `/items/${itemId}/image`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
};
