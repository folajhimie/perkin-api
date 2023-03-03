const app = require('./app');
const connectDB = require('./database/connect')
const PORT = process.env.PORT || 3500


require('dotenv').config();





const start = async() => {
    try{
        await connectDB();
        console.log('DB connected successfully...')
        app.listen(process.env.PORT, ()=> {
            console.log(`connected to db & listening on port ${process.env.PORT} and ${process.env.ASSET_URL}`); 
        })
    }catch(error){
        console.log("error has occured", error.message);
    }
}


start();
  