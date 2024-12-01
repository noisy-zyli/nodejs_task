const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const Redis = require('ioredis');
const config = require('./config');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const product_route = require('./route');
const handleRedisMessage = require('./message/productMessage');

const redisClient = {
	host: config.redis.host,
	port: config.redis.port,
	password: config.redis.password,
	db: 0
};


const app = express();

app.use(session({
	store: new RedisStore(redisClient),
	secret: config.session.secret,
	resave: false,  //请求会话修改时才保存会话
	saveUninitialized: false,  //是否保存未初始化的会话。设置数据后保存
	cookie: {
		secure: false,
		maxAge: config.session.cookieMaxAge //cookie有效期
	}
}));

app.get('/', function(req, res){
	const queryParams = req.query;
	if(Object.keys(queryParams).length > 0){
		req.session.params = queryParams;
	}
	
	res.json({
		message: 'Session:',
		session: req.session.params || {}
	});
});


app.use(bodyParser.json());
//connect mongoose
mongoose
	.connect(config.mongoURI,{ useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/product',product_route);


//redis sentinel

const masterConfig = {
    sentinels: config.sentinels,
    name: 'mymaster', // Sentinel 配置的主节点名称
	role: 'master',
};

//const slaveConfig = {
    //sentinels: config.sentinels,
   // name: 'mymaster', // Sentinel 配置的主节点名称
	//role: 'slave',
//};

const redisPublisher = new Redis(masterConfig);
const redisSubscriber = new Redis(masterConfig);

redisPublisher.on('connect', async () => {
    //const info = await redisPublisher.info();
    console.log('Connected to Redis Master via Sentinel:');
});
redisPublisher.on('error', (err) => {
    console.error('Redis connection error:', err);
});

redisSubscriber.on('connect', async () => {
    //const info = await redisSubscriber.info();
    console.log('Connected to Redis slave via Sentinel:');
});
redisSubscriber.on('error', (err) => {
    console.error('Redis connection error:', err);
});

//订阅消息，能否耦合开？放到别处去？
redisSubscriber.subscribe('product_stockIn', (err) => {
    if (err) {
        console.error('Failed to subscribe to Redis channel:', err);
    } else {
        console.log('Subscribed to Redis channel: product_stockIn');
    }
});

redisSubscriber.on('message', async (channel, message) => {
	console.log('sub 回调');
    await handleRedisMessage(channel, message);  // 调用 message.js 中的处理函数
});

app.listen(3000,function(){
	console.log('app is running at port 3000');
})


exports.redisSubscriber = redisSubscriber;
exports.redisPublisher = redisPublisher;