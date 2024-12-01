
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
	
	productId: {type: String, required: true},
	name:{type: String, required: true},
	product_model: {type:String},
	price: {type:Number, required: true},
	stockIn: {type:Number, default:0},
	stockInTime: {type:Date, default:null},
	stockOut: {type:Number, default:0},
	stockOutTime: {type:Date, default:null},
	createTime: {type: Date},
});

productSchema.pre('save', function(next){
	var now = new Date();
	this.createTime = now;
	next();
});
module.exports = mongoose.model('Product',productSchema);