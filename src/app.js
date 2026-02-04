import express from "express"
import cookieParser from "cookie-parser"
import cores from "cores"

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))

app.use(express.json({limit:"20kb"})) // 
app.use(express.urlencoded({extended:true,limit:"20kb"}))
app.use(express.static())
app.use(cookieParser())
export {app}