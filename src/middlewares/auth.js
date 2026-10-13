const { json } = require("express");
const jwt = require("jsonwebtoken");

module.exports = async (req, res, next) => {
    try{
        //get token
        const bearerHeader = req.headers['authorization']

        //check if bearer header exists in request
        if(bearerHeader !== undefined){
            //get the token from header
            const token = bearerHeader.split(' ')[1]

            //verify token
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
            //attach user info to the request
            req.token = decoded
            //move to next middleware/ route
            next()
        } else {
            const err = new Error("Forbidden")
            err.statusCode = 401
            throw err
        }

    }catch(error){
        //in case token is tampered
        if(error.name === "JsonWebTokenError"){
            const err = new Error("Invalid Token. Authentication Failed. Please login again.")
            err.statusCode = 401
            throw err
        }
        next(error)
    }
}