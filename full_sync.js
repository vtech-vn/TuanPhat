const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function fullSync() {
    const files = [
        { name: 'appsscript', type: 'JSON', source: fs.readFileSync('appsscript.json', 'utf8') },
        { name: 'Code', type: 'SERVER_JS', source: fs.readFileSync('Code.js', 'utf8') },
        { name: 'Index', type: 'HTML', source: fs.readFileSync('Index.html', 'utf8') },
        { name: 'PriceQuote', type: 'SERVER_JS', source: fs.readFileSync('PriceQuote.js', 'utf8') },
        { name: 'TMP', type: 'SERVER_JS', source: fs.readFileSync('TMP.js', 'utf8') }
    ];

    const res = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files })
    });
    const resData = await res.json();
    console.log("Sync result:", resData.files ? "Success" : resData);
}

fullSync();
