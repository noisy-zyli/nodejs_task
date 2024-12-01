
const nodemailer = require('nodemailer');
const config = require('../config');




// 配置邮件发送
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com', // QQ 邮箱 SMTP 服务器地址
    port: 465,           	
    secure: true,       
    auth: {
        user: config.email.user,
        pass: config.email.passcode,
    },
});



// 消费 Redis 消息
async function handleRedisMessage(channel, message) {
    try {
		console.log('receive message');
        if (channel === 'product_stockIn') {
            const parsedMessage = JSON.parse(message);
            console.log('Received message from Redis:', parsedMessage);

            // 发送邮件通知
            const mailOptions = {
                from: config.email.user,
                to: 'packardzhiyu@gmail.com',
                subject: 'Product StockIn Notification',
                text: `Product ${parsedMessage.name} (ID: ${parsedMessage.productId}) has been added to stock. Quantity: ${parsedMessage.stockIn}. Timestamp: ${parsedMessage.timestamp}`,
            };

            await transporter.sendMail(mailOptions);
            console.log('Email sent successfully for product:', parsedMessage.name);
        }
    } catch (error) {
        console.error('Error processing Redis message:', error);
    }
};

module.exports = handleRedisMessage;
