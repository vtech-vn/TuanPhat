const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function check() {
    const r = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/content`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await r.json();
    console.log("Remote files:", data.files.map(f => ({ name: f.name, type: f.type })));
}

check();
