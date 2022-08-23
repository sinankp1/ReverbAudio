const mongoose = require("mongoose");
const env = require("dotenv").config();
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const bcrypt = require("bcrypt");
const UserModel = require("../models/userModel");
const cartModel = require("../models/cartModel");
const wishListModel = require("../models/wishListModel");
const userModel = require("../models/userModel");
const addressModel = require("../models/addressModel");
const couponModel = require("../models/couponModel");
const orderModel = require("../models/orderModel");
const Razorpay = require("razorpay");
const productModel = require("../models/productModel");
var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

let userHelper = {
  userCheck: (email) => {
    console.log(email);
    return new Promise(async (resolve, reject) => {
      let user = await UserModel.findOne({ email });
      let status = {
        check: false,
      };
      if (user) {
        status.check = true;
        resolve(status);
      } else {
        resolve(status);
      }
    });
  },
  checkMobile: (mobile) => {
    return new Promise(async (resolve, reject) => {
      let user = await UserModel.findOne({ mobile });
      let status = {
        check: false,
      };
      if (user) {
        status.check = true;
        status.user = user;
        resolve(status);
      } else {
        resolve(status);
      }
    });
  },
  sendOtp: (mobile) => {
    console.log(mobile);
    return new Promise((resolve, reject) => {
      client.verify.v2
        .services(process.env.TWILIO_SERVICE_SID)
        .verifications.create({ to: "+91" + mobile, channel: "sms" })
        .then((verification) => {
          console.log(mobile);
          console.log(verification.status);
          resolve(verification);
        });
    });
  },
  verifyOtp: (otp, mobile) => {
    return new Promise((resolve, reject) => {
      client.verify.v2
        .services(process.env.TWILIO_SERVICE_SID)
        .verificationChecks.create({ to: "+91" + mobile, code: otp })
        .then((verification_check) => {
          console.log(verification_check.status);
          resolve(verification_check.status);
        });
    });
  },
  userSave: (userData) => {
    return new Promise(async (resolve, reject) => {
      let { name, email, mobile, password } = userData;
      let status = true;
      password = await bcrypt.hash(password, 10);
      user = new UserModel({
        name,
        email,
        mobile,
        password,
        status,
      });

      user
        .save()
        .then((data) => {
          console.log(data);
          resolve(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },
  userLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      const { email, password } = userData;
      let user = await UserModel.findOne({ email });
      let response = {};

      if (user) {
        if (user.status) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              response.status = true;
              response.user = user;
              resolve(response);
            } else {
              response.status = false;
              resolve(response);
            }
          });
        } else {
          response.active = false;
          resolve(response);
        }
      } else {
        response.status = false;
        resolve(response);
      }
    });
  },
  getUser: (id) => {
    return new Promise(async (resolve, reject) => {
      let user = await UserModel.findById(id).lean();

      resolve(user);
    });
  },
  addToCart: (userId, proId) => {
    let user_Id = mongoose.Types.ObjectId(userId);
    const response = {};
    return new Promise(async (resolve, reject) => {
      let cart = await cartModel.findOne({ user: user_Id });
      if (cart) {
        let cartProduct = await cartModel.findOne({
          user: user_Id,
          "cartItems.product": proId,
        });
        if (cartProduct) {
          cartModel
            .updateOne(
              { user: userId, "cartItems.product": proId },
              { $inc: { "cartItems.$.quantity": 1 } }
            )
            .then((data) => {
              response.inc = true;
              resolve(response);
            });
        } else {
          let cartArray = { product: proId, quantity: 1 };
          cartModel
            .findOneAndUpdate(
              { user: user_Id },
              { $push: { cartItems: cartArray } }
            )
            .then(async (data) => {
              let wishList = await wishListModel.findOne({
                user: user_Id,
                "wishListItems.product": proId,
              });
              if (wishList) {
                wishListModel
                  .updateOne(
                    { user: userId },
                    {
                      $pull: {
                        wishListItems: { product: proId },
                      },
                    }
                  )
                  .then((data) => {
                    response.added = false;
                    response.data = data;
                    resolve(response);
                  });
              }
              resolve(data);
            });
        }
      } else {
        let product = proId;
        let quantity = 1;
        cart = new cartModel({
          user: userId,
          cartItems: [
            {
              product,
              quantity,
            },
          ],
        });
        cart.save().then(async (data) => {
          let wishList = await wishListModel.findOne({
            user: user_Id,
            "wishListItems.product": proId,
          });
          if (wishList) {
            wishListModel
              .updateOne(
                { user: userId },
                {
                  $pull: {
                    wishListItems: { product: proId },
                  },
                }
              )
              .then((data) => {
                response.added = false;
                response.data = data;
                resolve(response);
              });
          }
          resolve(data);
        });
      }
    });
  },
  showCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let cartProduct = await cartModel
        .findOne({ user: userId })
        .populate("products");
      resolve(cartProduct);
    });
  },
  deleteFromCart: (userId, proId) => {
    return new Promise((resolve, reject) => {
      cartModel
        .updateOne(
          { user: userId },
          {
            $pull: {
              cartItems: { product: proId },
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  cartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cartProduct = await cartModel.findOne({ user: userId });
      if (cartProduct) {
        count = cartProduct.cartItems.length;
      }
      resolve(count);
    });
  },
  wishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let wishlistProduct = await wishListModel.findOne({ user: userId });
      if (wishlistProduct) {
        count = wishlistProduct.wishListItems.length;
      }
      resolve(count);
    });
  },
  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let cartItems = await cartModel
        .findOne({ user: userId })
        .populate("cartItems.product")
        .lean();
      if (cartItems) {
        if (cartItems.cartItems.length > 0) {
          response.notEmpty = true;
          response.cart = cartItems;
          resolve(response);
        } else {
          response.notEmpty = false;
          resolve(response);
        }
      } else {
        response.notEmpty = false;
        resolve(response);
      }
    });
  },
  quantityPlus: (proId, userId) => {
    console.log(proId);
    return new Promise((resolve, reject) => {
      cartModel
        .updateOne(
          { user: userId, "cartItems.product": proId },
          { $inc: { "cartItems.$.quantity": 1 } }
        )
        .then(async (data) => {
          let cart = await cartModel.findOne({ user: userId }).lean();
          let response = {};
          let count = null;
          for (let i = 0; i < cart.cartItems.length; i++) {
            if (cart.cartItems[i].product == proId) {
              count = cart.cartItems[i].quantity;
            }
          }
          response.count = count;
          resolve(response);
        });
    });
  },
  quantityMinus: (proId, userId) => {
    console.log(proId);
    return new Promise((resolve, reject) => {
      cartModel
        .updateOne(
          { user: userId, "cartItems.product": proId },
          { $inc: { "cartItems.$.quantity": -1 } }
        )
        .then(async (data) => {
          let response = {};
          let cart = await cartModel.findOne({ user: userId }).lean();
          response.cart = cart;
          console.log(cart);
          let count = null;
          for (let i = 0; i < cart.cartItems.length; i++) {
            if (cart.cartItems[i].product == proId) {
              count = cart.cartItems[i].quantity;
            }
          }
          if (count == 0) {
            cartModel
              .updateOne(
                { user: userId },
                {
                  $pull: {
                    cartItems: { product: proId },
                  },
                }
              )
              .then((data) => {
                response.data = data;
              });
          }
          response.count = count;
          resolve(response);
        });
    });
  },
  deleteFromCart: (userId, proId) => {
    return new Promise((resolve, reject) => {
      cartModel
        .updateOne(
          { user: userId },
          {
            $pull: {
              cartItems: { product: proId },
            },
          }
        )
        .then((data) => {
          resolve(data);
        });
    });
  },
  addToWishList: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let userWishList = await wishListModel.findOne({ user: userId });
        let cartItem = await cartModel.findOne({
          user: userId,
          "cartItems.product": proId,
        });
        if (cartItem) {
          response.cart = true;
          resolve(response);
        } else {
          if (userWishList) {
            let exist = await wishListModel.findOne({
              user: userId,
              "wishListItems.product": proId,
            });
            if (!exist) {
              let conditions = {
                user: userId,
                "wishListItems.product": { $ne: proId },
              };
              var update = {
                $addToSet: { wishListItems: { product: proId } },
              };
              wishListModel
                .findOneAndUpdate(conditions, update)
                .then((data) => {
                  response.added = true;
                  response.data = true;
                  response.cart = false;
                  resolve(response);
                });
            } else {
              wishListModel
                .updateOne(
                  { user: userId },
                  {
                    $pull: {
                      wishListItems: { product: proId },
                    },
                  }
                )
                .then((data) => {
                  response.added = false;
                  response.data = data;
                  response.cart = false;
                  resolve(response);
                });
            }
          } else {
            let user = userId;
            let product = proId;
            let wishListItems = [];
            wishListItems[0] = { product };
            newWishList = new wishListModel({
              user,
              wishListItems,
            });
            newWishList.save().then((data) => {
              response.added = true;
              response.data = data;
              response.cart = false;
              resolve(response);
            });
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  checkWishlist: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      let wishList = null;
      wishListModel
        .find({
          user: userId,
          wishListItems: {
            $elemMatch: { product: proId },
          },
        })
        .then((data) => {
          if (data.length > 0) {
            wishList = true;
            console.log(wishList, "exist");
          } else {
            wishList = false;
            console.log(wishList, "not");
          }
          resolve(wishList);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  wishListProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let products = await wishListModel
        .findOne(userId)
        .populate("wishListItems.product")
        .lean();
      if (products.wishListItems.length > 0) {
        response.notEmpty = true;
        response.products = products;
        resolve(response);
      } else {
        response.notEmpty = false;
        resolve(response);
      }
    });
  },
  removeWishListItem: (userId, proId) => {
    return new Promise((resolve, reject) => {
      let response = {};
      wishListModel
        .updateOne(
          { user: userId },
          {
            $pull: {
              wishListItems: { product: proId },
            },
          }
        )
        .then((data) => {
          response.removed = true;
          response.data = data;
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  editProfile: (userData) => {
    return new Promise(async (resolve, reject) => {
      let { id, name, email, alternativeNumber } = userData;
      let response = {};
      let user1 = await userModel.findById(id);
      let user2 = await userModel.findOne({ email: userData.email });
      if (user2.email == user1.email || !user2) {
        userModel
          .findByIdAndUpdate(id, {
            name: name,
            email: email,
            alternativeNumber: alternativeNumber,
          })
          .then((data) => {
            response.emailexist = false;
            resolve(response);
          });
      } else {
        response.emailexist = true;
        resolve(response);
      }
    });
  },
  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      let address = await addressModel.find({ User: userId }).lean();
      resolve(address);
    });
  },
  addAddress: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      let defaultAddress = null;
      let address = await addressModel.find({ User: userId }).lean();
      if (address) {
        defaultAddress = false;
      } else {
        defaultAddress = true;
      }
      let Address = new addressModel({
        User: userId,
        name: data.name,
        number: data.number,
        address1: data.address1,
        address2: data.address2,
        district: data.district,
        state: data.state,
        country: data.country,
        pinCode: data.pinCode,
        defaultAddress,
      });
      Address.save().then((address) => {
        resolve(address);
      });
    });
  },
  cartTotal: (cart) => {
    return new Promise(async (resolve, reject) => {
      let total = cart.cartItems.reduce((acc, curr) => {
        acc = acc + curr.product.price * curr.quantity;
        return acc;
      }, 0);
      let response = {};
      let shipping = 0;
      if (total < 1000) {
        shipping = 100;
      }
      response.shipping = shipping;
      response.total = total;
      response.grandTotal = response.total + response.shipping;
      if (cart.discount) {
        response.grandTotal = response.grandTotal - cart.discount;
        response.discount = cart.discount;
      }
      resolve(response);
    });
  },
  applyCoupon: (code, id) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      response.discount = 0;
      code.code = code.code.toUpperCase();
      let coupon = await couponModel.findOne({ code: code.code });
      if (coupon) {
        let couponUser = await couponModel.findOne({
          code: code.code,
          users: { $in: [id] },
        });
        console.log(id, "applcpon", couponUser);
        if (couponUser) {
          response.status = false;
          resolve(response);
        } else {
          response.status = true;
          response.coupon = coupon;
          userHelper.getCartProducts(id).then((cartProducts) => {
            userHelper.cartTotal(cartProducts.cart).then((total) => {
              response.discount = (total.grandTotal * coupon.percentage) / 100;
              response.grandTotal = total.grandTotal - response.discount;
              resolve(response);
            });
          });
        }
      } else {
        response.status = false;
        resolve(response);
      }
    });
  },
  PlaceOrder: (data, userId) => {
    let orderStatus;
    return new Promise(async (resolve, reject) => {
      if (data.paymentMethod === "COD") {
        orderStatus = true;
      }
      console.log(data);
      userHelper.getCartProducts(userId).then((cartProducts) => {
        userHelper.cartTotal(cartProducts.cart).then((response) => {
          if (data.discount) {
            response.grandTotal = response.grandTotal - data.discount;
            console.log(response.grandTotal, data.discount);
          }
          let order = new orderModel({
            user: userId,
            orderItems: cartProducts.cart.cartItems,
            totalPrice: response.grandTotal,
            deliveryCharge: response.shipping,
            deliveryDetails: data.address,
            paymentDetails: data.paymentMethod,
            orderStatus,
          });
          order.save().then(async (data) => {
            let cartItems = cartProducts.cart.cartItems;
            for (let i = 0; i < cartItems.length; i++) {
              productModel
                .findByIdAndUpdate(cartItems[i].product, {
                  $inc: { quantity: -cartItems[i].quantity },
                })
                .then((data) => {
                  console.log(data);
                });
            }
            resolve(data);
          });
        });
      });
    });
  },
  generateRazorPay: (Order) => {
    return new Promise((resolve, reject) => {
      console.log(Order._id, "generater");
      let fund = Order.totalPrice * 100;
      fund = parseInt(fund);
      var options = {
        amount: fund, // amount in the smallest currency unit
        currency: "INR",
        receipt: "" + Order._id,
      };
      instance.orders.create(options, function (err, order) {
        console.log(order + "sdfgbhzxcdfgxsdcvxcv");
        console.log(err);

        resolve(order);
      });
    });
  },
  verifyPayment: (data) => {
    return new Promise(async (resolve, reject) => {
      const crypto = require("crypto");
      let hmac = crypto.createHmac("sha256", "OZttb4lc8GIrIb9DPAQl7sHG");
      let body =
        data.payment.razorpay_order_id + "|" + data.payment.razorpay_payment_id;
      hmac.update(body.toString());
      hmac = hmac.digest("hex");
      if (hmac == data.payment.razorpay_signature) {
        resolve();
      } else {
        reject();
      }
    });
  },
  couponUser: (userId, coupon) => {
    return new Promise((resolve, reject) => {
      console.log(coupon);
      couponModel
        .findByIdAndUpdate(coupon._id, { $push: { users: userId } })
        .then((data) => {
          resolve();
        });
    });
  },
  changeOrderStatus: (id, userId) => {
    console.log(id);
    return new Promise(async (resolve, reject) => {
      orderModel
        .findOneAndUpdate(
          { _id: id },
          { orderStatus: true, deliveryStatus: "processing" }
        )
        .then((data) => {
          console.log(data, "we're here");
          cartModel.findOneAndRemove({ user: userId }).then(() => {
            resolve();
          });
        });
    });
  },
  getOrder: (id) => {
    return new Promise((resolve, reject) => {
      orderModel
        .findById(id)
        .populate("orderItems.product")
        .populate("deliveryDetails")
        .lean()
        .then((order) => {
          resolve(order);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      productModel
        .find({})
        .populate("categories")
        .lean()
        .then((products) => {
          resolve(products);
        });
    });
  },
  orderManagement: (id) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      orderModel
        .find({ id })
        .populate("orderItems.product")
        .populate("orderItems.product.categories")
        .populate("deliveryDetails")
        .lean()
        .then((order) => {
          resolve(order);
        });
    });
  },
  getOrder: (id) => {
    return new Promise((resolve, reject) => {
      orderModel
        .findById(id)
        .populate("orderItems.product")
        .populate("orderItems.product.categoryName")
        .populate("deliveryDetails")
        .lean()
        .then((order) => {
          resolve(order);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getCoupons: (id) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let coupons = await couponModel.find({ users: { $ne: id } }).lean();
      if (coupons.length > 0) {
        response.coupons = coupons;
        resolve(response);
      } else {
        response.nothing = true;
        resolve(response);
      }
    });
  },
};

module.exports = userHelper;
