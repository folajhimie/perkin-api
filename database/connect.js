const mongoose = require('mongoose');
require('dotenv').config();
// const configData = require('../config/config')

const mongoAtlasUri ="mongodb+srv://folajhimie:UbfZyJCB4UFJbNPj@perkin-project.vuxlytq.mongodb.net/?retryWrites=true&w=majority";


mongoose.set('strictQuery',false);
const connectDB = () => {
    const username = process.env.MONGO_DB_USERNAME;
    const passport = process.env.MONGO_DB_PASSWORD;
    const url = process.env.MONGO_DB_URL;

    return mongoose.connect(
        process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        }
    ).then(result => {
        console.log("Connected to the MongoDB Atlas Database");
    }).catch( err => {
        console.log("Connection to MongoBD Database has failed")
    });
}


module.exports = connectDB;