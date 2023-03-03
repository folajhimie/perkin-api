const User = require('../../models/Auth/User');
const UserVerification = require('../../models/Auth/UserVerification')
const path = require('path');
const crypto = require("crypto");
const Token = require('../../models/Auth/Token');
const { sendEmail } = require("../../utils/sendMail")
const { comparePassword, hashPassword} = require("../../middleware/password-utils")
require('dotenv').config();

// const bcrypt = require('bcrypt');


const VerifyUniqueId = async (req, res) => {
    let { userId, uniqueString } = req.params;

    try {
        const userVerify = await UserVerification.find({ userId }).exec();

        const userProfile = await User.find({ _id: userId }).exec();

        console.log("user Verification..", userVerify);

        console.log("hashedUniqueString..", userId, "unique String...", uniqueString)


        if (userVerify.length > 0) {

            const { expiredAt } = userVerify[0];

            const hashedUniqueString = userVerify[0].uniqueString

            console.log("hashedUniqueString..", hashedUniqueString, "unique String...", uniqueString, "expired..", expiredAt)

            if (expiredAt < Date.now()) {

                const userVerifyDeleted = await UserVerification.deleteOne({ _id: userId }).exec();

                if (!userVerifyDeleted) {
                    const userDeleted = await User.deleteOne({ _id: userId }).exec();
                    if (!userDeleted) {
                        console.log("explain why...", userDeleted)
                        let message = "Link has Expired. Please sign up again";
                        // res.redirect(`/user/verified?error=true&message=${message}`); 

                        res.json({
                            status: false,
                            message: message,
                            userVerify,
                            userProfile

                        });

                    } else {
                        let message = "Clearing user with expired unique string failed";
                        console.log(message);
                        // res.redirect(`/user/verified?error=true&message=${message}`);

                        res.json({
                            status: false,
                            message: message,
                            userVerify,
                            userProfile
                        });
                    }
                } else {
                    let message = "An error occured while clearing expired user verification record";
                    console.log(message);
                    // res.redirect(`/user/verified?error=true&message=${message}`);

                    res.json({
                        status: false,
                        message: message,
                        userVerify,
                        userProfile
                    });

                }
            } else {
                // valid record exists so we validate the user string
                // First compare the hashed unique string
                console.log("ready to GO..");

                const toHash = await comparePassword(hashedUniqueString, hashedUniqueString)
                console.log(uniqueString, hashedUniqueString)
                console.log("..yeah to the Good Life...", toHash);

                if (!toHash) {
                    const userUpdated = await User.updateOne({ _id: userId }, { verified: true }).exec();

                    console.log("user profile..", userProfile);

                    if (userProfile[0].verified === true) {
                        const userVerified = await UserVerification.deleteOne({ _id: userId }).exec();

                        if (userVerified) {
                            console.log("Account was successfully Verified...");
                            let message = "Account was successfully Verified...";
                            res.sendFile(path.join(__dirname, 'views', 'verified.html'));

                            // res.sendFile(path.join(__dirname, "../../views/verified.html"));

                            res.json({
                                status: true,
                                message: message,
                                userVerify,
                                userProfile
                            });

                        } else {
                            let message = "An error occured while finalizing successful verification.";
                            console.log(message)
                            // res.redirect(`/user/verified?error=true&message=${message}`);

                            res.json({
                                status: false,
                                message: message,
                                userVerify,
                                userProfile
                            });
                        }

                    } else {
                        console.log("An error occured while updating user record to show verified.");
                        let message = "An error occured while updating user record to show verified.";
                        // res.redirect(`/user/verified?error=true&message=${message}`);

                        res.json({
                            status: false,
                            message: message,
                            userVerify,
                            userProfile
                        });
                    }
                } else {
                    console.log("Invalid verification details passed. Check your Inbox")
                    let message = "Invalid verification details passed. Check your Inbox";
                    // res.redirect(`/user/verified?error=true&message=${message}`);

                    res.json({
                        status: false,
                        message: message,
                        userVerify,
                        userUpdated
                    });
                }


            }
        }
        else {
            // user verification record doesn't exist 
            console.log("user verification record doesn't exist..")
            let message = "Account record doesn't exist or has been verified already. Please sign up or Log in.";
            // res.redirect(`/user/verified?error=true&message=${message}`);

            res.json({
                status: false,
                message: message,
                userVerify,
            });
        }

    } catch (error) {
        console.log(error);
        let message = "An error occured while checking for existing user verification record";
        // res.redirect(`/user/verified?error=true&message=${message}`);

        res.json({
            status: false,
            message: message,
        });

    }
}

const Verified = (req, res) => {
    res.sendFile(path.join(__dirname, '../../', 'views', 'verified.html'));
}

// const verifiedHtmlPath = path.join(__dirname, '../../', 'views', 'verified.html')
// console.log("verified..", verifiedHtmlPath);


