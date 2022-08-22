const { Router } = require('express');
var express = require('express');
var router = express.Router();
var adminHelper = require('../helpers/adminHelpers')
const categoryModel = require('../models/categoryModel');
const productModel = require('../models/productModel');
const subCategoryModel = require('../models/productModel')
/* GET home page. */

function isLogin(req, res, next) {
    if (req.session.isAthenticated) {
        next()
    } else {
        console.log(req.session.isAthenticated + "asdfsd");
        res.redirect('/admin/login')
    }
}
const login = (req, res, next) => {
    if (req.session.isAthenticated) {
        res.redirect('/admin')
    } else {
        next()
    }
}

const otpSent = (req, res, next) => {
    if (req.session.otpsent) {
        next()
    } else {
        res.redirect('/admin')
    }
}


router.get('/', isLogin, (req, res) => {
    res.render('admin/admin-home', { admin: true })
})

router.get('/login', (req, res) => {
    let aloginvalid = req.session.alogin
    res.render('admin/admin-login', { aloginvalid })
})

router.post('/login', login, (req, res) => {
    adminHelper.doLogin(req.body).then((response) => {
        if (response.status) {
            req.session.admin = response.admin
            req.session.isAthenticated = true
            res.redirect('/admin')
        } else {
            req.session.alogin = "invalid login details"
            res.redirect('/admin/login')
        }
    })
})

router.post('/otplogin', (req, res) => {
    adminHelper.checkMobile(req.body.mobile).then((status) => {
        console.log(status)
        if (!status.check) {
            req.session.exist = true
            res.redirect('/admin/login')
        } else {
            adminHelper.sendOtp(req.body.mobile).then((verification => {
                req.session.exist = false
                req.session.mobile = req.body.mobile
                req.session.admin = req.body
                req.session.otpsent = true
                res.redirect('/admin/otplogin')
            }))
        }
    })
})

router.get('/otplogin', login, otpSent, (req, res) => {
    var mobile = req.session.mobile
    var otpCheck = true
    otpCheck = req.session.wrongOtp
    res.render('admin/otplogin', { mobile, otpCheck })
})

router.post('/otpverify', (req, res) => {
    adminHelper.verifyOtp(req.body.otp, req.body.mobile).then((check) => {
        if (check === 'approved') {
            req.session.isAthenticated = true
            res.redirect('/admin')
        } else {
            req.session.wrongOtp = true
            res.redirect('/admin/otplogin')
        }
    })
})

router.get('/users', isLogin, (req, res) => {
    adminHelper.getAllUsers().then((users) => {
        res.render('admin/manage-users', { users, admin: true })
    })
})

