const express = require('express');

const app = express();
const PORT = 3000;

const VERSION = process.env.VERSION || "UNKNOWN";
    
app.get('/status', (req, res) => {
    res.json({
        status: "Application is running successfully",
        version: VERSION
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});