const SendCode = async (req, res) => {
    const { resetToken } = req.params;

    const tokenCode = await Token.findOne({ resetToken }).exec();

    console.log("original Token..", tokenCode);



    // if (!userCode) return res.status(400).json({ message: "User not Found!!" });

    try {


        if (tokenCode) {
            var resetCode;

            resetCode = Math.floor(1000 + Math.random() * 9000).toString();
            const resetTheToken = tokenCode.resetToken;

            await tokenCode.updateOne({ code: resetCode }).exec();

            console.log("new Token..", tokenCode, "reset the code..", resetCode);


            const currentUrl = "http://localhost:5000";

            console.log(tokenCode.userId, "user the code..");

            const userCode = await User.findOne({ _id: tokenCode.userId }).exec();

            console.log(userCode, "user the code..");

            if (userCode) {

                const message = `
                <h2>Hello ${userCode.username}!</h2>
                <p>We are excited to have you on Space Box.</p>
                <p>Press <a href=${currentUrl + "/send-otp/" + resetToken}> here</a> to proceed.</p>

                <p>This OTP Code would expire in 30 minutes.</p>
                <p>And your reset code is <b>${resetCode}</b>.</p>  
                <p>if you did not request a password reset. no further action is required</p>
        
                <p>Regards...</p>
                <p>Perkins</p>
                `;

                const subject = "OTP Email Resent";
                const send_to = userCode.email;
                const sent_from = process.env.MAIL_USERNAME;

                console.log(send_to, sent_from);

                try {
                    await sendEmail(subject, message, send_to, sent_from);
                    console.log("otp sent to the mailer...");
                    return res
                        .status(200)
                        .json({
                            status: true,
                            message: "OTP Code Regenerated",
                            data: resetToken,
                            code: resetCode
                        });
                } catch (error) {
                    console.log("error in the Life..", error);
                    res.status(500);
                    throw new Error("Email not sent, please try again");
                }
            }


        } else {
            res.status(500).json({
                success: false,
                message: "Can't Find Token!",
            });
        }

        // console.log("token of life..", tokenCode);



    } catch (error) {
        console.log("message error", error)
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}


const ForgotPassword = async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email }).exec();

    if (!user) {
        return res
            .status(404)
            .json({
                status: false,
                message: "This User doesn't Exist!"
            });
    }

    try {
        if (user) {
            let token = await Token.findOne({ userId: user._id }).exec();
            if (token) {
                await token.deleteOne();
            }

            let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
            console.log("reset the Token ..", resetToken);

            var resetCode;

            resetCode = Math.floor(1000 + Math.random() * 9000).toString();

            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            await new Token({
                userId: user._id,
                token: hashedToken,
                code: resetCode,
                createdAt: Date.now(),
                expiredAt: Date.now() + 30 * (60 * 1000),
            }).save();

            console.log("token of Life..", Token);

            console.log("reset code...", resetCode)

            const currentUrl = "http://localhost:5000";

            const resetUrl = `${currentUrl}/reset-password/${resetToken}`;


            const message = `
            <h2>Hello ${user.username}!</h2>
            <p>You are receiving this email because we received a password reset request for your account.</p>
            <p>Press <a href=${currentUrl + "/send-otp/" + resetToken}> here</a> to proceed.</p>

            <p>This Password Reset Link would expire in 30 minutes.</p>
            <p>And your reset code is <b>${resetCode}</b>.</p>  
            <p>if you did not request a password reset. no further action is required</p>
      
            <p>Regards...</p>
            <p>Perkins</p>
            `;

            const subject = "Password Reset Request";
            const send_to = user.email;
            const sent_from = process.env.MAIL_USERNAME;

            console.log("how far the money..", user.email);

            try {
                await sendEmail(subject, message, send_to, sent_from);
                return res
                    .status(200)
                    .json({
                        status: true,
                        message: "Reset Email Sent",
                        data: resetToken,
                        code: resetCode
                    });
            } catch (error) {
                console.log("error in the Life..", error);
                res.status(500);
                throw new Error("Email not sent, please try again");
            }

        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
}

const GetCode = async (req, res) => {
    const { code } = req.body;
    const { otp } = req.body;


    console.log(req.body, "hello Code..", code);

    const tokenCode = await Token.findOne({ code }).exec();

    if (!tokenCode || tokenCode.code !== code) {
        return res.status(500).json({
            status: false,
            message: "In-correct OTP Code",
        });
    }

    console.log("token to the world..", tokenCode);

    try {
        if (tokenCode) {
            return res
                .status(200)
                .json({
                    status: true,
                    message: "Approved OTP",
                    code: tokenCode.code
                });
        }

    } catch (error) {
        console.log(error, "error of Life");
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }

}

const ResetPassword = async (req, res) => {
    const { password, confirmPassword } = req.body


    const { resetToken } = req.params;

    const tokenCode = await Token.findOne({ resetToken }).exec();

    console.log("original Token..", tokenCode);

    const userCode = await User.findOne({ _id: tokenCode.userId })
    console.log("user for the way...", userCode)

    if (!userCode) {
        return res.status(500).json({
            status: false,
            message: "Can't Find user!",
        });
    }

    if (!password || !confirmPassword) {
        return res.status(500).json({
            status: false,
            message: "Please input password Info!",
        });
    }

    if (password !== confirmPassword) {
        return res.status(500).json({
            status: false,
            message: "Password don't match",
        });
    }

    try {
        const hashedPassword = await hashPassword(password)
        console.log("objecting...");

        // Save new password
        if (userCode && hashedPassword) {
            console.log("user..", hashedPassword);
            userCode.password = hashedPassword;
            userCode.confirmPassword = password;
            await userCode.save();
            return res.status(200).json({
                status: true,
                message: "Password change successful",
                data: password
            });
        } else {
            res.status(400);
            throw new Error("password doesnt exist!");
        }
    } catch (error) {
        console.log("message error", error)
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
}


module.exports = { ResetPassword, GetCode, SendCode, Verified, VerifyUniqueId, ForgotPassword }