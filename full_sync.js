const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function fullSync() {
    const files = [
        { name: 'appsscript', type: 'JSON',      source: fs.readFileSync('appsscript.json',          'utf8') },
        { name: 'MAIN_Router',            type: 'SERVER_JS', source: fs.readFileSync('MAIN_Router.js',           'utf8') },
        { name: 'QUOTE_Backend',          type: 'SERVER_JS', source: fs.readFileSync('QUOTE_Backend.js',         'utf8') },
        { name: 'QUOTE_UI',               type: 'HTML',      source: fs.readFileSync('QUOTE_UI.html',            'utf8') },
        { name: 'DASH_Financial_Backend', type: 'SERVER_JS', source: fs.readFileSync('DASH_Financial_Backend.js','utf8') },
        { name: 'CRM_Backend',            type: 'SERVER_JS', source: fs.readFileSync('CRM_Backend.js',           'utf8') },
        { name: 'UTIL_SheetOps',          type: 'SERVER_JS', source: fs.readFileSync('UTIL_SheetOps.js',         'utf8') },
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
