function doGet(e) {
  var quoteId = e.parameter.id;
  if (!quoteId) return HtmlService.createHtmlOutput("<h3>Lỗi: Thiếu ID!</h3>");

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Xử lý Logo và Thông tin Công ty
  var companyData = ss.getSheetByName("Company_Profile").getRange("A2:E2").getValues()[0];
  var rawLogo = companyData[4] ? companyData[4].toString().trim() : "";
  var base64Logo = "";

  if (rawLogo) {
    try {
      var logoFile;
      if (rawLogo.length > 20 && rawLogo.indexOf('.') === -1) {
        logoFile = DriveApp.getFileById(rawLogo);
      } else {
        var files = DriveApp.searchFiles("title = '" + rawLogo + "' and trashed = false");
        if (files.hasNext()) logoFile = files.next();
      }
      
      if (logoFile) {
        var blob = logoFile.getBlob();
        base64Logo = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
      }
    } catch (err) {
      base64Logo = "[Lỗi Logo: " + err.message + "]";
    }
  }

  var company = { 
    name: companyData[0] || "", 
    address: companyData[1] || "", 
    hotline: companyData[2] || "", 
    website: companyData[3] || "", 
    logo: base64Logo 
  };

  // 2. Lấy thông tin tiêu đề báo giá (Quote_HD)
  var hdData = ss.getSheetByName("Quote_HD").getDataRange().getValues();
  var quote = null;
  for (var i = 1; i < hdData.length; i++) {
    if (hdData[i][0] == quoteId) {
      quote = { 
        id: hdData[i][0], 
        project: hdData[i][9],
        address: hdData[i][10],
        quoteName: hdData[i][5],
        total: hdData[i][4] || 0,
        vatRate: hdData[i][11] || 0,
        vatAmount: hdData[i][12] || 0,
        discountRate: hdData[i][13] || 0,
        discountAmount: hdData[i][14] || 0
      };
      break;
    }
  }
  if (!quote) return HtmlService.createHtmlOutput("<h3>Không tìm thấy báo giá!</h3>");

  // 3. Xử lý Chi tiết hạng mục (Quote_Line)
  var lineData = ss.getSheetByName("Quote_Line").getDataRange().getValues();
  var sections = {};
  var imageCache = {}; 

  for (var j = 1; j < lineData.length; j++) {
    if (lineData[j][1] == quoteId) {
      var sec = lineData[j][2] || "Khác";
      if (!sections[sec]) sections[sec] = [];
      
      var imgUrl = lineData[j][14] || "";
      var base64Img = "";

      if (imgUrl) {
        var imgString = imgUrl.toString().trim();
        var fileName = imgString.split('/').pop(); 
        if (fileName) {
          if (imageCache[fileName]) {
            base64Img = imageCache[fileName];
          } else {
            try {
              var files = DriveApp.searchFiles("title = '" + fileName + "' and trashed = false");
              if (files.hasNext()) {
                var file = files.next();
                var blob = file.getBlob();
                base64Img = "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
                imageCache[fileName] = base64Img;
              }
            } catch (err) {
              base64Img = ""; 
            }
          }
        }
      }
      
      sections[sec].push({
        description: lineData[j][4] || "", 
        l: lineData[j][5] || "",
        w: lineData[j][6] || "",
        h: lineData[j][7] || "",
        uom: lineData[j][8] || "",
        kl: lineData[j][9] || "",
        qty: lineData[j][10] || "",
        price: lineData[j][11] || 0,
        amount: lineData[j][12] || 0,
        note: lineData[j][13] || "",
        img: base64Img
      });
    }
  }

  // 4. Cấu hình độ rộng cột
  var widths = ["3%","25%","12%","4%","4%","3%","8%","10%","12%","19%"];
  var widthSheet = ss.getSheetByName("Column_Widths");
  if (widthSheet) {
    var widthValues = widthSheet.getRange("A1:A10").getValues().flat();
    widths = widthValues.map(function(w) {
      if (typeof w === 'number' && w > 0 && w < 1) return Math.round(w * 100) + '%';
      if (typeof w === 'string' && w.endsWith('%')) return w;
      return '10%';
    });
  }

  var template = HtmlService.createTemplateFromFile('Index');
  template.company = company;
  template.quote = quote;
  template.sections = sections;
  template.widths = widths;

  return template.evaluate()
    .setTitle('Báo giá ' + quote.quoteName)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function debugDrivePermissions() {
  Logger.log("Quyền Drive hiện tại: " + DriveApp.getRootFolder().getName());
}