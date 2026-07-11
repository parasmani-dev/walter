import { Router, Request, Response } from "express";
import { enqueueJob, getJobStatus } from '../services/jobQueue';

const router = Router();

router.post("/", (req: Request, res: Response): void => {
  const { repositoryUrl } = req.body;
  if (!repositoryUrl) {
    res.status(400).json({ error: "repositoryUrl is required" });
    return;
  }
  
  // Basic validation
  if (!repositoryUrl.startsWith("http")) {
    res.status(400).json({ error: "Invalid repository URL" });
    return;
  }

  const jobId = enqueueJob(repositoryUrl);
  res.status(202).json({ jobId, message: "Scan queued" });
});

router.get("/:jobId", (req: Request, res: Response): void => {
  const jobId = req.params.jobId as string;
  const job = getJobStatus(jobId);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.status(200).json(job);
});

export default router;

