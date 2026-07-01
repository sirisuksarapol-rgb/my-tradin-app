import axios from 'axios';

const API_BASE_URL = `http://${window.location.hostname}:5000/api`;
export const IMAGE_BASE_URL = `http://${window.location.hostname}:5000`;
const API_URL = "http://localhost:5000";
export const login = (data) => axios.post(`${API_BASE_URL}/login`, data);
export const register = (data) => axios.post(`${API_BASE_URL}/register`, data);
export const getCategories = () => axios.get(`${API_BASE_URL}/categories`);
export const getItems = () => axios.get(`${API_BASE_URL}/items`);
export const getItemById = (id) => axios.get(`${API_BASE_URL}/items/${id}`); // 👈 ต้องเป็น axios.get เท่านั้น!
// ฟังก์ชัน Delete
export const deleteItem = (id) => axios.delete(`${API_BASE_URL}/items/${id}`);

export const createItem = (formData) => {
    return axios.post(`${API_BASE_URL}/items`, formData);
};

// 📝 เพิ่มฟังก์ชันสำหรับอัปเดตแก้ไขโพสต์สิ่งของ
export const updateItem = (id, formData) => {
    return axios.put(`${API_BASE_URL}/items/${id}`, formData);
};

export const getExchanges = async () => {
  try {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    const memberId = user ? (user.id || user.UserID || user.MemberID) : "";

    const response = await axios.get(`${API_BASE_URL}/exchanges?member_id=${memberId}`);
    return response.data; 
  } catch (error) {
    console.error("Error fetching exchanges API:", error);
    throw error;
  }
};

/**
 * ส่งคำขอสร้างการแลกเปลี่ยนใหม่ (รองรับทั้งการส่งแบบแจกแจงค่า และแบบมัดรวม Object Payload)
 */
export const createExchangeRequest = async (param1, param2) => {
  try {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    const memberId = user ? (user.id || user.UserID || user.MemberID) : "";

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
// 🔥 [ADDED NEW] ฟังก์ชันสำหรับระบบแจ้งเตือน (Notifications)
// ========================================================

/**
 * 1. ดึงรายการแจ้งเตือนทั้งหมดของผู้ใช้งานปัจจุบัน
 */
export const getNotifications = async () => {
  try {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    const memberId = user ? (user.id || user.UserID || user.MemberID) : "";

    const response = await axios.get(`${API_BASE_URL}/notifications?member_id=${memberId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications API:", error);
    throw error;
  }
};

export const getUnreadNotificationCount = async () => {
  try {
    const savedUser = localStorage.getItem("user");
    const user = savedUser ? JSON.parse(savedUser) : null;
    const memberId = user ? (user.id || user.UserID || user.MemberID) : "";

    const response = await axios.get(`${API_BASE_URL}/notifications/unread-count?member_id=${memberId}`);
    return response.data; // จะส่ง { success: true, count: X } กลับไป
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

export const getUserStats = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    return { success: false, data: null };
  }
};

export const updateUserProfile = async (
  memberId,
  formData
) => {
  const response = await axios.put(
    `${API_BASE_URL}/members/${memberId}`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const reportItem = (data) => axios.post(`${API_BASE_URL}/reports`, data);

export default API_BASE_URL;