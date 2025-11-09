import axios from 'axios';

const GETCIRCLO_API_URL = 'https://api.getcirclo.com';
const GETCIRCLO_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwZmRjNjkxLTIzMDAtNDM4Mi04ODI4LWE1NzI0YjQ5OTNiYiIsImVtYWlsIjoiZGV2QHNlbnRpLmdsb2JhbCIsImlzX2d1ZXN0IjpmYWxzZSwiaWF0IjoxNzYyNTcyMDYzLCJleHAiOjQ5MTgzMzIwNjN9.deShmmIRMKrRS1avZtNwY0u01_QwEcdBeDd_DJ2Qfxw';

interface CreatePostParams {
  niche: string;
  mediaUrl: string;
  caption: string;
  keywords?: string[];
}

interface GetCircloResponse {
  success: boolean;
  post: {
    id: string;
    generatedProfileId: string;
    postType: string;
    caption: string;
    keywords: string[];
    likeCount: number;
    commentCount: number;
    createdAt: string;
  };
}

export async function publishToGetCirclo(params: CreatePostParams): Promise<GetCircloResponse> {
  try {
    const response = await axios.post(
      `${GETCIRCLO_API_URL}/api/user-preferences/recommend/create-post`,
      {
        profile: 'general',
        niche: params.niche,
        media_type: 'image',
        media_source: params.mediaUrl,
        caption: params.caption,
        keywords: params.keywords || [],
      },
      {
        headers: {
          'Authorization': `Bearer ${GETCIRCLO_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('[GetCirclo] Failed to publish post:', error.response?.data || error.message);
    throw new Error(`Failed to publish to GetCirclo: ${error.response?.data?.message || error.message}`);
  }
}

export async function getUserPreferences(page: number = 1, limit: number = 10) {
  try {
    const response = await axios.get(
      `${GETCIRCLO_API_URL}/api/user-preferences`,
      {
        params: { page, limit },
        headers: {
          'Authorization': `Bearer ${GETCIRCLO_TOKEN}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('[GetCirclo] Failed to get user preferences:', error.response?.data || error.message);
    throw new Error(`Failed to get user preferences: ${error.response?.data?.message || error.message}`);
  }
}
