import axios from 'axios';

// =========================================================================
// 📌 CONFIGURATION & CONSTANTS (การตั้งค่า URL พื้นฐานและตัวช่วยค้นหาผู้ใช้)
// =========================================================================

/**
 * ฟังก์ชันสำหรับตรวจสอบและกำหนดค่า Base URL อัตโนมัติตามสภาพแวดล้อมที่ใช้งาน
 * - รองรับการรันผ่าน VS Code DevTunnels (แปลงพอร์ตอัตโนมัติและบังคับใช้ HTTPS)
 * - รองรับการรันผ่าน Localhost หรือ IP Address ภายในเครือข่าย Wi-Fi ทั่วไป
 * 
 * @returns {string} ค่า Base URL ของเซิร์ฟเวอร์ Backend
 */
const getBaseUrl = () => {
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
 * ฟังก์ชันตัวช่วย (Helper Function) สำหรับดึงรหัสประจำตัวสมาชิก (Member ID) จาก localStorage
 * ช่วยลดความซ้ำซ้อนในการเขียนโค้ดและดักจับชื่อ Key ทุกรูปแบบเพื่อความปลอดภัยและความเข้ากันได้ของข้อมูล
 * 
 * @returns {string|number} รหัสประจำตัวสมาชิก หรือค่าว่างหากไม่พบข้อมูลในระบบ
 */
const getStoredMemberId = () => {
  const savedUser = sessionStorage.getItem("user");
  if (!savedUser) return "";
  
  const user = JSON.parse(savedUser);
  return user.id || user.user_id || user.UserID || user.MemberID || "";
};


// =========================================================================
// 🔐 1. AUTHENTICATION API (ระบบเข้าสู่ระบบและสมัครสมาชิก)
// =========================================================================

/**
 * ฟังก์ชันส่งคำขอเข้าสู่ระบบ (Login) ไปยังเซิร์ฟเวอร์
 * @param {Object} data - ข้อมูลบัญชีผู้ใช้งานประกอบด้วยอีเมลและรหัสผ่าน
 * @returns {Promise<Object>} ผลลัพธ์การเข้าสู่ระบบพร้อม Token และข้อมูลผู้ใช้
 */
export const login = (data) => axios.post(`${API_BASE_URL}/login`, data);

/**
 * ฟังก์ชันส่งคำขอสมัครสมาชิกใหม่ (Register) ไปยังเซิร์ฟเวอร์
 * @param {Object} data - ข้อมูลรายละเอียดการสมัครสมาชิก (อีเมล, รหัสผ่าน, ชื่อแสดงผล)
 * @returns {Promise<Object>} ผลลัพธ์การลงทะเบียนและสถานะการรอส่ง OTP
 */
export const register = (data) => axios.post(`${API_BASE_URL}/register`, data);


// =========================================================================
// 📦 2. CATEGORIES & ITEMS API (ระบบจัดการหมวดหมู่และสิ่งของ)
// =========================================================================

// --- หมวดหมู่สินค้า (Categories) ---

/**
 * ดึงรายการหมวดหมู่สินค้าทั้งหมดพร้อมจำนวนสินค้าในแต่ละหมวด
 * @returns {Promise<Array>} รายชื่อหมวดหมู่ทั้งหมด
 */
export const getCategories = () => axios.get(`${API_BASE_URL}/categories`);

/**
 * เพิ่มหมวดหมู่สินค้าใหม่เข้าสู่ระบบ (สำหรับผู้ดูแลระบบ)
 * @param {Object} data - ข้อมูลชื่อหมวดหมู่และไอคอน
 * @returns {Promise<Object>} สถานะความสำเร็จ
 */
export const createCategory = (data) => axios.post(`${API_BASE_URL}/categories`, data);

/**
 * อัปเดตข้อมูลหมวดหมู่สินค้าตามรหัส ID
 * @param {Number} id - รหัสหมวดหมู่
 * @param {Object} data - ข้อมูลที่ต้องการแก้ไข
 * @returns {Promise<Object>} สถานะความสำเร็จ
 */
export const updateCategory = (id, data) => axios.put(`${API_BASE_URL}/categories/${id}`, data);

/**
 * ลบหมวดหมู่สินค้าออกจากระบบตามรหัส ID
 * @param {Number} id - รหัสหมวดหมู่
 * @returns {Promise<Object>} สถานะความสำเร็จ
 */
export const deleteCategory = (id) => axios.delete(`${API_BASE_URL}/categories/${id}`);

// --- สิ่งของ / สินค้า (Items) ---

/**
 * ดึงรายการโพสต์สิ่งของทั้งหมดที่พร้อมใช้งานในระบบ
 * @returns {Promise<Array>} รายการโพสต์สินค้าทั้งหมด
 */
export const getItems = () => axios.get(`${API_BASE_URL}/items`);

/**
 * ดึงข้อมูลรายละเอียดเชิงลึกของสินค้าเฉพาะเจาะจงตามรหัส ID
 * @param {Number} id - รหัสสินค้า
 * @returns {Promise<Object>} รายละเอียดข้อมูลสินค้า
 */
export const getItemById = (id) => axios.get(`${API_BASE_URL}/items/${id}`);

/**
 * สร้างโพสต์สินค้าใหม่พร้อมรองรับการอัปโหลดไฟล์รูปภาพผ่าน FormData
 * @param {FormData} formData - ข้อมูลฟอร์มโพสต์สินค้าและไฟล์รูปภาพ
 * @returns {Promise<Object>} สถานะการสร้างโพสต์สำเร็จ
 */
export const createItem = (formData) => axios.post(`${API_BASE_URL}/items`, formData);

/**
 * อัปเดตและแก้ไขรายละเอียดโพสต์สินค้าตามรหัส ID
 * @param {Number} id - รหัสสินค้า
 * @param {FormData} formData - ข้อมูลฟอร์มที่ต้องการปรับปรุง
 * @returns {Promise<Object>} สถานะการอัปเดตสำเร็จ
 */
export const updateItem = (id, formData) => axios.put(`${API_BASE_URL}/items/${id}`, formData);

/**
 * ลบโพสต์สินค้าออกจากระบบตามรหัส ID
 * @param {Number} id - รหัสสินค้า
 * @returns {Promise<Object>} สถานะการลบสำเร็จ
 */
export const deleteItem = (id) => axios.delete(`${API_BASE_URL}/items/${id}`);


// =========================================================================
// 🔄 3. EXCHANGES API (ระบบจับคู่และทำรายการแลกเปลี่ยน)
// =========================================================================

/**
 * ดึงรายการคำขอแลกเปลี่ยนทั้งหมดของผู้ใช้งานปัจจุบันโดยอิงจาก Member ID ใน localStorage
 * @returns {Promise<Object>} รายการแลกเปลี่ยนทั้งหมดที่เกี่ยวข้องกับผู้ใช้
 */
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

/**
 * สร้างคำขอแลกเปลี่ยนสิ่งของชิ้นใหม่ระหว่างผู้ใช้งาน
 * @param {Object} payload - ข้อมูลคู่แลกเปลี่ยนและสินค้าที่เกี่ยวข้อง (sender, receiver, items, location)
 * @returns {Promise<Object>} ผลลัพธ์การสร้างคำขอและ ID รายการ
 */
export const createExchangeRequest = async (payload) => {
  try {
    const memberId = getStoredMemberId();
    
    const requestData = {
      member_id: payload.sender_id || payload.member_id || memberId,
      target_member_id: payload.receiver_id || payload.target_member_id,
      my_item_id: payload.my_item_id,       
      their_item_id: payload.their_item_id, 
      location: payload.location || 'นัดเจอตามตกลง',
      match_score: payload.match_score || 0,
      phone_number: payload.phone_number || '',
      exchange_type: payload.exchange_type
    };
    
    const response = await axios.post(`${API_BASE_URL}/exchanges`, requestData);
    return response.data;
  } catch (error) {
    console.error("Error creating exchange request:", error);
    throw error.response?.data || error;
  }
};

/**
 * ดึงรายการแนะนำสินค้าที่เหมาะสมด้วยระบบ AI Semantic Matching
 * @param {Number} itemId - รหัสสินค้าที่ใช้เป็นฐานในการค้นหาคำแนะนำ
 * @returns {Promise<Object>} รายการสินค้าที่แนะนำจากระบบ AI
 */
export const getAIRecommendations = (itemId) => axios.get(`${API_BASE_URL}/matches/${itemId}`);

/**
 * ขอรับรหัส OTP สำหรับเปิดดูเบอร์โทรศัพท์ติดต่อของคู่แลกเปลี่ยน
 * @param {Number} exchangeId - รหัสรายการแลกเปลี่ยน
 * @returns {Promise<Object>} สถานะการส่งรหัส OTP ไปยังอีเมล
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
 * ยืนยันรหัส OTP เพื่อปลดล็อกสิทธิ์ดูเบอร์โทรศัพท์ติดต่อของคู่สนทนา
 * @param {Number} exchangeId - รหัสรายการแลกเปลี่ยน
 * @param {String} code - รหัส OTP 6 หลักที่ได้รับ
 * @returns {Promise<Object>} สถานะการยืนยันรหัสสำเร็จ
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

/**
 * ยกเลิกรายการแลกเปลี่ยนที่กำลังดำเนินการอยู่พร้อมระบุเหตุผล
 * @param {Number} exchangeId - รหัสรายการแลกเปลี่ยน
 * @param {String} reason - เหตุผลในการยกเลิกรายการ
 * @returns {Promise<Object>} สถานะการยกเลิกสำเร็จ
 */
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

/**
 * ยืนยันการแลกเปลี่ยนเสร็จสิ้นพร้อมส่งข้อมูลรีวิวและให้คะแนนความพึงพอใจ
 * @param {Number} exchangeId - รหัสรายการแลกเปลี่ยน
 * @param {Object} reviewData - ข้อมูลการให้คะแนนและคอมเมนต์รีวิว
 * @returns {Promise<Object>} ผลลัพธ์การบันทึกรีวิวและปิดจ็อบแลกเปลี่ยน
 */
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


// =========================================================================
// 🔔 4. NOTIFICATIONS API (ระบบแจ้งเตือนข้อความ)
// =========================================================================

/**
 * ดึงรายการแจ้งเตือนทั้งหมดของสมาชิกปัจจุบัน
 * @returns {Promise<Object>} รายการแจ้งเตือนทั้งหมดเรียงตามเวลาล่าสุด
 */
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

/**
 * ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่านเพื่อแสดงผลเป็น Badge บนไอคอนกระดิ่ง
 * @returns {Promise<Object>} จำนวนข้อความที่ยังไม่ได้อ่าน
 */
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

/**
 * อัปเดตสถานะการแจ้งเตือนเฉพาะรายการให้เปลี่ยนเป็น "อ่านแล้ว"
 * @param {Number} notificationId - รหัสการแจ้งเตือน
 * @returns {Promise<Object>} สถานะการอัปเดตสำเร็จ
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    throw error;
  }
};


// =========================================================================
// 👤 5. USER PROFILE & STATS API (ข้อมูลโปรไฟล์และสถิติผู้ใช้งาน)
// =========================================================================

/**
 * ดึงข้อมูลสถิติความสำเร็จและประวัติรีวิวของผู้ใช้งาน
 * @param {Number} userId - รหัสสมาชิกที่ต้องการตรวจสอบ
 * @returns {Promise<Object>} สถิติการแลกเปลี่ยนและรายการรีวิวทั้งหมด
 */
export const getUserStats = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`);
    return response.data;
  } catch (error) {
    console.error("❌ Error fetching user stats:", error);
    return { success: false, data: null };
  }
};

/**
 * อัปเดตข้อมูลส่วนตัว (ชื่อแสดงผล, รหัสผ่าน) และรูปโปรไฟล์ของผู้ใช้งาน
 * @param {Number} memberId - รหัสสมาชิก
 * @param {FormData} formData - ข้อมูลฟอร์มที่บรรจุข้อมูลใหม่และรูปโปรไฟล์
 * @returns {Promise<Object>} ข้อมูลโปรไฟล์ที่ได้รับการอัปเดตแล้ว
 */
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


// =========================================================================
// ⚠️ 6. REPORTS API (ระบบรายงานปัญหาและข้อเสนอแนะ)
// =========================================================================

/**
 * ส่งรายงานปัญหาหรือข้อเสนอแนะใหม่เข้าสู่ระบบ
 * @param {Object} data - ข้อมูลรายละเอียดปัญหา (ประเภทปัญหา, รายละเอียด, ไอเทมหรือผู้ใช้ที่ถูกรายงาน)
 * @returns {Promise<Object>} สถานะความสำเร็จและรหัสรายงาน (ProblemID)
 */
export const createReport = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/reports`, data);
    return response.data; 
  } catch (error) {
    console.error("Error creating report:", error);
    throw error.response?.data || error;
  }
};

