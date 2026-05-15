function testLayAnhTuDrive() {
  // 1. Copy một đường dẫn ảnh thực tế từ cột Image_URL trong sheet Quote_Line của bạn dán vào đây
  var imgUrlAppSheet = "0301a.Item_Images/a293719c.Image.084004.jpg"; 
  
  var fileName = imgUrlAppSheet.split('/').pop();
  Logger.log("Bước 1: Đang tìm file có tên chính xác là -> " + fileName);
  
  try {
    // Tìm kiếm file trên Drive
    var files = DriveApp.searchFiles("title = '" + fileName + "' and trashed = false");
    
    if (files.hasNext()) {
      var file = files.next();
      Logger.log("Bước 2: ✅ Đã tìm thấy file! Tên trên Drive: " + file.getName() + " | Kích thước: " + file.getSize() + " bytes");
      
      var blob = file.getBlob();
      var base64 = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
      
      Logger.log("Bước 3: ✅ Chuyển Base64 thành công. Độ dài chuỗi dữ liệu: " + base64.length);
      Logger.log("Preview chuỗi: " + base64.substring(0, 50) + "..."); 
    } else {
      Logger.log("Bước 2: ❌ LỖI - Không tìm thấy file nào có tên '" + fileName + "' trên Drive.");
      Logger.log("Nguyên nhân có thể: File nằm ở tài khoản khác, hoặc AppSheet đổi tên file khi lưu.");
    }
  } catch (err) {
    Logger.log("❌ LỖI HỆ THỐNG: " + err.message);
  }
}

function forceAuth() {
  // Lệnh này yêu cầu quyền ghi, chắc chắn sẽ kích hoạt hộp thoại nếu chưa được cấp
  DriveApp.getRootFolder().getName();
  console.log("Nếu bạn thấy dòng này mà không có hộp thoại, nghĩa là script đã có đủ quyền.");
}