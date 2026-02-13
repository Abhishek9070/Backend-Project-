import dotenv from "dotenv" // we use this bcs as soon as server restart all the .env files can available to all 
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ 
    path : `./.env`  // path from where we will take all env file 
})

connectDB() // as DB connected and it is comming from async await so it will also return us a promise
.then(()=>{ 
    const port=process.env.PORT;
    app.listen(port , ()=>{  // listening our server 
        console.log(`Your app is running on server: http://localhost:${port}`)
    })
    app.on("error", (err) => { // it is an event listener that catches server-level errors from your Express app
      console.error("App error:", err);
    });
})
.catch((err)=>{
    console.log("Database is not connecting !!!",err);
    
})