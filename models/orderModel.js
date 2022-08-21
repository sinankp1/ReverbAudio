const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const orderSchema = new mongoose.Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    orderItems:[
        {
            product: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
            }
        }
    ],
    totalPrice: {
        type: Number,
    },
    deliveryCharge: {
        type: Number,
    },
    deliveryDetails:{
        type: Schema.Types.ObjectId,
        ref: 'Address',
    },
    paymentDetails:{
        type: String,
    },
    orderStatus:{
        type: Boolean,
    },
    deliveryStatus:{
        type: String,
    }

},
{
    timestamps: true,
})

module.exports = mongoose.model('Order',orderSchema);