# 🧩 EProject - Hệ thống Microservices Node.js

EProject là hệ thống **microservices** được xây dựng bằng **Node.js** với mục tiêu mô phỏng một nền tảng thương mại điện tử hiện đại, bao gồm nhiều service độc lập như `Auth`, `Product`, `Order`, `API Gateway` và `Utils`.  
Mỗi service hoạt động riêng biệt, có thể mở rộng độc lập, giao tiếp qua HTTP hoặc Message Queue, dễ dàng triển khai trong môi trường container hóa (Docker).

---

## 🚀 Các thành phần chính

| Service | Mô tả |
|----------|-------|
| **Auth Service** | Quản lý người dùng, đăng ký, đăng nhập, xác thực JWT. |
| **Product Service** | Quản lý sản phẩm: thêm, sửa, xóa, tìm kiếm. |
| **Order Service** | (tùy chọn) Quản lý đơn hàng và trạng thái giao dịch. |
| **API Gateway** | Cổng giao tiếp trung gian, định tuyến yêu cầu đến các service con. |
| **Utils** | Các hàm tiện ích dùng chung giữa các service. |

---


---

## 🛠️ Công nghệ sử dụng

- **Node.js** / **Express.js**
- **MongoDB** (kết nối qua Mongoose)
- **JWT** cho xác thực người dùng
- **Docker** & **Docker Compose**
- **GitHub Actions** cho CI/CD pipeline

---

---

## ⚙️ Cài đặt & Chạy Local

### 1️⃣ Yêu cầu môi trường

- Node.js >= 18  
- npm >= 9  
- Docker (nếu muốn chạy bằng container)

### 2️⃣ Cài đặt phụ thuộc

```bash
# Cài đặt toàn bộ
npm install

# Hoặc cài từng service
npm --prefix auth install
npm --prefix product install

# Chạy tất cả qua Docker Compose (tùy chọn)
docker compose up --build


