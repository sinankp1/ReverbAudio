var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");
const UserModel = require("../models/userModel");
const catModel = require("../models/categoryModel");
const productModel = require("../models/productModel");
const userhelpers = require("../helpers/userhelpers");
const adminHelpers = require("../helpers/adminHelpers");
const bannerModel = require("../models/bannerModel");
const cartModel = require("../models/cartModel");
const { Router } = require("express");
var createError = require("http-errors");

const isLogin = (req, res, next) => {
  if (req.session.loggedin) {
    console.log("session ok");
    next();
  } else {
    res.redirect("/login");
  }
};
const login = (req, res, next) => {
  if (req.session.loggedin) {
    res.redirect("/");
  } else {
    next();
  }
};

const otpSent = (req, res, next) => {
  if (req.session.otpsent) {
    next();
  } else {
    res.redirect("/");
  }
};

/* GET users listing. */
router.get("/", async (req, res, next) => {
  let session = req.session;
  let product = await productModel.find({}).populate("categories").lean();
  let banners = await bannerModel.find({}).populate("product").lean();
  adminHelpers.getAllCategory().then((cats) => {
    res.render("user/index", { session, cats, product, banners, user: true });
  });
});

router.get("/login", login, (req, res) => {
  console.log(req.session.invalidLogin);
  let valid = req.session.invalidLogin;
  let active = req.session.active;
  req.session.invalidLogin = null;
  req.session.notActive = null;
  console.log(valid);
  res.header(
    "cache-control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0"
  );
  res.render("user/login", { valid, active });
});

router.post("/login", (req, res) => {
  userhelpers.userLogin(req.body).then((response) => {
    if (response.status) {
      req.session.currentuser = response.user;
      req.session.loggedin = true;
      res.redirect("/");
    } else {
      if (response.active === false) {
        req.session.notActive = true;
        res.redirect("/login");
      }
      if (response.status === false) {
        req.session.invalidLogin = true;
        res.redirect("/login");
      }
    }
  });
});

router.post("/otplogin", (req, res) => {
  userhelpers.checkMobile(req.body.mobile).then((status) => {
    console.log(status);
    if (!status.check) {
      req.session.exist = true;
      res.redirect("/login");
    } else {
      userhelpers.sendOtp(req.body.mobile).then((verification) => {
        req.session.exist = false;
        req.session.mobile = req.body.mobile;
        req.session.user = req.body;
        req.session.currentuser = status.user;
        req.session.otpsent = true;
        res.redirect("/otplogin");
      });
    }
  });
});

router.get("/otplogin", login, otpSent, (req, res) => {
  var mobile = req.session.mobile;
  otpCheck = req.session.wrongOtp;
  req.session.wrongOtp = null;
  res.render("user/otplogin", { mobile, otpCheck });
});

router.post("/otpverify", (req, res) => {
  userhelpers.verifyOtp(req.body.otp, req.body.mobile).then((check) => {
    if (check === "approved") {
      req.session.loggedin = true;
      res.redirect("/");
    } else {
      req.session.wrongOtp = true;
      res.redirect("/otplogin");
    }
  });
});

router.get("/signup", login, (req, res) => {
  let exist = false;
  exist = req.session.exist;
  req.session.exist = null;
  res.render("user/signup", { exist });
});

router.post("/signup", (req, res) => {
  userhelpers.userCheck(req.body.email).then((status) => {
    console.log(status);
    if (status.check) {
      req.session.exist = true;
      res.redirect("/signup");
    } else {
      userhelpers.sendOtp(req.body.mobile).then((verification) => {
        req.session.exist = false;
        req.session.mobile = req.body.mobile;
        req.session.user = req.body;
        req.session.otpsent = true;
        res.redirect("/otp");
      });
    }
  });
});

router.get("/otp", login, otpSent, (req, res) => {
  var mobile = req.session.mobile;
  otpCheck = req.session.otpcheck;
  req.session.otpcheck = null;
  res.render("user/otpsignup", { mobile, otpCheck });
});

router.post("/otp", (req, res) => {
  userhelpers.verifyOtp(req.body.otp, req.body.mobile).then((check) => {
    if (check === "approved") {
      req.session.otpcheck = false;
      userhelpers.userSave(req.session.user).then((data) => {
        req.session.currentuser = data;
        req.session.loggedin = true;
        res.redirect("/");
      });
    } else {
      req.session.otpcheck = true;
      res.redirect("/otp");
    }
  });
});

