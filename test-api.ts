import axios from "axios";

async function pollJob(jobId: string) {
  while (true) {
    const res = await axios.get(`http://localhost:3000/scan/${jobId}`);
    if (res.data.status === "COMPLETED" || res.data.status === "FAILED") {
      return res.data;
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function runTests() {
  console.log("Starting tests...");

  // 1. Invalid URL
  console.log("\n--- Testing INVALID_URL ---");
  try {
    const res1 = await axios.post("http://localhost:3000/scan", { repositoryUrl: "http://github.com/nonexistent/repo12345.git" });
    const result1 = await pollJob(res1.data.jobId);
    console.log("Result:", result1.errorType);
  } catch (e: any) {
    console.log("Error:", e.response?.data || e.message);
  }

  // 2. Private Repo
  console.log("\n--- Testing PRIVATE_REPO ---");
  try {
    const res2 = await axios.post("http://localhost:3000/scan", { repositoryUrl: "https://github.com/github/private-repo.git" });
    const result2 = await pollJob(res2.data.jobId);
    console.log("Result:", result2.errorType);
  } catch (e: any) {
    console.log("Error:", e.response?.data || e.message);
  }

  // 3. Oversized Repo (TypeScript repo has > 5000 files)
  console.log("\n--- Testing OVERSIZED_REPO ---");
  try {
    const res3 = await axios.post("http://localhost:3000/scan", { repositoryUrl: "https://github.com/microsoft/TypeScript.git" });
    const result3 = await pollJob(res3.data.jobId);
    console.log("Result:", result3.errorType);
  } catch (e: any) {
    console.log("Error:", e.response?.data || e.message);
  }

  console.log("\n--- Testing HAPPY PATH ---");
  try {
    const res4 = await axios.post("http://localhost:3000/scan", { repositoryUrl: "https://github.com/auth0/express-jwt.git" });
    const result4 = await pollJob(res4.data.jobId);
    console.log("Happy Path Score:", result4.result?.jsonReport?.securityScore);
    console.log("Happy Path Grade:", result4.result?.jsonReport?.letterGrade);
  } catch (e: any) {
    console.log("Error:", e.response?.data || e.message);
  }
}

runTests().catch(console.error);
