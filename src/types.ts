export interface NguoiCoCong {
  id: string;
  hoTen: string;
  namSinh: string;
  dienChinhSach: string;
  tinhTrang: 'Còn sống' | 'Đã mất (Đã chết)' | 'Đang công tác' | string;
  diaChi: string;
  lat: number;
  lng: number;
  thongTinGiaDinh: string;
  tieuSuThanhTich: string;
  hinhAnh: string;
  namDuLieu?: string;
}
