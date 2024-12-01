module.exports = {
	redis: {
		host: '127.0.0.1',
		port: 6379,
		password: '',
	},
	session: {
		secret: 'my_webapp',
		cookieMaxAge: 600000, //cookie有效期：10mins
	},
	mongoURI: 'mongodb://127.0.0.1:27017/testnpm',
	
	email:{
		user: '1031928870@qq.com',
		passcode: 'zotjcqxleoxgbffj'
	},
	sentinels:[
        { host: '127.0.0.1', port: 26379 },
        { host: '127.0.0.1', port: 26479 },
        { host: '127.0.0.1', port: 26579 },
    ],
};