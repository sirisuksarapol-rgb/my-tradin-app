import axios from 'axios';

// ========================================================
// 📌 CONFIGURATION & CONSTANTS
// ========================================================
const getBaseUrl = () => {
  const { hostname, protocol } = window.location;

  // หากรันผ่าน VS Code DevTunnels
  if (hostname.includes('devtunnels.ms')) {
    // แปลง -8080 ในชื่อโดเมนให้กลายเป็น -5000 อัตโนมัติ และบังคับใช้ https://
    const backendHostname = hostname.replace(/-\d+\./, '-5000.');
    return `https://${backendHostname}`;
  }

  // หากรันแบบ Localhost หรือ IP ในวง Wi-Fi
  return `${protocol}//${hostname}:5000`;
};

const BASE_URL = getBaseUrl();
export const IMAGE_BASE_URL = BASE_URL;
export const API_BASE_URL = `${BASE_URL}/api`;
/**
 * Helper ฟังก์ชันสำหรับดึง Member ID จาก localStorage (ลดการเขียนโค้ดซ้ำ)
 */
const getStoredMemberId = () => {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) return "";
  
  const user = JSON.parse(savedUser);
  // ดักจับชื่อ Key ทุกรูปแบบเผื่อมีการเซฟต่างกัน
  return user.id || user.user_id || user.UserID || user.MemberID || "";
};

// ========================================================
// 🔐 1. AUTHENTICATION API
// ========================================================
export const login = (data) => axios.post(`${API_BASE_URL}/login`, data);
export const register = (data) => axios.post(`${API_BASE_URL}/register`, data);

// ========================================================
// 📦 2. CATEGORIES & ITEMS API (จัดการหมวดหมู่และสิ่งของ)
// ========================================================
// หมวดหมู่ (Categories)
export const getCategories = () => axios.get(`${API_BASE_URL}/categories`);
export const createCategory = (data) => axios.post(`${API_BASE_URL}/categories`, data);
export const updateCategory = (id, data) => axios.put(`${API_BASE_URL}/categories/${id}`, data);
export const deleteCategory = (id) => axios.delete(`${API_BASE_URL}/categories/${id}`);

// สิ่งของ (Items)
export const getItems = () => axios.get(`${API_BASE_URL}/items`);
export const getItemById = (id) => axios.get(`${API_BASE_URL}/items/${id}`);
export const createItem = (formData) => axios.post(`${API_BASE_URL}/items`, formData);
export const updateItem = (id, formData) => axios.put(`${API_BASE_URL}/items/${id}`, formData);
export const deleteItem = (id) => axios.delete(`${API_BASE_URL}/items/${id}`);

// ========================================================
// 🔄 3. EXCHANGES API (ระบบจับคู่/แลกเปลี่ยน)
// ========================================================
export const getExchanges = async () => {
  try {
    const memberId = getStoredMemberId();
    const response = await axios.get(`${API_BASE_URL}/exchanges?member_id=${memberId}`);
    return response.data; 
  } catch (error) {
    console.error("Error fetching exchanges API:", error);
    throw error;
  }
};

