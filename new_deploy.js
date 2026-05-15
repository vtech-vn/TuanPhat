const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function createNewDeployment() {
    // 1. Get latest version
    const vRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/versions`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const versions = await vRes.json();
    const lastVersion = versions.versions[0].versionNumber;

    // 2. Create new deployment
    const dRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            versionNumber: lastVersion,
            manifestFileName: 'appsscript',
            description: 'Fresh Deployment'
        })
    });
    const result = await dRes.json();
    console.log("New Deployment Result:", result);
}

createNewDeployment();
