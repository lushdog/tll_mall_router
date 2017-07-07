var express = require('express');
var router = express.Router();
var crypto = require('crypto');//给密码加密的包
var mysql = require('mysql');


var pool = mysql.createPool({
  host:'localhost',
  user:'root',
  password:'root',
  database:'shop'
})

//注册
router.post('/reg',function(req,res,next){
    var pass = req.param('password')
    var shasum = crypto.createHash('sha1')//密码加密
    shasum.update(pass)
    var password = shasum.digest('hex')
    var new_user = {
        username:req.param('username'),
        password:password
    }
    pool.getConnection(function(err,connection){
        var str = `insert into users (username,password) values ('${new_user.username}','${new_user.password}')`
        var str2 = `select * from users where username='${new_user.username}'`
        connection.query(str2,function(error,results,fields){
            // connection.release()
            if(error){
                res.send(error)
                connection.release()
                return
            }
            if(results.length>=1){
                res.send({err:'用户名被占用'})
                connection.release()
                return
            }
            connection.query(str,function(error,results,fields){
                connection.release()
                if(error){
                    res.send({msg:error})
                    return
                }
                res.send(results)
            })
        })
    })
})
//登陆
router.post('/log',function(req,res,next){
    var pass = req.param('password')
    var shasum = crypto.createHash('sha1')//密码加密
    shasum.update(pass)
    var password = shasum.digest('hex')
    var log_user = {
        username:req.param('username'),
        password:password,
    }
    var str = `select * from users where username='${log_user.username}'`
    pool.getConnection(function(err,connection){
        connection.query(str,function(error,results,fields){
            connection.release()
            if(results.length==0){
                res.send({msg:'没有此用户'})
            }else if(results[0].password!=log_user.password){
                res.send({msg:'密码错误'})
            }else{
                res.send({msg:true,id:results[0].Id})//登录完返回用户在数据库的Id编号
            }
        })
    })
})
//轮播图
router.get('/slide',function(req,res,next){
    var str = `select * from slidepic`
    pool.getConnection(function(err,connection){
        connection.query(str,function(error,results,fields){
            connection.release()
            if(error){
                res.send(error)
                return
            }
            res.send(results)
        })
    })
})
//添加宝贝
router.post('/addItem',function(req,res,next){
    var new_pro = {
        price: req.param('price'),
        markprice: req.param('markprice'),
        palace: req.param('palace'),
        pic: req.param('pic'),
        tit: req.param('tit'),
    }
    var str = `insert into product (market_price,price,title,place,img) values ('${new_pro.markprice}','${new_pro.price}','${new_pro.tit}','${new_pro.palace}','${new_pro.pic}')`
    pool.getConnection(function(err,connection){
        connection.query(str,function(error,results,fields){
            connection.release()
            res.send({msg:'success'})
        })

    })
})
//加载列表
router.post('/listItem',function(req,res,next){
    var page  = {
        page_size:req.param('pageSize'),//每次查询发送的商品个数
        last_id:req.param('lastId') //上次请求的最后一个商品Id
    }
    var str = `select * from product where id>${page.last_id} limit ${page.page_size}`
    pool.getConnection(function(err,connection){
        connection.query(str,function(error,results,fields){
            connection.release()
            res.send(results)
        })
    })
})
//读取个人信息
router.post('/profile',function(req,res,next){
    let id = req.param('id')
    var str = `select * from users where Id=${id}`
    pool.getConnection(function(err,connection){
        connection.query(str,function(err,results,fields){
            connection.release()
            delete results[0].password //发送数据前删除密码
            res.send(results)
        })
    })
})
//修改信息
router.post('/upinfo',function(req,res,next){
    let user_info = {
        username:req.param('username'),
        nick_name:req.param('nick_name'),
        phone:req.param('phone'),
        age:req.param('age'),
        degree:req.param('degree'),
        uid:req.param('uid')
    }
    var str = `update users set username='${user_info.username}',nick_name='${user_info.nick_name}',`
    str+=`phone='${user_info.phone}',age='${user_info.age}',degree='${user_info.degree}' where Id='${user_info.uid}'`
    pool.getConnection(function(err,connection){
        connection.query(str,function(err,results,fields){
            connection.release()
            res.send({msg:true})
        })
    })
})
//添加收藏
router.post('/addlike',function(req,res,next){
    let user_like = {
        user_id:req.param('user_id'),
        pro_id:req.param('pro_id')
    }
    var str = `insert into favs (user_id,pro_id) values ('${user_like.user_id}','${user_like.pro_id}')`
    var str2 = `select * from favs where user_id=${user_like.user_id} and pro_id=${user_like.pro_id}`
    pool.getConnection(function(err,connection){
        connection.query(str2,function(err,results,fields){
            if(results.length>=1){
                res.send({err:'重复'})//添加前查询是否已经收藏过了
                connection.release()
                return
            }
            connection.query(str,function(err,results,fields){
                connection.release()
                res.send({msg:true})
            })
        })

    })
})
//删除收藏
router.post('/delelike',function(req,res,next){
    let dele_like = {
        user_id:req.param('user_id'),
        pro_id:req.param('pro_id')
    }
    var str = `delete from favs where user_id=${dele_like.user_id} and pro_id=${dele_like.pro_id}`
    pool.getConnection(function(err,connection){
        connection.query(str,function(err,results,fields){
            res.send({msg:true})
        })
    })
})
//查询收藏
router.post('/likenum',function(req,res,next){
    let user_id = req.param('user_id')
    var str = `select * from favs where user_id=${user_id}`
    pool.getConnection(function(err,connection){
        connection.query(str,function(err,results,fields){
            res.send(results)
        })
    })
})
//商品详情
router.post('/details',function(req,res,next){
    var item_id = req.param('item_id')
    var str = `select * from product where Id=${item_id}`
    pool.getConnection(function(err,connection){
        connection.query(str,function(error,results,fields){
            connection.release()
            res.send(results)
        })
    })
})
//订单
router.post('/order',function(req,res,next){
    var order = {
        uid:req.param('uid'),
        pro_id:req.param('pro_id'),
        others:req.param('others'),
        amounts:req.param('amounts'),
        size:req.param('size'),
        max_num:req.param('max_num')
    }
    var str = `insert into orders (user_id,pro_id,others,amounts,size) values ('${order.uid}'`
    str+=`,'${order.pro_id}','${order.others}','${order.amounts}','${order.size}')`
    var str2 = `update product set amts='${order.max_num-order.amounts}' where Id='${order.pro_id}'`
    pool.getConnection(function(err,connection){
        connection.query(str,function(err,results,fields){
            res.send({msg:true})
            connection.query(str2,function(){//添加订单时数据库商品表的库存量同时减少！！
                connection.release()
            })
        })
    })
})
//查询收藏的宝贝详情
router.post('/loadfav',function(req,res,next){
    let user_id = req.param('uid')
    var str = `select product.* from favs,product where favs.pro_id = product.Id and favs.user_id = ${user_id}`//查询两个表
    pool.getConnection(function(err,connection){
        connection.query(str,function(err,results,fields){
            connection.release()
            res.send(results)
        })
    })
})




module.exports = router;