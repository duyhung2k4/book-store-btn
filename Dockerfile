# Sử dụng Node.js LTS làm base image
FROM node:18-alpine

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json để cài đặt dependencies trước
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Thiết lập biến môi trường
ENV PORT=3000

# Mở port cho container
EXPOSE 3000

# Chạy ứng dụng
CMD ["node", "index.js"]