router.get('/change-status/:id', isLogin, (req, res, next) => {
    adminHelper.changeStatus(req.params.id).then((response) => {
        res.redirect('/admin/users')
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})






router.get('/view-category', isLogin, async (req, res) => {
    let categories = await categoryModel.find({}).lean()
    let subCategories = await subCategoryModel.find({}).lean()
    res.render('admin/view-category', { categories, subCategories, admin: true })

})

router.get('/add-category', isLogin, (req, res) => {
    let exist = req.session.categoryexist
    req.session.categoryexist = null
    res.render('admin/add-category', { exist, admin: true })
})

router.post('/add-category', isLogin, (req, res) => {
    adminHelper.addCategory(req.body).then((response) => {
        console.log(response)
        if (response.check) {
            req.session.categoryexist = true
            res.redirect('/admin/add-category')
        } else {
            res.redirect('/admin/view-category')
        }
    })
})

router.get('/editcategory/:id', isLogin, (req, res, next) => {
    adminHelper.getCategory(req.params.id).then((response) => {
        res.render('admin/edit-category', { response, admin: true })
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})

router.post('/edit-category', isLogin, (req, res) => {
    adminHelper.editCategory(req.body).then((response) => {
        res.redirect('/admin/view-category')
    })
})

router.get('/deletecategory/:id', isLogin, (req, res, next) => {

    adminHelper.deleteCategory(req.params.id).then((response) => {
        res.redirect('/admin/view-category')
    }).catch((err) => {
        err.admin = true
        next(err)
    })

})

router.get('/view-products', isLogin, (req, res) => {
    adminHelper.getAllProducts().then((products) => {
        res.render('admin/view-products', { products, admin: true })
    })
})

router.get('/add-products', isLogin, async (req, res) => {
    let categories = await categoryModel.find({}).lean()
    res.render('admin/add-product', { categories, admin: true })
})


router.post('/add-product', isLogin, (req, res) => {
    adminHelper.addProduct(req.body).then((response) => {
        if (response.exist) {
            req.session.productExist = true
            res.redirect('/admin/add-products')
        } else {
            let id = response.data._id.toString();
            console.log(id)
            req.files.image1.mv('public/images/product-image/' + id + '1.jpg', (err, done) => {
                if (err) { console.log(err) }
            })
            req.files.image2.mv('public/images/product-image/' + id + '2.jpg', (err, done) => {
                if (err) { console.log(err) }
            })
            req.files.image3.mv('public/images/product-image/' + id + '3.jpg', (err, done) => {
                if (err) { console.log(err) }
            })
            res.redirect('/admin/view-products')
        }
    })
})

router.get('/edit-product/:id', isLogin, async (req, res, next) => {
    try {
        let categories = await categoryModel.find({}).lean()
        let product = await productModel.findById(req.params.id).populate('categories').lean()
        res.render('admin/edit-product', { product, categories, admin: true })
    } catch (err) {
        err.admin = true
        next(err);
    }

})

router.post('/update-product', isLogin, (req, res) => {
    adminHelper.updateProduct(req.body).then((response) => {
        req.files.image1.mv('public/images/product-image/' + req.body.id + '1.jpg', (err, done) => {
            if (err) { console.log(err) }
        })
        req.files.image2.mv('public/images/product-image/' + req.body.id + '2.jpg', (err, done) => {
            if (err) { console.log(err) }
        })
        req.files.image3.mv('public/images/product-image/' + req.body.id + '3.jpg', (err, done) => {
            if (err) { console.log(err) }
        })
        res.redirect('/admin/view-products')
    })
})

router.get('/delete-product/:id', isLogin, (req, res, next) => {
    adminHelper.deleteProduct(req.params.id).then((response) => {
        res.redirect('/admin/view-products')
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})



router.get('/view-banners', isLogin, (req, res) => {
    adminHelper.getAllBanners().then((banners) => {
        res.render('admin/manage-banners', { banners, admin: true })
    })
})

router.get('/add-banner', isLogin, async (req, res) => {
    let product = await productModel.find({}).populate('categories').lean()
    let bannerExist = req.session.bannerExist
    req.session.bannerExist = null
    res.render('admin/add-banner', { product, bannerExist, admin: true })
})

router.post('/add-banner', isLogin, (req, res) => {
    adminHelper.addBanner(req.body).then((response) => {
        if (response.exist) {
            req.session.bannerExist = true
            res.redirect('/admin/add-banner')
        } else {
            req.files.image.mv('public/images/banner-image/' + response.data._id + '.jpg', (err, done) => {
                if (err) { console.log(err) }
                res.redirect('/admin/view-banners')
            })

        }
    })
})

router.get('/edit-banner/:id', isLogin, (req, res, next) => {
    adminHelper.getBanner(req.params.id).then((banner) => {
        res.render('admin/edit-banner', { banner, admin: true })
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})

router.post('/edit-banner', isLogin, (req, res) => {
    console.log(req.body)
    adminHelper.editBanner(req.body).then((response) => {
        req.files.image.mv('public/images/banner-image/' + req.body.id + '.jpg', (err, done) => {
            if (err) { console.log(err) }
        })
        res.redirect('/admin/view-banners')
    })
})

router.get('/delete-banner/:id', isLogin, (req, res, next) => {

    adminHelper.deleteBanner(req.params.id).then((response) => {
        res.redirect('/admin/view-banners')
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})

router.get('/view-coupons', isLogin, (req, res) => {
    let couponExist = req.session.couponExist
    req.session.couponExist = null
    adminHelper.getCoupons().then((coupon) => {
        res.render('admin/coupons', { coupon, couponExist, admin: true })
    })
})

router.post('/newCoupon', isLogin, (req, res) => {
    adminHelper.addCoupon(req.body).then((response) => {
        if (response.exist) {
            req.session.couponExist = true
        }
        res.redirect('/admin/view-coupons')
    })
})

router.post('/editCoupon/:id', isLogin, (req, res, next) => {

    adminHelper.editCoupon(req.body, req.params.id).then((data) => {
        res.redirect('/admin/view-coupons')

    }).catch((err) => {
        err.admin = true
        next(err)
    })
})

router.get('/orders', (req, res) => {
    adminHelper.getAllOrders().then(orders => {
        res.render('admin/orders', { orders, admin: true })
    })
})

router.get('/revenueChart',isLogin, (req, res) => {
    adminHelper.getAllOrders().then(orders => {
        res.json({orders})
    })
})

router.get('/getOrderCount',isLogin,(req,res)=>{
    adminHelper.getOrderCount().then(response =>{
        res.json({response})
    })
})

router.get('/deleteCoupon/:id', isLogin, (req, res, next) => {
    adminHelper.deleteCoupon(req.params.id).then((data) => {
        res.redirect('/admin/view-coupons')
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})


router.post('/changeShipping/:id', isLogin, (req, res, next) => {
    adminHelper.changeShipping(req.params.id, req.body).then((data) => {
        res.redirect('/admin/orders')
    }).catch((err) => {
        err.admin = true
        next(err)
    })
})

router.get('/signup', (req, res) => {
    res.render('admin/admin-signup')
})


router.post('/signup', (req, res) => {
    console.log(req.body)
    adminHelper.adminSignup(req.body).then((data) => {
        res.redirect('/admin')
    })
})

router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/admin/login')
})


module.exports = router;
