const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function deploy() {
    // 1. Create a new version
    const vRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/versions`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: 'Auto-deploy fix' })
    });
    const version = await vRes.json();
    console.log("New Version:", version);

    if (version.versionNumber) {
        // 2. Update the specific deployment
        const deployId = 'AKfycbwM0RJimYcyl2eLTfNdaRZf2gU6pSUcqMub9Sp-cAcQW0g16HkPEpdxb3ovLE8z9tgj';
        const dRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/${deployId}`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                deploymentConfig: {
                    versionNumber: version.versionNumber,
                    manifestFileName: 'appsscript',
                    description: 'Fix deployment'
                }
            })
        });
        const dResult = await dRes.json();
        console.log("Deployment Update Result:", dResult);
    }
}

deploy();
