// server.ts

// Import necessary modules
import express from 'express';
import { parseJDAI, generateQuestionsAI, evaluateCandidateAI } from './functions/aiFunctions';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Define routes
app.get('/', (req, res) => {
    res.send('Welcome to the Mosaic Wellness API!');
});

// AI functions
function parseJDAI(data: any) {
    // Updates: changed model version
    const model = 'gemini-1.5-flash';
    // Processing Logic...
}

function generateQuestionsAI(questions: any) {
    // Updates: changed model version
    const model = 'gemini-1.5-flash';
    // Processing Logic...
}

function evaluateCandidateAI(candidate: any) {
    // Updates: changed model version
    const model = 'gemini-1.5-flash';
    // Processing Logic...
}

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
