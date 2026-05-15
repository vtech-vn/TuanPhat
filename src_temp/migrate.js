const fs = require('fs');
let html = fs.readFileSync('docs/view.html', 'utf8');

// We need to transform Apps Script tags to Vue tags
// 1. Add Vue CDN to head
html = html.replace('</head>', '  <script src="https://cdn.jsdelivr.net/npm/vue@2.6.14/dist/vue.js"></script>\n</head>');

// 2. Wrap the body content in <div id="app"> and handle loading state
html = html.replace('<body>', '<body>\n<div id="app">\n  <div v-if="loading" style="text-align:center; padding: 50px; font-family: Inter, sans-serif; font-size: 18px; color: #1a5c38; font-weight: bold;">\n    Đang tải dữ liệu báo giá...\n  </div>\n  <div v-else-if="error" style="text-align:center; padding: 50px; font-family: Inter, sans-serif; font-size: 18px; color: #E21F25; font-weight: bold;">\n    {{ error }}\n  </div>\n  <div v-else>');
html = html.replace('</body>', '  </div>\n</div>\n</body>');

// 3. Make PDF button red
html = html.replace('class="download-btn"', 'class="download-btn" style="background-color: #E21F25 !important;"');

// 4. Transform variables
html = html.replace(/<\?!= company\.logo \?>/g, '{{ company.logo }}');
html = html.replace(/<\?= company\.name \?>/g, '{{ company.name }}');
html = html.replace(/<\?= company\.address \?>/g, '{{ company.address }}');
html = html.replace(/<\?= company\.hotline \?>/g, '{{ company.hotline }}');
html = html.replace(/<\?= company\.website \?>/g, '{{ company.website }}');
html = html.replace(/<\?= quote\.project \?>/g, '{{ quote.project }}');
html = html.replace(/<\?= quote\.address \?>/g, '{{ quote.address }}');

// 5. Handle the conditional logo
html = html.replace(/<\? if\(company\.logo && company\.logo\.indexOf\('data:image'\)===0\){ \?>/g, '<template v-if="company.logo && company.logo.startsWith(\'data:image\')">');
html = html.replace(/<img src="<\?!= company\.logo \?>">/g, '<img :src="company.logo">');
html = html.replace(/<\? }else{ \?>/g, '</template><template v-else>');
html = html.replace(/<\? } \?>/g, '</template>');

// 6. Handle sections loop
const loopRegex = /<\? for\(var sec in sections\){ \?>([\s\S]*?)<\? } \?>/g;
html = html.replace(loopRegex, function(match, inner) {
  // Replace sec with sectionName
  let res = inner.replace(/<\?= sec \?>/g, '{{ sectionName }}');
  
  // Handle the inner loop
  const innerLoopRegex = /<\? var secTotal=0;var rowNum=0; \?>\s*<\? for\(var i=0;i<sections\[sec\]\.length;i\+\+\){\s*var r=sections\[sec\]\[i\];\s*var _d=\(r\.description\|\|''\)\.toString\(\)\.replace\(\/\\s\/g,''\);\s*if\(_d!==''\){rowNum\+\+;secTotal\+=Number\(r\.amount\)\|\|0; \?>([\s\S]*?)<\? }}\?>/;
  
  res = res.replace(innerLoopRegex, function(m2, innerRow) {
    let rowRes = innerRow.replace(/<\?= rowNum \?>/g, '{{ index + 1 }}');
    rowRes = rowRes.replace(/<\?= r\.description \?>/g, '{{ r.description }}');
    rowRes = rowRes.replace(/<\?= \[r\.l,r\.w,r\.h\]\.filter\(Boolean\)\.join\(' × '\) \?>/g, "{{ [r.l, r.w, r.h].filter(Boolean).join(' × ') }}");
    rowRes = rowRes.replace(/<\?= r\.uom \?>/g, '{{ r.uom }}');
    rowRes = rowRes.replace(/<\?= r\.kl \?>/g, '{{ r.kl }}');
    rowRes = rowRes.replace(/<\?= r\.qty \?>/g, '{{ r.qty }}');
    rowRes = rowRes.replace(/<\?= Number\(r\.price\|\|0\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ Number(r.price||0).toLocaleString('vi-VN') }}");
    rowRes = rowRes.replace(/<\?= Number\(r\.amount\|\|0\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ Number(r.amount||0).toLocaleString('vi-VN') }}");
    
    // Image handling inside loop
    rowRes = rowRes.replace(/<\? if\(r\.img&&r\.img\.indexOf\('data:image'\)===0\){ \?><img src="<\?!= r\.img \?>" class="img-cell"><\? } \?>/g, '<img v-if="r.img && r.img.startsWith(\'data:image\')" :src="r.img" class="img-cell">');
    
    rowRes = rowRes.replace(/<\?!= \(typeof r\.note==='string'\?r\.note\.replace\(\/\\n\/g,'<br>'\):''\)\?>/g, '<span v-html="(typeof r.note===\'string\'?r.note.replace(/\\n/g,\'<br>\'):\'\')"></span>');

    return `<template v-for="(r, index) in filteredItems(items)">${rowRes}</template>`;
  });
  
  res = res.replace(/<\?= secTotal\.toLocaleString\('vi-VN'\) \?>/g, "{{ computeSectionTotal(items).toLocaleString('vi-VN') }}");
  res = res.replace(/<\?= widths\[(\d+)\] \?>/g, '{{ widths[$1] }}');

  return `<div v-for="(items, sectionName) in sections" :key="sectionName">${res}</div>`;
});

