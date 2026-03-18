import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app=express()

const rawCorsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173"
const allowedOrigins = rawCorsOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
const allowAllOrigins = allowedOrigins.includes("*")

// configuring CORS , and during this we use app.use (also when we take midllewares the also we take app.use)
app.use(cors({
    origin: (origin, callback) => {
        // Allow tools like Postman/curl and same-server requests without an Origin header.
        if (!origin) return callback(null, true)

        if (allowAllOrigins || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }

        return callback(new Error(`CORS blocked for origin: ${origin}`), false)
    }, // which frontend domain can access
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
import commentRouter from "./routes/comment.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"

//routes declaration 
app.use("/api/v1/users",userRouter)
app.use("/api/v1/videos",videoRouter)
app.use("/api/v1/comments",commentRouter)
app.use("/api/v1/dashboard",dashboardRouter)
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/playlists",playlistRouter)
app.use("/api/v1/subscriptions",subscriptionRouter)
app.use("/api/v1/tweets",tweetRouter)

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