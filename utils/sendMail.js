const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const User = require("../models/Auth/User")
const bcrypt = require('bcrypt');
require('dotenv').config();
const UserVerification = require("../models/Auth/UserVerification")
var smtpTransport = require('nodemailer-smtp-transport'); // this is important



const sendEmail = async (subject, message, send_to, sent_from, reply_to) => {
  var transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    // tls: true,
    auth: {
      user: process.env.MAIL_USERNAME, // generated ethereal user
      pass: process.env.MAIL_PASSWORD, // generated ethereal password
    },
  });

  // Option for sending email
  const options = {
    from: sent_from,
    to: send_to,
    replyTo: reply_to,
    subject: subject,
    html: message,
  };

  // send email
  transporter.sendMail(options, function (err, info) {
    if (err) {
      console.log(err);
    } else {
      console.log(info);
    }
  });

  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

};


const sendVerificationEmail = async ({ _id, email }, res) => {
  try {

    var transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      // tls: true,
      auth: {
        user: process.env.MAIL_USERNAME, // generated ethereal user
        pass: process.env.MAIL_PASSWORD, // generated ethereal password
      },
    });

    const user = await User.findOne({ email: email }).exec();

    if (!user) {
      console.log("where is the user..", user)
      return;

    }

    const currentUrl = "http://localhost:5000/";

    const uniqueString = uuidv4() + _id;

    console.log("password is life..", uniqueString);

    
    // console.log("mail Options..", mailOptions);
    
    const saltRounds = 10;
    const hashedUniqueString = await bcrypt.hash(uniqueString, saltRounds)
    console.log("hashed Life...", hashedUniqueString);
    const newVerification = new UserVerification({
      userId: _id,
      username: user.username,
      uniqueString: uniqueString,
      createdAt: Date.now(),
      expiredAt: Date.now() + 21600000,
    });

    

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: email,
      subject: "Verify Your Email",
      html: `<p> Verify your email address to complete the signup and login into your account.</p>
     <p> This Link <b>expires in 6 hours</b>.</p> <p>Press <a href=${currentUrl + "user/verify/" + _id + "/" + uniqueString }> here</a> to proceed.</p>`,
    };
    console.log("hashed Email Life..", _id, "unique is the way of theString...", uniqueString)

    await newVerification.save();
    try {
      await transporter.sendMail(mailOptions)
      console.log("first mail..", newVerification);

    } catch (error) {
      console.log("error in the mud...", error);
      return
    }
  } catch (error) {
    console.log("what is the next..", error);
  }
}

module.exports = { sendEmail, sendVerificationEmail };