/**
 * ดึงรายการแจ้งปัญหาทั้งหมดในระบบ (สำหรับผู้ดูแลระบบ)
 * @returns {Promise<Object>} รายการรายงานปัญหาทั้งหมด
 */
export const getReports = async () => {
  const response = await axios.get(`${API_BASE_URL}/reports`);
  return response.data;
};

/**
 * ดึงข้อมูลรายละเอียดรายงานปัญหาเฉพาะเจาะจงตามรหัสปัญหา
 * @param {Number} problemId - รหัสปัญหา
 * @returns {Promise<Object>} รายละเอียดเชิงลึกของรายงาน
 */
export const getReportById = async (problemId) => {
  const response = await axios.get(`${API_BASE_URL}/reports/${problemId}`);
  return response.data;
};


// =========================================================================
// 👑 7. ADMIN API (ระบบหลังบ้านผู้ดูแลระบบ)
// =========================================================================

/** ดึงข้อมูลสถิติภาพรวมสำหรับแดชบอร์ดแอดมิน */
export const getAdminDashboard = () => axios.get(`${API_BASE_URL}/admin/dashboard`);

/** ดึงรายชื่อสมาชิกทั้งหมดในระบบสำหรับการจัดการ */
export const getAdminUsers = () => axios.get(`${API_BASE_URL}/admin/users`);

