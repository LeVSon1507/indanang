# Cheap Home — UI và API Phòng Trọ

Ứng dụng web hiển thị danh sách phòng trọ từ cơ sở dữ liệu, kèm bộ lọc theo giá, quận/huyện, nguồn, diện tích và các tiêu chí khác.

## 🚀 Tính năng
- UI hiển thị phòng trọ với lọc thông minh
- API `GET /api/rooms` để truy vấn dữ liệu
- Meta API `GET /api/rooms/meta` để lấy danh sách quận, nguồn, khoảng giá/diện tích

## 📋 Yêu cầu hệ thống
- Node.js 18+
- MongoDB (local hoặc Atlas)

## 🛠️ Cài đặt
1. Cài dependencies:
```bash
npm install
```
2. Tạo file `.env.local`:
```env
MONGODB_URI=mongodb://localhost:27017/cheap_home
MONGODB_DB=cheap_home
```
3. Chạy development server:
```bash
npm run dev
```

## 🎯 Sử dụng
- Truy cập UI: `http://localhost:3000`
- API phòng trọ:
```bash
# Lấy danh sách phòng trọ với các tham số tùy chọn
curl "http://localhost:3000/api/rooms?q=đà+nẵng&minPrice=1000000&maxPrice=3000000&district=Hải Châu&sources=phongtro123,chotot&cheapOnly=true&cheapThreshold=2000000&minArea=15&maxArea=35&ownerOnly=false&hasImages=true&sort=price_asc&limit=200&page=1"

# Lấy meta (districts, sources, range)
curl "http://localhost:3000/api/rooms/meta"
```

## 🔧 Tham số API `/api/rooms`
- `q`: chuỗi tìm kiếm (tiêu đề/địa chỉ)
- `minPrice`, `maxPrice`: giới hạn giá
- `district`: tên quận/huyện
- `sources`: danh sách nguồn, ví dụ `phongtro123,chotot`
- `cheapOnly`: lọc phòng dưới ngưỡng rẻ
- `cheapThreshold`: ngưỡng rẻ (mặc định 2,000,000)
- `minArea`, `maxArea`: giới hạn diện tích
- `ownerOnly`: chỉ chủ nhà
- `hasImages`: chỉ phòng có ảnh
- `sort`: `price_asc`, `price_desc`, `posted_desc`, `posted_asc`, `area_desc`, `area_asc`
- `limit`, `page`: phân trang

## 🔄 Triển khai Production
```bash
npm run build
npm start
```

## 📝 License
MIT License
