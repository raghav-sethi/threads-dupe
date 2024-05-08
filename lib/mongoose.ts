import mongoose from 'mongoose'

let isConnected = false

export const connectDB = async () => {
    mongoose.set('strictQuery', true)

    if(!process.env.MONGODB_URL) return console.log('No MongoDB URL');
    if(isConnected) return console.log('Already connected to MongoDB');
    
    try{
        await mongoose.connect(process.env.MONGODB_URL)
        isConnected = true;
        console.log('Connected to MongoDB')
    }
    catch(err){
        console.log(err)
    }
}