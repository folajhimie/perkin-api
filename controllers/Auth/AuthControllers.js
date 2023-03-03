const User = require('../../models/Auth/User');
const { hashPassword, comparePassword } = require('../../middleware/password-utils');
const jwt = require('jsonwebtoken');
const sendToken = require('../../utils/jwtToken');
// const nodeMailer = require("nodemailer");
const { v4: uuid } = require("uuid")
const { sendVerificationEmail, sendMail } = require("../../utils/sendMail")

require('dotenv').config();




const UserRegister = async (req, res) => {
    const users = await User.find();
    // console.log("all users...", users)
    try {
        const { username, mobile, email, password, confirmPassword, roles } = req.body;

        if (!username || !password || !email || !mobile || !confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Empty Input Fields!!"
            })
        }
        // var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
        var regExName = /^[a-zA-Z ]*$/;
        // var name = document.getElementById('nameInput').value;
        // if (!regName.test(name)) {
        //     alert('Invalid name given.');
        // } else {
        //     alert('Valid name given.');
        // }
        if (!regExName.test(username)) {
            return res.status(400).json({
                status: false,
                message: "Invalid username Entered!!"
            })
        }

        if (!/^([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})$/.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Invalid email Entered!!"
            })
        }

        if (!/^[0-9]{11}$/.test(mobile)) {
            return res.status(400).json({
                status: false,
                message: "Your Mobile Number isn't 11 Digits!!"
            })
        }

        if (password.length < 3) {
            return res.status(400).json({
                status: false,
                message: "Password is too Short!!"
            })
        }

        const user = await User.findOne({ email: req.body.email }).exec();

        if (user) {
            return res.status(409).json({ status: false, message: "User already exist" })
        }

        const userCode = `FFM/PRK/${users.length}`;

        console.log("User Code...", userCode);

        const hashedPassword = await hashPassword(password)
        const newUser = new User({
            username,
            password: hashedPassword,
            confirmPassword,
            mobile,
            email,
            code: userCode,
            roles,
            active: true,
            verified: false,
        })

        console.log("new user...", newUser)

        // const savedUser = await newUser.save()
        //     .then((result) => {
        //         console.log("dragon Drop..", result); 
        //         sendVerificationEmail(result, res);
        //     })
        //     .catch((err) => {
        //         res.json({
        //             status: "Failed",
        //             message: "An Error occured while saving user Account.."
        //         })
        //     });

        const savedUser = await newUser.save()
        // console.log("dragon Drop..", savedUser); 
        try {
            sendVerificationEmail(savedUser, res);
            // console.log("core user...", savedUser)
            sendToken(savedUser, 200, res);
            
        } catch (error) {
            res.json({
                status: "Failed",
                message: "An Error occured while saving user Account.."
            })
        }

    } catch (error) {
        console.log("message error", error)
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }


}



const UserLogin = async (req, res) => {
    try {
        const { email, password, username } = req.body;
        console.log("requesting for the body", password, username);

        if (!username || !password) {
            return res.status(400).json({
                status: false,
                message: "Username and password are required."
            })
        };

        const foundUser = await User.findOne({ username }).exec();

        console.log("found User..", foundUser);

        if (!foundUser || !foundUser.active) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized!"
            })
        }

        if (!foundUser.verified) {
            return res.status(401).json({
                status: false,
                message: "Email hasn't been verified yet. Check Your Inbox"
            })
        }

        console.log("object...", password);
        console.log("Drop Music..", foundUser.password, "Mobile", foundUser.mobile);

        const matchPassword = await comparePassword(password, foundUser.password)

        console.log("password is life...", matchPassword);

        if (!matchPassword) {
            return res.status(401).json({
                status: false,
                message: "Password is incorrect!!"
            })
        }

        if (matchPassword && username.toLowerCase() == foundUser.username.toLowerCase()) {
            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '1h' }
            );

            const refreshToken = jwt.sign(
                { "username": foundUser.username },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '7d' }
            )

            // Create secure cookie with refresh token 
            res.cookie('jwt', refreshToken, {
                httpOnly: true, //accessible only by web server 
                secure: true, //https
                sameSite: 'None', //cross-site cookie 
                maxAge: 7 * 24 * 60 * 60 * 1000 //cookie expiry: set to match rT
            })
            console.log("refresh Token is the way forward..", refreshToken);

            console.log("accessing the Token..", accessToken);

            // console.log("alert...", foundUser.refreshToken);

            console.log("cookies...", req?.cookies?.jwt);

            res.status(200).json({
                status: true,
                message: "Login Successful!!",
                data: accessToken
            });

        }

    } catch (error) {
        console.log("message error", error)
        res.status(500).json({
            success: false,
            message: error.message,
        });

    }

}


const refresh = (req, res) => {
    const cookies = req.cookies;

    if (!cookies?.jwt) return res.status(401).json({ message: 'Unauthorized' });

    const refreshToken = cookies.jwt;

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' })

            const foundUser = await User.findOne({ username: decoded.username }).exec()

            if (!foundUser) return res.status(401).json({ message: "Unauthorized" })

            const accessToken = jwt.sign(
                {
                    "UserInfo": {
                        "username": foundUser.username,
                        "roles": foundUser.roles
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            )

            res.status(200).json({
                status: true,
                accessToken
            })

        }
    )
}


const UserLogout = async (req, res) => {

    if (!req.cookies?.jwt) {
        return res.status(204).json({ message: " No Cookie in Existence" })
    }

    const refreshToken = req.cookies.jwt;

    // Is refreshToken in db?
    const foundUser = await User.findOne({ refreshToken }).exec();

    if (!foundUser) {
        res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });
        return res.sendStatus(204);
    }

    // Delete refreshToken in db
    foundUser.refreshToken = foundUser.refreshToken.filter(rt => rt !== refreshToken);
    const result = await foundUser.save();
    console.log("Logged Out User", result);

    res.clearCookie('jwt', { httpOnly: true, sameSite: 'None', secure: true });

    res.status(204).json({ message: "User successfully Logged Out" });


}


module.exports = { UserRegister, UserLogin, UserLogout, refresh }