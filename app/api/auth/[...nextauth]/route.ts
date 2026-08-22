import { handlers } from '@/auth';

// Auth.js tu lo het cac duong /api/auth/* (signin, callback, session, signout,
// csrf). Khong tu viet luong OAuth: cho de sai la ma trang thai chong gia mao
// va kiem chu ky the dinh danh, ca hai deu sai am tham.
export const { GET, POST } = handlers;
