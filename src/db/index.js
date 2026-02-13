import mongoose  from "mongoose";
import { DB_NAME } from "../constants.js";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async()=>{
    try {
        const mongoUrl = process.env.MONGODB_URL?.replace(/\/+$/, ''); // Remove trailing slashes
        const connectionInstance = await mongoose.connect(`${mongoUrl}/${DB_NAME}`) 
        // here along with url we add db name also bcs there can be multiple db in mDB so its need to understand by which db we want to connect
        // if you have allready created the DB name in your mDB then use that same name here but in our case
        // we directly creating the DB name "videoTube" from here 
        console.log(`MONGO DB CONNECTED !! DB HOST: ${connectionInstance.connection.host}`);
        // the response is stored in connectionInstance by which we are logs the server address where our database is running
    } catch (error) {
        console.log("DATABASE CONNECTION FAULT",error);
        process.exit(1); //terminates the Node.js application immediately 
    }
}

export default connectDB;