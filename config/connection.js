const mongoose = require('mongoose');
const env = require('dotenv').config()

let connection = {
    mongoUri : process.env.MONGO_URI,
    connect: () => {
        mongoose.connect(connection.mongoUri).then((res) => {
            console.log("mongodb connected")
        })
    }
}
module.exports = connection
