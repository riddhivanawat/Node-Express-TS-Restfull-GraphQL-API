import crypto from "crypto";
import shortId from "shortid";
import jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import User from "../../models/noSql/user";
import { eApiErrorMessages, eUserError } from "../../models/enum/auth_enum";
import { returnType } from "../../configuration/helperServices/helperService";

dotenv.config();
const jwtSecreat = process.env.JWT_SECREATE || "";
const bcrypt = require("bcrypt");

export const signIn = (request: any, response: any) => {
  const email = request.body.email;
  const password = request.body.password;
  let logedUser: any;
  User.findOne({ email: email })
    .then((user: any) => {
      if (!user) {
        return returnType(response, 400, eUserError.user400, null);
      }
      logedUser = user;
      return bcrypt.compare(password, user?.password);
    })
    .then((isEqual: any) => {
      if (!isEqual) {
        return returnType(response, 401, eUserError.user401, null);
      }

      const token = jwt.sign(
        {
          userId: logedUser["_id"],
          email: logedUser["email"],
        },
        jwtSecreat,
        {
          expiresIn: "1d",
        }
      );
      response.cookie("token", token, { expiresIn: "1d", httpOnly: true });
      return returnType(response, 200, "SignIn Success!", { token });
    })
    .catch((err) => {
      return returnType(
        response,
        500,
        eApiErrorMessages.apiNoClueError_0,
        null
      );
    });
};

export const signUp = (request: any, response: any) => {
  // find user exist or not
  User.findOne({ email: request.body.email }).exec((err, user) => {
    if (user) {
      return returnType(response, 400, eUserError.user400, null);
    }
  });

  const { name, email, phone, accessType, password } = request.body;

  const username = shortId.generate();
  bcrypt
    .hash(password, 12)
    .then((hashPw: any) => {
      const profile = `${process.env.CLIENT_URL || "user"}/profile/${username}`;

      const newUser = new User({
        name: name,
        email: email,
        password: hashPw,
        profile: profile,
        username: username,
        phone: phone,
        accessType: accessType,
      });

      return newUser.save();
    })
    .then((result: any) => {
      return returnType(response, 201, "User created", result._id);
    })
    .catch((error: any) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      return returnType(
        response,
        500,
        eApiErrorMessages.apiNoClueError_0,
        error
      );
    });
};

export const signOut = (request: any, response: any) => {
  response.clearCookie("token");
  response.status(200).json({
    message: "User signout success!",
  });
};

export const resetPassowrd = (request: any, response: any) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return err;
    }
    const token = buffer.toString("hex");
    User.findOne();
  });
};