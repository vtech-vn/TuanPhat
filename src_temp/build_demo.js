const fs = require('fs');

let html = fs.readFileSync('Index.html', 'utf8');

const company = {
  name: "CÔNG TY TNHH KIẾN TRÚC & NỘI THẤT TUẤN PHÁT",
  address: "Số 10, Đường số 2, Khu dân cư Cityland Park Hills, P.10, Q.Gò Vấp, TP.HCM",
  hotline: "0909.123.456",
  website: "noithattuanphat.com",
  logo: "https://vtech-vn.github.io/TuanPhat/docs/LOGO%20TU%E1%BA%A4N%20PHAT-02.png"
};

const quote = {
  project: "CĂN HỘ CAO CẤP VINHOMES",
  address: "Quận Bình Thạnh, TP.HCM",
  quoteName: "Báo giá nội thất",
  total: 150000000,
  vatRate: 8,
  vatAmount: 12000000,
  discountRate: 5,
  discountAmount: 7500000
};

// We will construct the sections manually
let sectionHtml = `
    <div style="margin-bottom:18px;">
      <div class="section-header">
        <div class="section-icon">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3"/><path d="M2 11a2 2 0 012-2h16a2 2 0 012 2v5H2v-5z"/><path d="M6 20v-3M18 20v-3"/></svg>
        </div>
        <div class="section-title">PHÒNG KHÁCH</div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th style="width:5%">STT</th>
            <th style="width:25%">Hạng mục</th>
            <th style="width:15%">Kích thước</th>
            <th style="width:5%">ĐVT</th>
            <th style="width:5%">KL</th>
            <th style="width:5%">SL</th>
            <th style="width:10%">Đơn giá</th>
            <th style="width:10%">Thành tiền</th>
            <th style="width:10%">Hình ảnh</th>
            <th style="width:10%">Ghi chú</th>
          </tr></thead>
          <tbody>
            <tr>
              <td class="center" style="color:#bbb;font-size:12px;">1</td>
              <td style="font-weight:700;color:#1a1a1a;padding-left:10px;">Sofa da phòng khách</td>
              <td class="center" style="color:var(--muted);">2000 × 800 × 900</td>
              <td class="center" style="white-space:nowrap;letter-spacing:-0.3px;">Cái</td>
              <td class="center" style="white-space:nowrap;letter-spacing:-0.3px;">1</td>
              <td class="center" style="white-space:nowrap;letter-spacing:-0.3px;">1</td>
              <td class="right" style="white-space:nowrap;letter-spacing:-0.3px;">15.000.000</td>
              <td class="right" style="font-weight:700;white-space:nowrap;letter-spacing:-0.3px;">15.000.000</td>
              <td class="center"></td>
              <td style="font-size:12px;line-height:1.6;color:var(--muted);padding-left:8px;">Da bò thật nhập khẩu</td>
            </tr>
            <tr class="total-row">
              <td colspan="7">
                <div class="total-label-cell">
                  TỔNG CỘNG PHÒNG KHÁCH:
                </div>
              </td>
              <td class="right" style="font-size:14px;font-weight:800;color:var(--green);">15.000.000</td>
              <td colspan="2"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
`;

// Replace blocks
let finalHtml = html.replace(/<\? if\(company\.logo && company\.logo\.indexOf\('data:image'\)===0\){ \?>[\s\S]*?<\? } \?>/, `<img src="${company.logo}">`);
finalHtml = finalHtml.replace(/<\?= company\.name \?>/, company.name);
finalHtml = finalHtml.replace(/<\?= company\.address \?>/, company.address);
finalHtml = finalHtml.replace(/<\?= company\.hotline \?>/, company.hotline);
finalHtml = finalHtml.replace(/<\?= company\.website \?>/, company.website);
finalHtml = finalHtml.replace(/<\?= quote\.project \?>/, quote.project);
finalHtml = finalHtml.replace(/<\?= quote\.address \?>/, quote.address);

// Remove the dynamic loop block and insert static html
finalHtml = finalHtml.replace(/<\? for\(var sec in sections\){ \?>[\s\S]*?<\? } \?>/, sectionHtml);

// Footer values
finalHtml = finalHtml.replace(/<\?= Number\(quote\.total\)\.toLocaleString\('vi-VN'\) \?>/g, "150.000.000");
finalHtml = finalHtml.replace(/<\?= quote\.discountRate\|\|0 \?>/g, "5");
finalHtml = finalHtml.replace(/<\?= Number\(quote\.discountAmount\|\|0\)\.toLocaleString\('vi-VN'\) \?>/g, "7.500.000");
finalHtml = finalHtml.replace(/<\?= \(Number\(quote\.total\) - Number\(quote\.discountAmount\|\|0\)\)\.toLocaleString\('vi-VN'\) \?>/g, "142.500.000");
finalHtml = finalHtml.replace(/<\?= quote\.vatRate\|\|0 \?>/g, "8");
finalHtml = finalHtml.replace(/<\?= Number\(quote\.vatAmount\|\|0\)\.toLocaleString\('vi-VN'\) \?>/g, "11.400.000");
finalHtml = finalHtml.replace(/<\?= \(Number\(quote\.total\) - Number\(quote\.discountAmount\|\|0\) \+ Number\(quote\.vatAmount\|\|0\)\)\.toLocaleString\('vi-VN'\) \?>/g, "153.900.000");

// Script section replacements
finalHtml = finalHtml.replace(/<\?[\s\S]*?\?>/g, ''); // strip any remaining template tags

fs.writeFileSync('docs/report_demo.html', finalHtml);
console.log("Written docs/report_demo.html");
