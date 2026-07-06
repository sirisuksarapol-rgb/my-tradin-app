import axios from 'axios';

// ========================================================
// 📌 CONFIGURATION & CONSTANTS
// ========================================================
const BASE_URL = `http://${window.location.hostname}:5000`;
export const IMAGE_BASE_URL = BASE_URL;
export const API_BASE_URL = `${BASE_URL}/api`;

/**
 * Helper ฟังก์ชันสำหรับดึง Member ID จาก localStorage (ลดการเขียนโค้ดซ้ำ)
 */
const getStoredMemberId = () => {
  const savedUser = localStorage.getItem("user");
  if (!savedUser) return "";
  const user = JSON.parse(savedUser);
  return user.id || user.user_id || user.UserID || user.MemberID || "";
};

// ========================================================
// 🔐 1. AUTHENTICATION API
// ========================================================
export const login = (data) => axios.post(`${API_BASE_URL}/login`, data);
export const register = (data) => axios.post(`${API_BASE_URL}/register`, data);

// ========================================================
// 📦 2. CATEGORIES & ITEMS API (จัดการสิ่งของ)
// ========================================================
export const getCategories = () => axios.get(`${API_BASE_URL}/categories`);
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

export const createExchangeRequest = async (param1, param2) => {
  try {
    const memberId = getStoredMemberId();
    let payload = {};

    if (typeof param1 === "object" && param1 !== null) {
      payload = {
        member_id: param1.sender_id || memberId,
        target_member_id: param1.receiver_id,
        my_item_id: param1.my_item_id,       
        their_item_id: param1.their_item_id, 
        location: param1.location,
        phone_number: param1.phone_number
      };
    } else {
      payload = {
        member_id: memberId,
        target_member_id: param1,
        location: param2
      };
    }

    const response = await axios.post(`${API_BASE_URL}/exchanges`, payload);
    return response.data;
  } catch (error) {
    console.error("Error creating exchange request:", error);
    throw error;
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
    // 💡 ปรับจาก API_URL เดิม (localhost) มาใช้ API_BASE_URL เพื่อป้องกันปัญหาเว็บบอร์ดพังเวลารันเครื่องอื่น
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    return { success: false, data: null };
  }
};

export const updateUserProfile = async (memberId, formData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/members/${memberId}`, formData, {
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
    return response.data; // Backend คืนค่า { success: true, ProblemID: ... }
  } catch (error) {
    console.error("Error creating report:", error);
    // ส่ง Error Message ที่มาจาก Flask ไปให้หน้าบ้านแสดงผลต่อบน Toast
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

export const suspendMember = (memberId) => axios.put(`${API_BASE_URL}/admin/users/${memberId}/suspend`);
export const unsuspendMember = (memberId) => axios.put(`${API_BASE_URL}/admin/users/${memberId}/unsuspend`);
export const adminDeleteItem = (itemId) => axios.delete(`${API_BASE_URL}/admin/items/${itemId}`);
export const resolveReport = (problemId) => axios.put(`${API_BASE_URL}/admin/reports/${problemId}`);

export default API_BASE_URL;