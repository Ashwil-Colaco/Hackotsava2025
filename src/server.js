import express from 'express';
import axios from 'axios';
import cors from 'cors';

const app = express();
const PORT = 3001;

// ⚙ CHANGE THIS to your actual n8n webhook URL
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook-test/test";

// Enable CORS for all origins (adjust in production)
app.use(cors());
app.use(express.json());

// Clean string function to remove unwanted characters
const cleanString = (str) => {
  return str
    .replace(/```json/g, '')   // remove opening code block with json
    .replace(/```/g, '')       // remove any closing code block
    .replace(/\\n/g, ' ')      // remove escaped newlines
    .replace(/\n/g, ' ')       // remove literal newlines
    .replace(/\\/g, '');       // remove stray backslashes
};


// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Proxy server is running' });
});

// Main proxy endpoint
app.post('/api/artifact', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    console.error('[Proxy] ❌ No message provided in request body');
    return res.status(400).json({ 
      error: "No 'message' field provided in the request body.",
      received: req.body 
    });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`[Proxy] 📨 New Request Received`);
  console.log(`[Proxy] 📝 OCR Text: "${message}"`);
  console.log(`[Proxy] 🔄 Forwarding to n8n: ${N8N_WEBHOOK_URL}`);
  console.log('='.repeat(60));

  try {
    const n8nResponse = await axios.post(
      N8N_WEBHOOK_URL,
      { message: message },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`\n[Proxy] ✅ Success! Response from n8n (Status: ${n8nResponse.status})`);
    
    // Clean the response data
    console.log(n8nResponse.data);
    let cleanedData = n8nResponse.data;
    
    // If the response has an 'output' field, clean it
    if (cleanedData && typeof cleanedData === 'object') {
      if (Array.isArray(cleanedData)) {
        cleanedData = cleanedData.map(item => {
          if (item.output && typeof item.output === 'string') {
            return { ...item, output: cleanString(item.output) };
          }
          return item;
        });
      } else if (cleanedData.output && typeof cleanedData.output === 'string') {
        cleanedData.output = cleanString(cleanedData.output);
      }
    }

    // Log only the cleaned response
    console.log('[Proxy] 🧹 Cleaned Response Data:');
    console.log(JSON.stringify(cleanedData, null, 2));
    console.log('='.repeat(60) + '\n');

    // Send cleaned n8n's response back to React frontend
    res.status(n8nResponse.status).json(cleanedData);

  } catch (error) {
    console.error(`\n[Proxy] ❌ Error communicating with n8n:`);
    console.error(`[Proxy] Error Message: ${error.message}`);

    let status = 500;
    let errorMessage = "Failed to communicate with n8n webhook.";
    let errorDetails = error.message;

    if (error.code === 'ECONNREFUSED') {
      errorMessage = "Could not connect to n8n. Is n8n running on the correct port?";
      errorDetails = `Connection refused to ${N8N_WEBHOOK_URL}`;
      status = 503;
      console.error(`[Proxy] 🔌 n8n appears to be offline or URL is incorrect`);
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "n8n webhook URL hostname not found.";
      errorDetails = `Host not found: ${N8N_WEBHOOK_URL}`;
      status = 503;
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = "Request to n8n timed out (15s).";
      status = 504;
    } else if (error.response) {
      status = error.response.status;
      errorMessage = `n8n returned error status ${error.response.status}`;
      errorDetails = error.response.data;
      
      console.error(`[Proxy] 📥 n8n Error Response (Status: ${error.response.status}):`);
      console.error(JSON.stringify(error.response.data, null, 2));
    }

    console.error('='.repeat(60) + '\n');

    res.status(status).json({
      error: errorMessage,
      details: errorDetails,
      n8n_webhook_url: N8N_WEBHOOK_URL,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 Node.js Proxy Server Started Successfully!`);
  console.log(`${'='.repeat(60)}`);
  console.log(`📍 Server listening on: http://0.0.0.0:${PORT}`);
  console.log(`📍 Local access: http://localhost:${PORT}`);
  console.log(`📍 Network access: http://localhost:${PORT}`);
  console.log(`🎯 Endpoint: POST /api/artifact`);
  console.log(`🔗 n8n Webhook: ${N8N_WEBHOOK_URL}`);
  console.log(`✅ Health check: GET /health`);
  console.log('='.repeat(60) + '\n');
});