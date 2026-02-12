import dotenv from "dotenv"
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path : `./.env`
})

connectDB()
.then(()=>{
    const port=process.env.PORT;
    app.listen(port , ()=>{
        console.log(`Your app is running on server: http://localhost:${port}`)
    })
    app.on("error", (err) => {
      console.error("App error:", err);
    });
})
.catch((err)=>{
    console.log("Database is not connecting !!!",err);
    
})