// 7. Handle Footer calculations
html = html.replace(/<\?= Number\(quote\.total\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ Number(quote.total).toLocaleString('vi-VN') }}");
html = html.replace(/<\? if\(quote\.discountRate > 0 \|\| quote\.discountAmount > 0\) { \?>/g, '<template v-if="quote.discountRate > 0 || quote.discountAmount > 0">');
html = html.replace(/<\?= quote\.discountRate\|\|0 \?>/g, '{{ quote.discountRate||0 }}');
html = html.replace(/<\?= Number\(quote\.discountAmount\|\|0\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ Number(quote.discountAmount||0).toLocaleString('vi-VN') }}");
html = html.replace(/<\?= \(Number\(quote\.total\) - Number\(quote\.discountAmount\|\|0\)\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ (Number(quote.total) - Number(quote.discountAmount||0)).toLocaleString('vi-VN') }}");
html = html.replace(/<\? } \?>/g, '</template>');
html = html.replace(/<\?= quote\.vatRate\|\|0 \?>/g, '{{ quote.vatRate||0 }}');
html = html.replace(/<\?= Number\(quote\.vatAmount\|\|0\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ Number(quote.vatAmount||0).toLocaleString('vi-VN') }}");
html = html.replace(/<\?= \(Number\(quote\.total\) - Number\(quote\.discountAmount\|\|0\) \+ Number\(quote\.vatAmount\|\|0\)\)\.toLocaleString\('vi-VN'\) \?>/g, "{{ (Number(quote.total) - Number(quote.discountAmount||0) + Number(quote.vatAmount||0)).toLocaleString('vi-VN') }}");

// 8. Remove the old script tags exporting variables
html = html.replace(/<script>\s*var exportCompany=[\s\S]*?<\/script>/, '');

// 9. Add Vue application script
const vueScript = `
<script>
new Vue({
  el: '#app',
  data: {
    loading: true,
    error: '',
    company: {},
    quote: {},
    sections: {},
    widths: ["5%", "25%", "15%", "5%", "5%", "5%", "10%", "10%", "10%", "10%"]
  },
  mounted() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (!id) {
      this.error = "LỖI: Vui lòng cung cấp tham số ?id=";
      this.loading = false;
      return;
    }
    
    const scriptUrl = "https://script.google.com/macros/s/AKfycbzmF2FtEfj9sq_fSQi7N9vc9jV9Unl8kyMCJ9TRQum7auNmQSxZ6RWo4CN_JYhmmEoF/exec?api=json&id=" + id;
    const callbackName = 'handleQuoteJson';
    
    window[callbackName] = (data) => {
      if (data && data.quote) {
        this.company = data.company;
        this.quote = data.quote;
        this.sections = data.sections;
        if (data.widths) this.widths = data.widths;
        
        // Setup variables for exportExcel and generatePDF to work
        window.exportCompany = data.company;
        window.exportQuote = data.quote;
        window.exportSections = data.sections;
        
        this.loading = false;
      } else {
        this.error = "Lỗi: Không tìm thấy nội dung báo giá.";
        this.loading = false;
      }
    };
    
    const script = document.createElement('script');
    script.src = scriptUrl + "&callback=" + callbackName;
    script.onerror = () => {
      this.error = "Lỗi kết nối đến máy chủ Apps Script.";
      this.loading = false;
    };
    document.body.appendChild(script);
  },
  methods: {
    filteredItems(items) {
      return items.filter(r => (r.description||'').toString().replace(/\\s/g,'') !== '');
    },
    computeSectionTotal(items) {
      let total = 0;
      const validItems = this.filteredItems(items);
      validItems.forEach(r => { total += Number(r.amount) || 0; });
      return total;
    }
  }
});
</script>
`;
html = html.replace('</body>', vueScript + '\n</body>');

fs.writeFileSync('docs/view.html', html);
console.log('Successfully generated docs/view.html');