router.get("/product-details/:id", async (req, res, next) => {
  let session = req.session;
  try {
    let product = await productModel
      .findById(req.params.id)
      .populate("categories")
      .lean();
    adminHelpers.getAllCategory().then((cats) => {
      res.render("user/product-details", {
        session,
        cats,
        product,
        user: true,
      });
    });
  } catch (err) {
    next(err);
  }
});

router.post("/addToCart/:id", isLogin, (req, res, next) => {
  try {
    let userId = req.session.currentuser._id;
    let proId = req.params.id;
    userhelpers.addToCart(userId, proId).then((response) => {
      res.json({ response });
    });
  } catch (err) {
    next(err);
  }
});

router.get("/cart", isLogin, (req, res) => {
  let session = req.session;
  req.session.coupon = null;
  req.session.discount = null;
  userhelpers.getCartProducts(req.session.currentuser._id).then((response) => {
    if (response.notEmpty) {
      let cart = response.cart;
      userhelpers.getCoupons(req.session.currentuser._id).then((data) => {
        console.log(data);
        res.render("user/cart", { user: true, cart, session, response, data });
      });
    } else {
      res.render("user/cart", { user: true, session, response });
    }
  });
});

router.get("/cartCount", (req, res) => {
  userhelpers.cartCount(req.session.currentuser._id).then((response) => {
    res.json({ response });
  });
});

router.get("/wishlistCount", (req, res) => {
  userhelpers.wishlistCount(req.session.currentuser._id).then((response) => {
    res.json({ response });
  });
});

router.post("/quantityPlus/:id", isLogin, (req, res, next) => {
  try {
    userhelpers
      .quantityPlus(req.params.id, req.session.currentuser._id)
      .then((response) => {
        res.json({ response });
      });
  } catch (err) {
    next(err);
  }
});

router.post("/quantityMinus/:id", isLogin, (req, res) => {
  try {
    userhelpers
      .quantityMinus(req.params.id, req.session.currentuser._id)
      .then((response) => {
        res.json({ response });
      });
  } catch (err) {
    next(err);
  }
});

router.post("/deleteFromCart/:id", isLogin, (req, res, next) => {
  try {
    userhelpers
      .deleteFromCart(req.session.currentuser._id, req.params.id)
      .then((response) => {
        res.json({ response });
      });
  } catch (err) {
    next(err);
  }
});

router.post("/applyCoupon", isLogin, (req, res) => {
  userhelpers
    .applyCoupon(req.body, req.session.currentuser._id)
    .then((response) => {
      if (response.status) {
        req.session.coupon = response.coupon;
        req.session.discount = response.discount;
      }
      res.json({ response });
    });
});

router.post("/addToWishList/:id", isLogin, (req, res, next) => {
  userhelpers
    .addToWishList(req.session.currentuser._id, req.params.id)
    .then((response) => {
      console.log(response);
      res.json({ response });
    })
    .catch((err) => {
      next(err);
    });
});

router.get("/wishlist", isLogin, (req, res) => {
  let session = req.session;
  userhelpers.wishListProducts(req.session.currentuser._id).then((response) => {
    if (response.notEmpty) {
      let wishListItems = response.products.wishListItems;
      res.render("user/wishlist", {
        user: true,
        session,
        response,
        wishListItems,
      });
    } else {
      res.render("user/wishlist", { user: true, session, response });
    }
  });
});

