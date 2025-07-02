const express = require("express");
const mongoose = require("mongoose");
const path = require('path');
const productRoute = require("./route/productRoute");

const app = express();

app.use('/api', productRoute);
app.use(express.static(path.join(__dirname, 'views')));


mongoose.connect("mongodb://localhost:27017/product_filter", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("MongoDB connection error:", err);
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
