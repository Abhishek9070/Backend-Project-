import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app=express()

// configuring CORS , and during this we use app.use (also when we take midllewares the also we take app.use)
app.use(cors({
    origin:process.env.CORS_ORIGIN, // which frontend domain can access
    credentials:true // allow cookies to be send
}))

// Major config
app.use(express.json({limit:"20kb"})) // accepting json data which is comming from form with given limit
app.use(express.urlencoded({extended:true,limit:"20kb"})) // sometime data comes from url so take from there also 
app.use(express.static("public")) // serves static files (images, CSS, JS, PDFs, etc.) directly to the browser.
app.use(cookieParser())

// routes import 

import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"

//routes declaration 
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)

// Global error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || "Something went wrong"
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors: err.errors || [],
    })
})

export {app}