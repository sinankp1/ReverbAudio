const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
    User:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name:{
        type: String,
    },
    number:{
        type: String,
    },
    address1:{
        type: String,
    },
    address2:{
        type: String,
    },
    district:{
        type: String,
    },
    state:{
        type: String,
    },
    country:{
        type: String,
    },
    pinCode:{
        type: Number,
    },
    defaultAddress:{
        type: Boolean,
    },
    
},{
     timestamps: true 
});

module.exports = mongoose.model('Address',AddressSchema);