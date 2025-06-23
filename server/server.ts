import express from "express";
import cors from "cors";
import path from "path";
import { exec } from "child_process";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
	res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Endpoint to trigger pnpm run test:multi
app.post("/api/trigger-test", (req, res) => {
  console.log("Triggering pnpm run test:multi...");

  exec("pnpm run test:multi", { cwd: path.join(__dirname, "..") }, (error, stdout, stderr) => {
    if (error) {
      console.error("Error executing test:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        stderr: stderr
      });
    }

    console.log("Test completed successfully");
    res.json({
      success: true,
      stdout: stdout,
      stderr: stderr
    });
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});