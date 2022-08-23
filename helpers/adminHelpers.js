const mongoose = require("mongoose");
const env = require("dotenv").config();
const client = require("twilio")(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
const bcrypt = require("bcrypt");
const adminModel = require("../models/adminModel");
const categoryModel = require("../models/categoryModel");
const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const bannerModel = require("../models/bannerModel");
const couponModel = require("../models/couponModel");
const orderModel = require("../models/orderModel");
const { response } = require("express");

module.exports = {
  adminSignup: (adminData) => {
    console.log(adminData);
    return new Promise(async (resolve, reject) => {
      let { name, email, mobile, password } = adminData;
      password = await bcrypt.hash(password, 10);
      user = new adminModel({
        name,
        email,
        mobile,
        password,
      });
      user.save().then((data) => {
        console.log(data);
        resolve(data);
      });
    });
  },
  doLogin: (adminData) => {
    return new Promise(async (resolve, reject) => {
      let { email1, password } = adminData;
      let admin = await adminModel.findOne({ email1 });
      let response = {};
      if (admin) {
        bcrypt.compare(password, admin.password).then((status) => {
          if (status) {
            response.status = true;
            response.admin = admin;
            resolve(response);
          } else {
            response.status = false;
            resolve(response);
          }
        });
      } else {
        response.status = false;
        resolve(response);
      }
    });
  },
  checkMobile: (mobile) => {
    return new Promise(async (resolve, reject) => {
      let admin = await adminModel.findOne({ mobile });
      let status = {
        check: false,
      };
      if (admin) {
        status.check = true;
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
  addCategory: (categoryDetails) => {
    return new Promise(async (resolve, reject) => {
      let { categoryname, categorydescription } = categoryDetails;
      categoryname = categoryname.toLowerCase();
      let category = await categoryModel.findOne({ categoryname });
      let status = {
        check: false,
      };
      if (category) {
        status.check = true;
        resolve(status);
      } else {
        newCategory = new categoryModel({
          categoryname,
          categorydescription,
        });
        newCategory.save().then((data) => {
          console.log(data);
          status.data = data;
          resolve(status);
        });
      }
    });
  },
  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let categories = await categoryModel.find({}).lean();
      resolve(categories);
    });
  },
  deleteCategory: (id) => {
    return new Promise((resolve, reject) => {
      try {
        categoryModel.findByIdAndDelete(id).then((data) => {
          console.log(data);
          resolve(data);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getCategory: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let category = await categoryModel.findOne({ _id: id }).lean();
        resolve(category);
      } catch (err) {
        reject(err);
      }
    });
  },
  editCategory: (details) => {
    return new Promise(async (resolve, response) => {
      details.categoryname = details.categoryname.toLowerCase();
      let category = await categoryModel.findById(details.id);
      let status = {
        check: false,
      };
      if (!category) {
        status.check = true;
        resolve(status);
      } else {
        categoryModel
          .findByIdAndUpdate(details.id, {
            categoryname: details.categoryname,
            categorydescription: details.categorydescription,
          })
          .then((data) => {
            console.log(data);
            resolve(data);
          });
      }
    });
  },
  addSubCategory: (subCategoryDetails) => {
    return new Promise(async (resolve, reject) => {
      let { subcategoryname, category } = subCategoryDetails;
      subcategoryname = subcategoryname.toLowerCase();
      let status = {
        check: false,
      };
      let subcat = await subCategoryModel.findOne({
        subcategoryname: subcategoryname,
      });
      if (subcat) {
        status.check = true;
        resolve(status);
      } else {
        newsubCategory = new subCategoryModel({
          subcategoryname,
          category,
        });
        newsubCategory.save().then((data) => {
          console.log(data);
          status.data = data;
          resolve(status);
        });
      }
    });
  },
  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      let users = await userModel.find({}).lean();
      resolve(users);
    });
  },
  changeStatus: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await userModel.findById(id).lean();

        if (user.status) {
          userModel.findByIdAndUpdate(id, { status: false }).then((data) => {
            resolve(data);
          });
        } else {
          userModel.findByIdAndUpdate(id, { status: true }).then((data) => {
            resolve(data);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  addProduct: (productDetails) => {
    return new Promise(async (resolve, reject) => {
      let { p_id, modelname, brand, price, description, quantity, categories } =
        productDetails;
      brand = brand.toUpperCase();
      let product = await productModel.findOne({ p_id: p_id });
      let response = {};
      if (product) {
        response.exist = true;
        resolve(response);
      } else {
        newProduct = new productModel({
          p_id,
          modelname,
          brand,
          price,
          description,
          quantity,
          categories,
        });
        newProduct.save().then((data) => {
          response.exist = false;
          response.data = data;
          resolve(response);
        });
      }
    });
  },
  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      productModel
        .find({})
        .populate("categories")
        .lean()
        .then((products) => {
          console.log(products);
          resolve(products);
        });
    });
  },
  updateProduct: (product) => {
    return new Promise((resolve, reject) => {
      product.brand = product.brand.toUpperCase();
      productModel
        .findByIdAndUpdate(product.id, {
          modelname: product.modelname,
          brand: product.brand,
          price: product.price,
          description: product.description,
          quantity: product.quantity,
          categories: product.categories,
        })
        .then((response) => {
          resolve(response);
        });
    });
  },
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      productModel
        .findByIdAndRemove(id)
        .then((response) => {
          resolve(response);
        })
        .catch((error) => reject(error));
    });
  },
  addBanner: (bannerDetails) => {
    return new Promise(async (resolve, reject) => {
      let { product, banner_title, banner_subtitle } = bannerDetails;
      let banner = await bannerModel.findOne({ product: product });
      let response = {};
      if (banner) {
        response.exist = true;
        resolve(response);
      } else {
        newBanner = new bannerModel({
          product,
          banner_title,
          banner_subtitle,
        });
        newBanner.save().then((data) => {
          response.exist = false;
          response.data = data;
          resolve(response);
        });
      }
    });
  },
  getAllBanners: () => {
    return new Promise(async (resolve, reject) => {
      bannerModel
        .find({})
        .populate("product")
        .lean()
        .then((banners) => {
          resolve(banners);
        });
    });
  },
  getBanner: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let banner = await bannerModel.findById(id).populate("product").lean();
        resolve(banner);
      } catch (err) {
        reject(err);
      }
    });
  },
  editBanner: (bannerDetails) => {
    return new Promise(async (resolve, reject) => {
      let { id, banner_title, banner_subtitle } = bannerDetails;
      bannerModel
        .findByIdAndUpdate(id, {
          banner_title: banner_title,
          banner_subtitle: banner_subtitle,
        })
        .then((data) => {
          resolve(data);
        });
    });
  },
  deleteBanner: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        bannerModel.findByIdAndRemove(id).then((response) => {
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getCoupons: () => {
    return new Promise(async (resolve, reject) => {
      couponModel
        .find({})
        .lean()
        .then((coupons) => {
          resolve(coupons);
        });
    });
  },
  addCoupon: (couponData) => {
    return new Promise(async (resolve, reject) => {
      let { name, code, description, percentage } = couponData;
      code = code.toUpperCase();
      let response = {};
      let coupon = await couponModel.findOne({ code: code });
      if (coupon) {
        response.exist = true;
        resolve(response);
      } else {
        newCoupon = new couponModel({
          name,
          code,
          description,
          percentage,
        });
        newCoupon.save().then((data) => {
          response.exist = false;
          resolve(response);
        });
      }
    });
  },
  editCoupon: (data, id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let codeById = await couponModel.findById(id);
        let code1 = await couponModel.findOne({ code: data.code });
        if (codeById.code === data.code || !code1) {
          let code = data.code.toUpperCase();
          couponModel
            .findByIdAndUpdate(id, {
              name: data.name,
              code: code,
              description: data.description,
              percentage: data.percentage,
            })
            .then((response) => {
              resolve(response);
            });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  deleteCoupon: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        couponModel.findByIdAndDelete(id).then((response) => {
          console.log(response);
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getAllOrders: () => {
    return new Promise((resolve, reject) => {
      let orders = orderModel
        .find()
        .populate("user")
        .populate("orderItems.product")
        .populate("deliveryDetails")
        .lean()
        .sort({ createdAt: -1 });
      resolve(orders);
    });
  },
  aggregateOrder: () => {
    return new Promise((resolve, reject) => {
      let orders = orderModel
        .find()
        .populate("user")
        .populate("orderItems.product")
        .populate("deliveryDetails")
        .lean();
      resolve(orders);
    });
  },
  changeShipping: (id, data) => {
    return new Promise((resolve, reject) => {
      orderModel
        .findOneAndUpdate({ _id: id }, { deliveryStatus: data.shipping })
        .then((data) => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getOrderCount: () => {
    return new Promise((resolve, reject) => {
      let response = {};
      orderModel.find({}).then((data) => {
        orderModel.find({ paymentDetails: "online" }).then((data1) => {
          response.razorpay = data1.length;
          response.COD = data.length - data1.length;
          response.all = data.length;
          console.log(response);
          resolve(response);
        });
      });
    });
  },
};
