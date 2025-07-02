const express = require("express");
const multer = require("multer");
const router = express.Router();
const productController = require("../controller/productController");



const upload = multer({ dest: 'uploads/' });

router.post('/upload', upload.single('csv'), productController.uploadCSV);
router.get('/filters', productController.getFilters);
router.get('/grouped', productController.getGroupedProducts);


module.exports = router;