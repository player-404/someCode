const http = require('http');
const slice = Array.prototype.slice;

class Express {
    constructor() {
        this.router = {
            all: [],
            get: [],
            post: []
        }
    }

    register(path) {
         /* 
            arguments是每个函数在运行的时候自动获得的一个近似数组的对象
            （传入函数的参数从0开始按数字排列，而且有length）。比如当你 func('a', 'b', 'c') 的时候，
            func里面获得的arguments[0] 是 'a'，arguments[1] 是 'b'，依次类推。
             但问题在于这个arguments对象其实并不是Array，
            所以没有slice方法。Array.prototype.slice.call( )可以间接对其实现slice的效果，
            而且返回的结果是真正的Array。
            */
        const info = {};
        // 判断中间件是否传入路径
        if (typeof (path) === 'string') {
            info.path = path;
            info.arg = slice.call(arguments, 1);
        } else {
            // 没有传入路径， 则该中间件每次都会只执行，则将参数从第0位开始切割成数组进而判断有几个中间件
            info.path = '/';
            info.arg = slice.call(arguments, 0);
        }
        return info;
    }

    use() {
        const info = this.register(...arguments);
        /*
        正常方法传入数组 / 对象 会被当做一个函数 使用 apply 可以将 数组 拆分当作多个参数传入
        不过 es6 的扩展运运算符 在此处显然更方便些 
        const info = this.register.apply(this, arguments); 
        */
    //    console.log(info);
       this.router.all.push(info);
    }

    post() {
        const info = this.register(...arguments);
        this.router.post.push(info);
    }

    get() {
        const info = this.register(...arguments);
        this.router.get.push(info);
    }

    listen(...arg) {
        const server = http.createServer(this.callback());
        server.listen(...arg, () => {
            console.log('服务已启动');
        });
    }
    // createServer 回调函数
    callback() {
        return (req, res) => { 
            console.log(this.router);   
            //req.json 方法
            res.json = (data) => {
                res.setHeader('Content-type', 'application/json');
                res.end(JSON.stringify(data));
            }

            const url = req.url;
            const method = req.method.toLowerCase();
            //获取要执行的中间件
            let result = [];
            // use 中间件 总是会执行的
            result = result.concat(this.router.all);
            // 根据只用的方法 添加 响应的中间件
            result = result.concat(this.router[method]); 
            //所有中间件函数已经添加到 result 数组中 接下来 则更具响应的路由(path)决定要执行哪些中间件
            const stack = this.match(result, url);
            // 执行匹配到的中间件函数
            this.handle(req, res, stack);
        }
        
    }
    // 匹配需要执行的中间件
    match(result, url) {
        console.log('result =>', result);
        console.log('url =>', url);
        
        // 匹配到的中间件函数
        let stack = [];

        if (url === '/favicon.ico') {
            return stack;
        }

        result.forEach((item) => {
            // 匹配路由
            if (url.indexOf(item.path) === 0) {
                stack = stack.concat(item.arg);
            }
        })

        return stack;
    }
    // express 中间件原理实现
    handle(req, res, stack) {
        const next = () => {
            const middleWare = stack.shift();
            if (middleWare) {
                // use 中调用next则会调用此处的next方法
                middleWare(req, res, next);
            }
        }
        next();
    }
}
// 创建Express实例
function express() {
    return new Express();
}

module.exports = express;