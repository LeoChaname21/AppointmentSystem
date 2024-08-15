const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);

const connection = mongoose.connection;

connection.on("connected",()=>{
    console.log("Mongo DB connected succesfull")
})

connection.on("error",(error)=>{
    console.log("Error in MongoDB connection",error)
})