import axios from 'axios';

// ✅ ใช้ window.location.hostname เพื่อให้มันดึง IP ของเครื่องให้อัตโนมัติ (แก้ปัญหา Time out)
const API_BASE_URL = `http://${window.location.hostname}:5000/api`;   

// ✅ เพิ่ม IMAGE_BASE_URL เพื่อให้หน้า Feed เอาไปดึงรูปภาพมาแสดงได้
export const IMAGE_BASE_URL = `http://${window.location.hostname}:5000`; 

export const login = (data) => axios.post(`${API_BASE_URL}/login`, data);
export const register = (data) => axios.post(`${API_BASE_URL}/register`, data);
export const categories = () => axios.get(`${API_BASE_URL}/categories`);
export const items = () => axios.get(`${API_BASE_URL}/items`);

export default API_BASE_URL;