/** ดึงรายการโพสต์สิ่งของทั้งหมดในระบบสำหรับตรวจสอบเนื้อหา */
export const getAdminItems = () => axios.get(`${API_BASE_URL}/admin/items`);

/** ดึงรายการแจ้งปัญหาทั้งหมดในมุมมองผู้ดูแลระบบ */
export const getAdminReports = () => axios.get(`${API_BASE_URL}/admin/reports`);

/**
 * ระงับสิทธิ์การใช้งานบัญชีผู้ใช้ (แบนชั่วคราวหรือถาวร)
 * @param {Number} memberId - รหัสสมาชิก
 * @param {Object} payload - ประเภทการแบน, จำนวนวัน และเหตุผล
 */
export const suspendMember = (memberId, payload) => axios.put(`${API_BASE_URL}/admin/users/${memberId}/suspend`, payload);

/**
 * คืนสิทธิ์การใช้งานบัญชีผู้ใช้ที่เคยถูกระงับ (ปลดแบน)
 * @param {Number} memberId - รหัสสมาชิก
 */
export const unsuspendMember = (memberId) => axios.put(`${API_BASE_URL}/admin/users/${memberId}/unsuspend`);

/**
 * ลบโพสต์สินค้าออกจากระบบด้วยสิทธิ์ผู้ดูแลระบบ พร้อมส่งเหตุผลแจ้งเตือน
 */
export const adminDeleteItem = (itemId, reason) => {
  return axios.delete(`${API_BASE_URL}/admin/items/${itemId}`, { 
    data: { reason: reason } 
  });
};

/**
 * อัปเดตสถานะรายงานปัญหาให้เป็น 'Resolved' (แก้ไขแล้ว/ปิดเคส) พร้อมส่งข้อความแจ้งเตือน
 * @param {Number} problemId - รหัสรายงานปัญหา
 * @param {String} resolutionMessage - ข้อความแจ้งสิ่งที่ได้ดำเนินการแก้ไขให้ผู้แจ้งทราบ
 */
export const resolveReport = (problemId, resolutionMessage = "") => 
  axios.put(`${API_BASE_URL}/admin/reports/${problemId}`, { 
    resolution_message: resolutionMessage 
  });

export default API_BASE_URL;