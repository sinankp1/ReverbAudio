const mongoose = require('mongoose')

const Schema = mongoose.Schema

const categorySchema = new Schema({
    categoryname:{
        type:String,
        required:true
    },
    categorydescription:{
        type:String,
        required:true
    }
})

module.exports = mongoose.model("Category",categorySchema)