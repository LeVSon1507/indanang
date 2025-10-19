Tuyệt vời\! Tôi sẽ đi sâu vào chi tiết về cách triển khai hai tính năng này, tập trung vào **phương pháp kỹ thuật** và **công cụ cụ thể** cho ngữ cảnh dữ liệu nhà trọ ở Việt Nam.

---

## 1\. Triển Khai Xử lý Ngôn ngữ Tự nhiên (NLP)

Để triển khai các tính năng NLP này một cách hiệu quả, bạn cần kết hợp giữa phương pháp dựa trên **từ điển (Rule-based)** và phương pháp dựa trên **học máy (Machine Learning)**.

### A. Trích xuất Tiện ích/Đặc điểm & Phân loại Loại hình (Entity Recognition)

| Bước Triển khai                   | Chi tiết Kỹ thuật                                                                                                                                                                                                                                                                                    | Công cụ Gợi ý                                                                                                     |
| :-------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| **1. Xây dựng Từ điển (Lexicon)** | Tạo danh sách các từ và cụm từ **đồng nghĩa** cho mỗi tiện ích/đặc điểm. Ví dụ: \<ul\>\<li\>**"Máy lạnh":** "máy lạnh", "điều hòa", "AC".\</li\>\<li\>**"Bếp":** "khu bếp", "bếp riêng", "có nấu ăn".\</li\>\<li\>**"Chính chủ":** "chủ nhà", "không qua môi giới", "miễn trung gian".\</li\>\</ul\> | **Python Dictionary/JSON files** để lưu trữ các nhóm từ khóa.                                                     |
| **2. Tiền xử lý (Preprocessing)** | **Chuẩn hóa văn bản:** Loại bỏ ký tự đặc biệt, chuyển về chữ thường (lowercase), loại bỏ dấu câu thừa. **Tách từ (Tokenization):** Chia câu thành các từ/cụm từ.                                                                                                                                     | Thư viện **`pyvi`** hoặc **`underthesea`** cho tiếng Việt để tách từ chính xác hơn so với các thư viện tiếng Anh. |
| **3. Trích xuất (Extraction)**    | Dùng mô hình **Nhận dạng Thực thể Có tên (NER)** hoặc các biểu thức chính quy (**Regex**) dựa trên từ điển đã tạo để quét qua mô tả và gán nhãn (tag).                                                                                                                                               | Thư viện **`spaCy`** (với Custom Pipeline) hoặc **Regex** đơn giản trong Python.                                  |
| **4. Chuẩn hóa & Lưu trữ**        | Sau khi trích xuất, chuẩn hóa tất cả các biến thể thành một nhãn cố định (ví dụ: "điều hòa" $\rightarrow$ `has_air_conditioner: True`).                                                                                                                                                              | Lưu kết quả dưới dạng **Mảng (Array)** hoặc **Object/JSON** trong MongoDB.                                        |

### B. Cảnh báo Lừa đảo / Spam (Classification & Sentiment Analysis)

| Bước Triển khai                      | Chi tiết Kỹ thuật                                                                                                                                                                                                                                                                                                                       | Công cụ Gợi ý                                                                                                           |
| :----------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| **1. Kỹ thuật Feature Engineering**  | Tạo ra các **đặc trưng (features)** từ mô tả để đánh giá rủi ro: \<ul\>\<li\>**Độ dài** mô tả (quá ngắn \< 50 từ).\</li\>\<li\>**Tần suất** sử dụng các từ kích động/spam.\</li\>\<li\>**Tỷ lệ** giữa Giá thuê và Diện tích (so với giá trung bình khu vực).\</li\>\<li\>**Số lượng ảnh** (tin lừa đảo thường có ít ảnh).\</li\>\</ul\> | Thư viện **`scikit-learn`** để tính toán các feature này.                                                               |
| **2. Phân loại (Classification)**    | Xây dựng một mô hình **phân loại nhị phân** (ví dụ: Logistic Regression, Random Forest, hoặc Naive Bayes) để dự đoán xem tin đăng là **'Rủi ro thấp'** hay **'Rủi ro cao'**.                                                                                                                                                            | **`scikit-learn`** trong Python.                                                                                        |
| **3. Phân tích Cảm xúc (Sentiment)** | Dùng mô hình Phân tích Cảm xúc tiếng Việt để kiểm tra mô tả có quá tiêu cực (ví dụ: mô tả về môi giới, phí dịch vụ không rõ ràng) hoặc quá cường điệu.                                                                                                                                                                                  | Sử dụng các mô hình **BERT** tiếng Việt đã được huấn luyện trước (Pre-trained Models) từ **Hugging Face** để fine-tune. |