router.get("/checkWishlist/:id", isLogin, (req, res, next) => {
  userhelpers
    .checkWishlist(req.session.currentuser._id, req.params.id)
    .then((wishList) => {
      res.json({ wishList });
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/removeWishListItem/:id", isLogin, (req, res, next) => {
  userhelpers
    .removeWishListItem(req.session.currentuser._id, req.params.id)
    .then((response) => {
      res.json({ response });
    })
    .catch((err) => {
      next(err);
    });
});

router.get("/userprofile", isLogin, (req, res) => {
  userhelpers.getUser(req.session.currentuser._id).then((response) => {
    let userDetails = response;
    let session = req.session;
    let emailExist = req.session.emailExist;
    console.log(req.session.emailExist);
    req.session.emailExist = null;
    res.render("user/user-profile", {
      emailExist,
      userDetails,
      session,
      user: true,
    });
  });
});

router.get("/checkout", isLogin, (req, res) => {
  const userId = req.session.currentuser._id;
  let session = req.session;
  userhelpers.getAddress(userId).then((address) => {
    userhelpers.getCartProducts(userId).then((response) => {
      let cartProducts = response.cart;
      if (req.session.discount) {
        cartProducts.discount = req.session.discount;
      }
      console.log(cartProducts, "checkout");
      userhelpers.cartTotal(cartProducts).then((response) => {
        res.render("user/checkout", {
          user: true,
          session,
          cartProducts,
          address,
          response,
        });
      });
    });
  });
});

router.post("/placeOrder", isLogin, (req, res) => {
  userId = req.session.currentuser._id;
  orderDetails = req.body;
  if (req.session.coupon) {
    orderDetails.discount = req.session.discount;
  }
  userhelpers.PlaceOrder(orderDetails, userId).then(async (order) => {
    console.log(order, "PlaceOrder");
    if (order.paymentDetails === "COD") {
      if (req.session.coupon) {
        await userhelpers.couponUser(
          req.session.currentuser._id,
          req.session.coupon
        );
      }
      userhelpers
        .changeOrderStatus(order._id, req.session.currentuser._id)
        .then((data) => {
          console.log(data, "this line 352");
          req.session.coupon = null;
          res.json({ order });
        });
    } else {
      userhelpers.generateRazorPay(order).then((data) => {
        res.json({ data });
      });
    }
  });
});

router.post("/verifyPayment", isLogin, (req, res) => {
  console.log(req.body);
  userhelpers.verifyPayment(req.body).then(async () => {
    if (req.session.coupon) {
      await userhelpers.couponUser(
        req.session.currentuser._id,
        req.session.coupon
      );
    }
    console.log(req.body.order);
    userhelpers
      .changeOrderStatus(req.body.order.receipt, req.session.currentuser._id)
      .then(() => {
        res.json({ status: true });
      });
  });
});

router.get("/orderSuccess/:id", (req, res, next) => {
  let session = req.session;
  console.log(req.params.id);
  userhelpers
    .getOrder(req.params.id)
    .then((order) => {
      res.render("user/orderSuccess", { order, user: true, session });
    })
    .catch((err) => {
      next(err);
    });
});

router.post("/editProfile", isLogin, (req, res) => {
  userhelpers.editProfile(req.body).then((response) => {
    console.log(response);
    if (response.emailexist) {
      req.session.emailExist = true;
    } else {
      req.files.image1.mv(
        "public/images/user-images/" + req.body.id + ".jpg",
        (err, done) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }

    res.redirect("/userprofile");
  });
});

router.get("/addressManagement", isLogin, (req, res) => {
  let session = req.session;
  userId = req.session.currentuser._id;
  userhelpers.getAddress(userId).then((address) => {
    res.render("user/addressPage", { user: true, address, session });
  });
});

router.post("/address/:id", isLogin, (req, res) => {
  userId = req.session.currentuser._id;
  userhelpers.addAddress(req.body, userId).then((address) => {
    if (req.params.id === "profile") res.redirect("/addressManagement");
    else res.redirect("/checkout");
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.header("Expires", "-1");
  res.header("Pragma", "no-cache");
  res.redirect("/");
});

router.get("/allProducts", (req, res) => {
  userhelpers.getAllProducts().then((products) => {
    console.log(products);
    adminHelpers.getAllCategory().then((cats) => {
      res.render("user/allProducts", { products, user: true, cats });
    });
  });
});

router.get("/orderManagement", isLogin, (req, res) => {
  let session = req.session;
  userhelpers.orderManagement(req.session.currentuser._id).then((order) => {
    res.render("user/allOrders", { user: true, order, session });
  });
});

router.get("/orderDetails/:id", isLogin, (req, res, next) => {
  let session = req.session;
  userhelpers
    .getOrder(req.params.id)
    .then((order) => {
      res.render("user/orderDetails", { order, user: true, session });
    })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
