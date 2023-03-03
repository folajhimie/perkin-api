const allowedOrigins = require('./allowedOrigins')


const corsOptions = {
    origin: (origin, callback) => {
        for (let iterator of allowedOrigins) {
            if (iterator.indexOf(origin) !== -1 || !origin) {
                callback(null, true)
                // console.log("object", origin,"allowed Origin", allowedOrigins, "another params", allowedOrigins.indexOf(origin), iterator);
            } else {
                callback(new Error("Not allowed by CORS"))
                console.log("object 2", origin, iterator.indexOf(origin), iterator);
            }         
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
}


module.exports = corsOptions