### C. Nhận dạng Địa điểm (Geocoding Support)

| Bước Triển khai                           | Chi tiết Kỹ thuật                                                                                                                                                   | Công cụ Gợi ý                                                                                                              |
| :---------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **1. Trích xuất Địa chỉ thô**             | Dùng Regex hoặc NER để trích xuất chuỗi địa chỉ đầy đủ (Ví dụ: "123 Ngô Quyền, Sơn Trà, Đà Nẵng").                                                                  | **Regex** hoặc **`pyvi` / `underthesea`** NER.                                                                             |
| **2. Geocoding (Chuyển đổi sang Tọa độ)** | Gửi địa chỉ thô đến một dịch vụ Geocoding API để nhận về cặp **Kinh độ (Longitude) và Vĩ độ (Latitude)**.                                                           | **Google Maps Geocoding API**, **OpenStreetMap Nominatim**, hoặc **Viettel Post API** (cho độ chính xác địa chỉ Việt Nam). |
| **3. Lọc và Hiển thị**                    | Nếu API trả về độ chính xác cao (match địa chỉ), lưu tọa độ. Nếu độ chính xác thấp, bạn vẫn có thể lưu tọa độ của **Phường/Quận** để hiển thị ước tính trên bản đồ. | Lưu cặp tọa độ vào trường **`location`** (dạng GeoJSON) trong MongoDB.                                                     |

---

## 2\. Triển Khai Hệ thống Database (MongoDB)

Khi đã chọn MongoDB, việc triển khai cần tận dụng các tính năng mạnh mẽ của nó, đặc biệt là **Geospatial Indexing**.

### A. Thiết kế Schema Cơ bản (Flexible)

Mặc dù MongoDB là NoSQL, bạn nên có một cấu trúc cơ bản cho Document (tin đăng) để đảm bảo các truy vấn cốt lõi hoạt động hiệu quả.

```json
{
  "_id": ObjectId("..."),
  "source_id": "CHOTOT_12345", // ID gốc của tin đăng
  "title": "Phòng trọ mới xây gần Bách Khoa",
  "raw_description": "...", // Giữ mô tả gốc để kiểm tra

  // Dữ liệu Chuẩn hóa
  "price": 3500000,
  "currency": "VND",
  "area_sqm": 25,
  "room_type": "Phong Tro", // Loại hình chuẩn hóa

  // Dữ liệu Vị trí (Quan trọng!)
  "location": {
    "type": "Point",
    "coordinates": [108.2132, 16.0607] // [Kinh độ, Vĩ độ] (Longitude, Latitude)
  },
  "address_text": "K20/30 Đinh Tiên Hoàng, Đà Nẵng",
  "district": "Hai Chau",

  // Dữ liệu NLP đã xử lý
  "amenities": [ // Tiện ích trích xuất (Dễ dàng lọc)
    "may_lanh", "wifi", "tu_lanh", "loi_di_rieng"
  ],
  "is_chinh_chu": true,
  "spam_score": 0.15, // Điểm rủi ro thấp

  // Thông tin quản lý
  "source_url": "...",
  "crawled_at": ISODate("2025-10-19T04:20:00Z"),
  "is_active": true
}
```

### B. Indexing Bắt buộc (Để tối ưu tốc độ)

Đây là các chỉ mục (index) cần thiết để đảm bảo trang web của bạn hoạt động nhanh:

1.  **Chỉ mục Geospatial (Quan trọng nhất):**
    ```javascript
    db.listings.createIndex({ location: "2dsphere" });
    ```
    - **Mục đích:** Hỗ trợ cực nhanh các truy vấn tìm kiếm theo bán kính (`$geoWithin`, `$nearSphere`) trên bản đồ Đà Nẵng.
2.  **Chỉ mục Tìm kiếm/Lọc Cơ bản:**
    ```javascript
    db.listings.createIndex({ district: 1, price: 1 });
    db.listings.createIndex({ amenities: 1, room_type: 1 });
    ```
    - **Mục đích:** Tối ưu hóa các bộ lọc phổ biến của người dùng (lọc theo Quận, Khoảng giá, Loại hình và Tiện ích).
3.  **Chỉ mục Toàn văn (Full-Text Search):**
    ```javascript
    db.listings.createIndex({ title: "text", raw_description: "text" });
    ```
    - **Mục đích:** Cho phép người dùng tìm kiếm theo từ khóa tự do ("phòng cho sinh viên", "ở ghép nữ",...).

##
