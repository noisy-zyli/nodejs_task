
const Product = require('../models/product');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const pdfMake = require('pdfmake');
const path = require('path');
const fs = require('fs');
const app = require('../app');

//add
exports.addProduct = async function(req, res){
	try{
		const product = new Product(req.body); 
		await product.save();
		
		if (req.body.stockIn && req.body.stockIn > 0) {
            const message = {
                productId: product.productId,
                name: product.name,
                stockIn: req.body.stockIn,
                timestamp: new Date(),
            };
			
			const redisPublisher = app.redisPublisher;
			//console.log(app);
			//console.log(redisPublisher);  // 检查输出
			if (!redisPublisher || typeof redisPublisher.publish !== 'function') {
                throw new Error('Redis Publisher is not properly initialized');
            }
            // 将消息发布到 Redis 频道
            await redisPublisher.publish('product_stockIn', JSON.stringify(message));
            console.log('Published message to Redis:', message);
        }
		res.json({status:200,message:'product added and notice send to redis'});
	}catch(error){
		console.error('Error adding product:', error);
		res.status(500).json({message: 'product add failed or notice send failed'});
	}
};

//delete
exports.deleteProduct = async function(req, res) {
    try {
        // 异步删除记录
		console.log(req.query);
        const result = await Product.deleteOne({_id: req.query.id});
		if(result.deletedCount == 0) return res.status(404).json({ message: 'Product not found' });
        return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err);
        return res.status(500).json({ message: 'Failed to delete product' });
    }
};

exports.updateProduct = async function(req, res){
	try{
		id = req.body.id;
		const updateData = {
		  name: req.body.name,
		  product_model: req.body.product_model,
		  price: req.body.price,
		  stockIn: req.body.stockIn,
		  stockInTime: req.body.stockInTime,
		  stockOut: req.body.stockOut,
		  stockOutTime: req.body.stockOutTime
		};
		console.log(updateData)
		const result = await Product.findByIdAndUpdate(id, updateData, {new:true});
		if(!result) return res.status(404).json({ message: 'Product not found' });
		return res.status(200).json({ message: 'product update successfully' });
	}catch(err){
		console.error('Error updating product:', err);
        return res.status(500).json({ message: 'Failed to update product' });
	}
};

exports.listProduct = async function(req, res){
	console.log(req.query);
	const page = parseInt(req.query.page) || 1;
	const limit = parseInt(req.query.limit) || 10;
	try{
		const result = await Product.find()
						.skip((page-1)*limit)
						.limit(limit);
		const total = await Product.countDocuments();
		res.json({ status: 200, data: result, total, page, pages: Math.ceil(total / limit) });
		} catch (error) {
			res.status(500).json({ success: false, message: 'Error fetching products', error });
		}
};


aggregation = async function(){
	const summary = await Product.aggregate([
            {
                // 按照 编号 和 价格 分组
                $group: {
                    _id: { productId: '$productId', price: '$price' },
                    name: { $first: '$name' }, // 取分组内第一个商品名称
                    product_model: { $first: '$product_model' }, // 取分组内第一个型号
                    totalStockIn: { $sum: '$stockIn' }, // 累计入库数量
                    totalStockOut: { $sum: '$stockOut' }, // 累计出库数量
                },
            },
            {
                // 计算库存
                $addFields: {
                    stock: { $subtract: ['$totalStockIn', '$totalStockOut'] },
                },
            },
            {
                // 格式化输出字段
                $project: {
                    productId: '$_id.productId',
                    price: '$_id.price',
                    name: 1,
                    product_model: 1,
                    stock: 1,
                    _id: 0, // 不返回内部 _id 字段
                },
            },
        ]);
	return summary;
}
exports.getSummary = async function(req, res) {
    try {
        const summary = await aggregation();

        res.json({ status: 200, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error generating summary', error });
    }
};

exports.exportSummaryToExcel = async function(req, res){
	try{
		const summary = await aggregation();
		//console.log(summary);
		const worksheetData = summary.map(item => ({
            商品编号: item.productId,
            名称: item.name,
            型号: item.product_model,
            单价: item.price,
            库存: item.stock,
        }));
		//console.log('map重构');
		const workbook = XLSX.utils.book_new();
		const worksheet = XLSX.utils.json_to_sheet(worksheetData);
		XLSX.utils.book_append_sheet(workbook,worksheet,'商品出入库汇总表');
		//console.log('创建工作表');
		
		const filePath = path.join(__dirname, '../source_tmp/summary.xlsx');
		XLSX.writeFile(workbook,filePath);
		//console.log('写入本地');
		
		res.setHeader('Content-Disposition', 'attachment; filename=summary.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
		//console.log('设置请求头');
		
		const fileStream = fs.createReadStream(filePath);
		fileStream.pipe(res);
		//console.log('输出');
		
		fileStream.on('close', function(){
			fs.unlinkSync(filePath);
		});
	}catch(err){
		console.log('err:',err);
		res.status(500).json({message:'failed to export excel'});
	}
};

exports.exportSummaryToPDF = async function(req, res){
	try{
		const summary = await aggregation();
		
		const tableData = summary.map(item => [
            item.productId,  // 商品编号
            item.name,       // 名称
            item.product_model,      // 型号
            item.price,      // 单价
            item.stock,      // 库存
        ]);
		
		// 设置 PDF 文档的结构
		const fonts = {
            Roboto: {
                normal: './assets/fonts/SourceHanSansSC-VF.ttf',
                bold: './assets/fonts/SourceHanSansSC-VF.ttf',
                italics: './assets/fonts/SourceHanSansSC-VF.ttf',
                bolditalics: './assets/fonts/SourceHanSansSC-VF.ttf',
            },
        };
        const printer = new pdfMake(fonts);
		
        const documentDefinition = {
            content: [
                { text: '商品出入库汇总统计', style: 'header' },
                {
                    style: 'tableExample',
                    table: {
                        headerRows: 1,
                        body: [
                            ['商品编号', '名称', '型号', '单价', '汇总库存'],  // 表头
                            ...tableData,  // 表格内容
                        ],
                    },
                },
            ],
            styles: {
                header: {
                    fontSize: 18,
                    bold: true,
                    alignment: 'center',
                    margin: [0, 0, 0, 20],
                },
                tableExample: {
                    margin: [0, 5, 0, 15],
					alignment: 'center',
                },
            },
        };
		
		const pdfDoc = printer.createPdfKitDocument(documentDefinition);
        const filePath = path.join(__dirname, '../source_tmp/summary.pdf');
		console.log('设置');
        // 保存 PDF 文件到临时路径
        pdfDoc.pipe(fs.createWriteStream(filePath));
        pdfDoc.end();
		//console.log('保存文件');
		
		res.setHeader('Content-Disposition', 'attachment; filename=summary.pdf');
		res.setHeader('Content-Type', 'application/pdf');
		//console.log('设置请求头');
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
		//console.log('传输完成');
		fileStream.on('close', () => {
			fs.unlinkSync(filePath);
		});
	}catch(err){
		console.error('Error exporting summary to PDF:', err);
        res.status(500).json({ success: false, message: 'Failed to export to PDF', err });
    }
};