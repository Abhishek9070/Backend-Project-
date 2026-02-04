import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv.config({
    path : `./.env`
})

connectDB()
.then(()=>{
    const port=process.env.PORT;
    app.listen(port || 4000 , ()=>{
        console.log(`Your app is running on server: https://port`)
    })
    app.on("error", (err) => {
      console.error("App error:", err);
    });
})
.catch((err)=>{
    console.log("Database is not connecting !!!",err);
    
})