# Sử dụng image Node.js chính thức
FROM node:18

# Cài đặt các dependencies cần thiết cho việc biên dịch msnodesqlv8
RUN apt-get update && apt-get install -y \
    unixodbc-dev \
    build-essential \
    python3 \
    g++ \
    libssl-dev \
    libxml2-dev \
    libodbc1 \
    && rm -rf /var/lib/apt/lists/*

# Đặt thư mục làm việc cho ứng dụng
WORKDIR /app

# Copy các file package.json và package-lock.json vào container
COPY package*.json ./

# Cài đặt các dependencies của ứng dụng
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở cổng mà ứng dụng sẽ chạy
EXPOSE 5000

# Chạy ứng dụng khi container khởi động
CMD ["npm", "start"]
