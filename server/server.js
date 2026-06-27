const express = require('express');

const app = express();
app.get('/' , (req , res) => {
    res.send(`<h1> The Server is running </h1>`);
})

app.listen(5000 , () => {
    console.log("Express Working.Server running at localhost:5000");
})