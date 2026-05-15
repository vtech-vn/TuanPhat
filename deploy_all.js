const fs = require('fs');
const token = JSON.parse(fs.readFileSync('C:\\Users\\Admin\\.clasprc.json')).tokens.default.access_token;
const scriptId = '1P8Bxw8r-FbfNDFcY0CHSWfvhaYn8amOvKkzdI-MnRZPAT8jZ-Y-bMHeK';

async function updateAllDeployments() {
    // 1. Create a new version
    console.log("Creating new version...");
    const vRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/versions`, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ description: 'Auto-deploy mobile layout fix' })
    });
    const version = await vRes.json();
    console.log("New Version:", version.versionNumber);

    if (version.versionNumber) {
        // 2. Fetch all deployments
        const depsRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const depsData = await depsRes.json();
        
        // 3. Update each one that is not HEAD
        for (const dep of depsData.deployments) {
            if (dep.deploymentId.startsWith('AKfy')) {
                console.log("Updating deployment:", dep.deploymentId);
                const updateRes = await fetch(`https://script.googleapis.com/v1/projects/${scriptId}/deployments/${dep.deploymentId}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        deploymentConfig: {
                            versionNumber: version.versionNumber,
                            manifestFileName: 'appsscript',
                            description: 'Auto-deploy mobile layout fix'
                        }
                    })
                });
                const resJson = await updateRes.json();
                console.log("Updated", dep.deploymentId, resJson.deploymentConfig?.versionNumber === version.versionNumber ? "SUCCESS" : resJson);
            }
        }
    }
}

updateAllDeployments();
