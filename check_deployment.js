const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function check() {
    const r = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/AKfycbwM0RJimYcyl2eLTfNdaRZf2gU6pSUcqMub9Sp-cAcQW0g16HkPEpdxb3ovLE8z9tgj`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await r.json();
    console.log(JSON.stringify(data, null, 2));
}

check();
