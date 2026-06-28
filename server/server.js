const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(express.json());
app.get( "/" , (req , res) => {
    res.send(`<h1> Welcome to Gossips API </h1>`);
})

const PORT = process.env.PORT;

app.listen(PORT , () => {
    console.log(`Server Running on port ${PORT}`);
})