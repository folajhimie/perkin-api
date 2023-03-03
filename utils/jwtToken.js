const jwt = require("jsonwebtoken");


// create token and saving that in cookies
const sendToken = (user, statusCode, res) => {
    // console.log("Linux user...", user)
    const generateToken = (id) => {
        return jwt.sign({ "username": user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
    };

    const tokens = generateToken(user.username);

    // console.log("real Token...", tokens);

    const token = user.getJwtToken();

    // console.log("what is ur Token..", token);

    // Options for cookies
    const options = {
        path:"/",
        expires: new Date(
            Date.now() + 1000 * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    };


    res.status(statusCode).cookie("token", token, options).json({
        status: "Pending",
        message: "user created",
        user,
        token
    });
}

module.exports = sendToken;