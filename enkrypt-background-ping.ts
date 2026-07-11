import axios from "axios";
import fs from "fs";
import "dotenv/config";

const logFile = "enkrypt_ping_log.txt";

async function pingEnkrypt() {
    const timestamp = new Date().toISOString();
    const startTime = performance.now();
    try {
        const response = await axios.post("https://api.enkryptai.com/guardrails/detect", {
            text: "test",
            detectors: {
                "policy_violation": {
                    "enabled": true,
                    "policy_text": "test"
                }
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "apikey": process.env.ENKRYPT_API_KEY
            },
            timeout: 120000 // 2 min wait
        });
        
        const latency = (performance.now() - startTime).toFixed(2);
        const log = `[${timestamp}] SUCCESS | Latency: ${latency}ms | Status: ${response.status} | Details: ${JSON.stringify(response.data?.details?.policy_violation || {})}\n`;
        fs.appendFileSync(logFile, log);
        console.log(log.trim());
    } catch (e: any) {
        const latency = (performance.now() - startTime).toFixed(2);
        let errorMsg = e.message;
        if (e.response) {
            errorMsg = `Status ${e.response.status} - ${JSON.stringify(e.response.data)}`;
        }
        const log = `[${timestamp}] FAIL | Latency: ${latency}ms | Error: ${errorMsg}\n`;
        fs.appendFileSync(logFile, log);
        console.log(log.trim());
    }
}

// Initial ping
pingEnkrypt();

// Schedule every 30 minutes (1800000 ms)
setInterval(pingEnkrypt, 1800000);