export const createExchangeRequest = async (payload) => {
  try {
    const memberId = getStoredMemberId();
    
    // จัดรูปแบบข้อมูลให้อยู่ในโครงสร้างที่ Backend (Python) รอรับเสมอ
    const requestData = {
      member_id: payload.sender_id || payload.member_id || memberId,
      target_member_id: payload.receiver_id || payload.target_member_id,
      my_item_id: payload.my_item_id,       
      their_item_id: payload.their_item_id, 
      location: payload.location || 'นัดเจอตามตกลง',
      phone_number: payload.phone_number || ''
    };

    const response = await axios.post(`${API_BASE_URL}/exchanges`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error creating exchange request:", error);
    throw error.response?.data || error;
  }
};

export const getAIRecommendations = (itemId) => axios.get(`${API_BASE_URL}/matches/${itemId}`);

/**
 * ขอรับรหัส OTP เพื่อเข้าดูเบอร์โทรศัพท์คู่แลกเปลี่ยน
 */
export const requestExchangeCode = async (exchangeId) => {
  try {
    const memberId = getStoredMemberId(); 
    const response = await axios.post(`${API_BASE_URL}/exchanges/${exchangeId}/request-code`, {
      user_id: memberId
    });
    return response.data;
  } catch (error) {
    console.error("Error requesting exchange OTP:", error);
    throw error.response?.data || error;
  }
};

/**
 * ยืนยันรหัส OTP เพื่อเปิดดูเบอร์โทรศัพท์
 */
export const verifyExchangeCode = async (exchangeId, code) => {
  try {
    const memberId = getStoredMemberId();
    const response = await axios.post(`${API_BASE_URL}/exchanges/${exchangeId}/verify-code`, {
      user_id: memberId,
      code: code
    });
    return response.data;
  } catch (error) {
    console.error("Error verifying exchange OTP:", error);
    throw error.response?.data || error;
  }
};

export const cancelExchange = async (exchangeId, reason) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/exchanges/${exchangeId}/cancel`, {
      reason: reason
    });
    return response.data;
  } catch (error) { 
    console.error("Error cancelling exchange:", error);
    if (axios.isAxiosError(error)) {
      throw error.response?.data || error;
    }
    throw error;
  }
};

export const completeExchange = async (exchangeId, reviewData) => {
  try {
    const memberId = getStoredMemberId(); 
    
    const response = await fetch(`${API_BASE_URL}/exchanges/${exchangeId}/complete`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...reviewData, user_id: memberId }), 
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error calling complete API:", error);
    return { success: false, message: "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้" };
  }
};

// ========================================================
// 🔔 4. NOTIFICATIONS API (ระบบแจ้งเตือน)
// ========================================================
export const getNotifications = async () => {
  try {
    const memberId = getStoredMemberId();
    const response = await axios.get(`${API_BASE_URL}/notifications?member_id=${memberId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications API:", error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const memberId = getStoredMemberId();
    const response = await axios.get(`${API_BASE_URL}/notifications/unread-count?member_id=${memberId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unread notification count API:", error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};

// ========================================================
// 👤 5. USER PROFILE & STATS API (ข้อมูลสมาชิก)
// ========================================================
export const getUserStats = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    return { success: false, data: null };
  }
};

export const updateUserProfile = async (memberId, formData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/${memberId}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

// ========================================================
// ⚠️ 6. REPORTS API (ระบบรายงานปัญหา)
// ========================================================
export const createReport = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reports`, data);
    return response.data; 
  } catch (error) {
    console.error("Error creating report:", error);
    throw error.response?.data || error;
  }
};

export const getReports = async () => {
  const response = await axios.get(`${API_BASE_URL}/reports`);
  return response.data;
};

export const getReportById = async (problemId) => {
  const response = await axios.get(`${API_BASE_URL}/reports/${problemId}`);
  return response.data;
};

// ========================================================
// 👑 7. ADMIN API (ระบบหลังบ้านผู้ดูแล)
// ========================================================
export const getAdminDashboard = () => axios.get(`${API_BASE_URL}/admin/dashboard`);
export const getAdminUsers = () => axios.get(`${API_BASE_URL}/admin/users`);
export const getAdminItems = () => axios.get(`${API_BASE_URL}/admin/items`);
export const getAdminReports = () => axios.get(`${API_BASE_URL}/admin/reports`);

export const suspendMember = (memberId, payload) => axios.put(`${API_BASE_URL}/admin/users/${memberId}/suspend`, payload);
export const unsuspendMember = (memberId) => axios.put(`${API_BASE_URL}/admin/users/${memberId}/unsuspend`);
export const adminDeleteItem = (itemId) => axios.delete(`${API_BASE_URL}/admin/items/${itemId}`);
export const resolveReport = (problemId) => axios.put(`${API_BASE_URL}/admin/reports/${problemId}`);


export default API_BASE_URL;