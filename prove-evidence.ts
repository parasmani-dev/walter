import axios from 'axios';
import "dotenv/config";

const BASE_URL = 'http://localhost:3000';
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function runScan(url: string, description: string) {
    console.log(`\n\n==================================================`);
    console.log(`[EVIDENCE RUN]: ${description}`);
    console.log(`Target: ${url}`);
    console.log(`==================================================`);
    
    try {
        console.log(`> POST /scan`);
        const startRes = await axios.post(`${BASE_URL}/scan`, { repositoryUrl: url });
        const jobId = startRes.data.jobId;
        console.log(`  Job ID: ${jobId}`);
        
        let status = 'RUNNING';
        let lastProgress = '';
        
        while (status === 'RUNNING' || status === 'PENDING') {
            await delay(2000);
            const pollRes = await axios.get(`${BASE_URL}/scan/${jobId}`);
            status = pollRes.data.status;
            if (pollRes.data.progress && pollRes.data.progress !== lastProgress) {
                lastProgress = pollRes.data.progress;
                console.log(`  [PROGRESS]: ${lastProgress}`);
            }
            
            if (status === 'COMPLETED') {
                console.log(`\n[RESULT SUCCESS]`);
                console.log(JSON.stringify(pollRes.data.result, null, 2));
                return pollRes.data.result;
            } else if (status === 'FAILED') {
                console.log(`\n[RESULT FAILED]`);
                console.log(`Error Type: ${pollRes.data.errorType}`);
                console.log(`Error Message: ${pollRes.data.error}`);
                return pollRes.data;
            }
        }
    } catch (e: any) {
        console.error(`\n[EXCEPTION CAUGHT]`);
        console.error(e.response?.data || e.message);
    }
}

async function main() {
    // 2. FR-100 >5000 files (Oversized Repo)
    await runScan('https://github.com/microsoft/TypeScript.git', 'FR-100 OVERSIZED REPO TEST (>5000 files)');
    
    // 2. FR-100 HVT detection (Repo with >2000 files but <5000 is tricky to find off the top of my head)
    // Let's use express as a medium-sized repo
    await runScan('https://github.com/expressjs/express.git', 'FR-100 HVT DETECTION TEST (Medium Repo)');
}

main().catch(console.error);
