

const express = require('express');
const productController = require('./controller/productController');

const router = express.Router();

router.post('/add', productController.addProduct);
router.post('/delete', productController.deleteProduct);
router.post('/update', productController.updateProduct);
router.get('/listProduct', productController.listProduct);
router.get('/summary', productController.getSummary);
router.get('/exportSummaryToExcel', productController.exportSummaryToExcel);
router.get('/exportSummaryToPDF', productController.exportSummaryToPDF);
module.exports = router;