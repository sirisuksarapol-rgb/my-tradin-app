
import axios from 'axios';

// ==================================================
// 1. Types
// ==================================================

interface StoredUser {
  id?: string | number;
  user_id?: string | number;
  UserID?: string | number;
  MemberID?: string | number;
}

interface ApiResult {
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

interface ExchangeRequestPayload {
  sender_id?: string | number;
  member_id?: string | number;
  receiver_id?: string | number;
  target_member_id?: string | number;
  my_item_id?: string | number;
  their_item_id?: string | number;
  location?: string;
  match_score?: number;
  phone_number?: string;
  exchange_type?: string;
}

type ApiPayload = Record<string, unknown>;

// ==================================================
// 2. Configuration
// ==================================================

/**
 * กำหนด URL ของ Backend ตามสภาพแวดล้อมที่ใช้งาน
 */
const getBaseUrl = (): string => {
  const { hostname, protocol } = window.location;

  if (hostname.includes('devtunnels.ms')) {
    const backendHostname = hostname.replace(/-\d+\./, '-5000.');
    return `https://${backendHostname}`;
  }

  return `${protocol}//${hostname}:5000`;
};

const BASE_URL = getBaseUrl();

export const IMAGE_BASE_URL = BASE_URL;
export const API_BASE_URL = `${BASE_URL}/api`;

/**
 * ดึง Member ID จาก sessionStorage
 */
const getStoredMemberId = (): string | number => {
  const savedUser = sessionStorage.getItem('user');

  if (!savedUser) {
    return '';
  }

  const user = JSON.parse(savedUser) as StoredUser;

  return (
    user.id ||
    user.user_id ||
    user.UserID ||
    user.MemberID ||
    ''
  );
};

/**
 * ดึงข้อมูลข้อผิดพลาดจาก Axios หากมี
 */
const getErrorResponseData = (error: unknown): unknown => {
  if (axios.isAxiosError(error)) {
    return error.response?.data || error;
  }

  return error;
};


// ==================================================
// 3. Authentication API
// ==================================================

/**
 * เข้าสู่ระบบ
 */
export const login = (data: ApiPayload) =>
  axios.post(`${API_BASE_URL}/login`, data);

/**
 * สมัครสมาชิก
 */
export const register = (data: ApiPayload) =>
  axios.post(`${API_BASE_URL}/register`, data);


// ==================================================
// 4. Categories API
// ==================================================

/**
 * ดึงหมวดหมู่ทั้งหมด
 */
export const getCategories = () =>
  axios.get(`${API_BASE_URL}/categories`);

/**
 * เพิ่มหมวดหมู่
 */
export const createCategory = (data: ApiPayload) =>
  axios.post(`${API_BASE_URL}/categories`, data);

/**
 * แก้ไขหมวดหมู่
 */
export const updateCategory = (
  id: string | number,
  data: ApiPayload,
) => axios.put(`${API_BASE_URL}/categories/${id}`, data);

/**
 * ลบหมวดหมู่
 */
export const deleteCategory = (id: string | number) =>
  axios.delete(`${API_BASE_URL}/categories/${id}`);


// ==================================================
// 5. Items API
// ==================================================

/**
 * ดึงโพสต์สิ่งของทั้งหมด
 */
export const getItems = () =>
  axios.get(`${API_BASE_URL}/items`);

/**
 * ดึงรายละเอียดสิ่งของตาม ID
 */
export const getItemById = (id: string | number) =>
  axios.get(`${API_BASE_URL}/items/${id}`);

/**
 * สร้างโพสต์สิ่งของ
 */
export const createItem = (formData: FormData) =>
  axios.post(`${API_BASE_URL}/items`, formData);

/**
 * แก้ไขโพสต์สิ่งของ
 */
export const updateItem = (
  id: string | number,
  formData: FormData,
) => axios.put(`${API_BASE_URL}/items/${id}`, formData);

/**
 * ลบโพสต์สิ่งของ
 */
export const deleteItem = (id: string | number) =>
  axios.delete(`${API_BASE_URL}/items/${id}`);


// ==================================================
// 6. Exchanges API
// ==================================================

/**
 * ดึงรายการแลกเปลี่ยนของสมาชิกปัจจุบัน
 */
export const getExchanges = async () => {
  try {
    const memberId = getStoredMemberId();

    const response = await axios.get(
      `${API_BASE_URL}/exchanges?member_id=${memberId}`,
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching exchanges API:', error);
    throw error;
  }
};

/**
 * สร้างคำขอแลกเปลี่ยน
 */
export const createExchangeRequest = async (
  payload: ExchangeRequestPayload,
) => {
  try {
    const memberId = getStoredMemberId();

    const requestData = {
      member_id: payload.sender_id || payload.member_id || memberId,
      target_member_id:
        payload.receiver_id || payload.target_member_id,
      my_item_id: payload.my_item_id,
      their_item_id: payload.their_item_id,
      location: payload.location || 'นัดเจอตามตกลง',
      match_score: payload.match_score || 0,
      phone_number: payload.phone_number || '',
      exchange_type: payload.exchange_type,
    };

    const response = await axios.post(
      `${API_BASE_URL}/exchanges`,
      requestData,
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error creating exchange request:', error);
    throw getErrorResponseData(error);
  }
};

/**
 * ดึงรายการแนะนำจาก AI Matching
 */
export const getAIRecommendations = (itemId: string | number) =>
  axios.get(`${API_BASE_URL}/matches/${itemId}`);

/**
 * ขอรหัส OTP สำหรับดูเบอร์โทรศัพท์คู่แลกเปลี่ยน
 */
export const requestExchangeCode = async (
  exchangeId: string | number,
) => {
  try {
    const memberId = getStoredMemberId();

    const response = await axios.post(
      `${API_BASE_URL}/exchanges/${exchangeId}/request-code`,
      {
        user_id: memberId,
      },
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error requesting exchange OTP:', error);
    throw getErrorResponseData(error);
  }
};

/**
 * ยืนยันรหัส OTP สำหรับดูเบอร์โทรศัพท์
 */
export const verifyExchangeCode = async (
  exchangeId: string | number,
  code: string,
) => {
  try {
    const memberId = getStoredMemberId();

    const response = await axios.post(
      `${API_BASE_URL}/exchanges/${exchangeId}/verify-code`,
      {
        user_id: memberId,
        code,
      },
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error verifying exchange OTP:', error);
    throw getErrorResponseData(error);
  }
};

/**
 * ยกเลิกรายการแลกเปลี่ยน
 */
export const cancelExchange = async (
  exchangeId: string | number,
  reason: string,
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exchanges/${exchangeId}/cancel`,
      { reason },
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error cancelling exchange:', error);
    throw getErrorResponseData(error);
  }
};

/**
 * ยืนยันการแลกเปลี่ยนเสร็จสิ้นและบันทึกรีวิว
 */
export const completeExchange = async (
  exchangeId: string | number,
  reviewData: ApiPayload,
): Promise<ApiResult> => {
  try {
    const memberId = getStoredMemberId();

    const response = await fetch(
      `${API_BASE_URL}/exchanges/${exchangeId}/complete`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reviewData,
          user_id: memberId,
        }),
      },
    );

    return (await response.json()) as ApiResult;
  } catch (error: unknown) {
    console.error('Error calling complete API:', error);

    return {
      success: false,
      message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้',
    };
  }
};


// ==================================================
// 7. Notifications API
// ==================================================

/**
 * ดึงการแจ้งเตือนทั้งหมด
 */
export const getNotifications = async () => {
  try {
    const memberId = getStoredMemberId();

    const response = await axios.get(
      `${API_BASE_URL}/notifications?member_id=${memberId}`,
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching notifications API:', error);
    throw error;
  }
};

/**
 * ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
 */
export const getUnreadNotificationCount = async () => {
  try {
    const memberId = getStoredMemberId();

    const response = await axios.get(
      `${API_BASE_URL}/notifications/unread-count?member_id=${memberId}`,
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching unread notification count API:', error);
    throw error;
  }
};

/**
 * ทำเครื่องหมายแจ้งเตือนว่าอ่านแล้ว
 */
export const markNotificationAsRead = async (
  notificationId: string | number,
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
    );

    return response.data;
  } catch (error: unknown) {
    console.error(
      `Error marking notification ${notificationId} as read:`,
      error,
    );

    throw error;
  }
};


// ==================================================
// 8. User Profile & Stats API
// ==================================================

/**
 * ดึงสถิติและรีวิวของสมาชิก
 */
export const getUserStats = async (
  userId: string | number,
): Promise<ApiResult> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/stats`,
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error fetching user stats:', error);

    return {
      success: false,
      data: null,
    };
  }
};

/**
 * อัปเดตโปรไฟล์และรูปภาพสมาชิก
 */
export const updateUserProfile = async (
  memberId: string | number,
  formData: FormData,
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/${memberId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};


// ==================================================
// 9. Reports API
// ==================================================

/**
 * ส่งรายงานปัญหาหรือข้อเสนอแนะ
 */
export const createReport = async (data: ApiPayload) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/reports`,
      data,
    );

    return response.data;
  } catch (error: unknown) {
    console.error('Error creating report:', error);
    throw getErrorResponseData(error);
  }
};

/**
 * ดึงรายการรายงานปัญหาทั้งหมด
 */
export const getReports = async () => {
  const response = await axios.get(`${API_BASE_URL}/reports`);
  return response.data;
};

/**
 * ดึงรายละเอียดรายงานปัญหาตาม ID
 */
export const getReportById = async (
  problemId: string | number,
) => {
  const response = await axios.get(
    `${API_BASE_URL}/reports/${problemId}`,
  );

  return response.data;
};


// ==================================================
// 10. Admin API
// ==================================================

/**
 * ดึงสถิติภาพรวมสำหรับ Dashboard ผู้ดูแลระบบ
 */
export const getAdminDashboard = () =>
  axios.get(`${API_BASE_URL}/admin/dashboard`);

/**
 * ดึงรายชื่อสมาชิกทั้งหมด
 */
export const getAdminUsers = () =>
  axios.get(`${API_BASE_URL}/admin/users`);

/**
 * ดึงโพสต์สิ่งของทั้งหมดสำหรับผู้ดูแลระบบ
 */
export const getAdminItems = () =>
  axios.get(`${API_BASE_URL}/admin/items`);

/**
 * ดึงรายการรายงานปัญหาสำหรับผู้ดูแลระบบ
 */
export const getAdminReports = () =>
  axios.get(`${API_BASE_URL}/admin/reports`);

/**
 * ระงับสิทธิ์สมาชิก
 */
export const suspendMember = (
  memberId: string | number,
  payload: ApiPayload,
) =>
  axios.put(
    `${API_BASE_URL}/admin/users/${memberId}/suspend`,
    payload,
  );

/**
 * ยกเลิกการระงับสิทธิ์สมาชิก
 */
export const unsuspendMember = (
  memberId: string | number,
) =>
  axios.put(
    `${API_BASE_URL}/admin/users/${memberId}/unsuspend`,
  );

/**
 * ลบโพสต์สิ่งของในฐานะผู้ดูแลระบบ
 */
export const adminDeleteItem = (
  itemId: string | number,
  reason: string,
) =>
  axios.delete(`${API_BASE_URL}/admin/items/${itemId}`, {
    data: { reason },
  });

/**
 * ปิดรายงานปัญหาและส่งข้อความแจ้งผู้รายงาน
 */
export const resolveReport = (
  problemId: string | number,
  resolutionMessage: string = '',
) =>
  axios.put(
    `${API_BASE_URL}/admin/reports/${problemId}`,
    {
      resolution_message: resolutionMessage,
    },
  );

export default API_BASE_URL;
