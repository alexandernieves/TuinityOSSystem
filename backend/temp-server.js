const express = require('express');
const app = express();
const port = 8002;

app.get('/', (req, res) => {
  res.send('Hello from temporary server');
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
