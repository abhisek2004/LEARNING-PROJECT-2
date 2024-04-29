// const mongoose=require('mongoose')
import mongoose from 'mongoose'

const {Schema}=mongoose

const BookTableSchema=new Schema(
    {
        firstName:{
            type:String,
            required:true
        },
        lastName:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        tableType:{
            type:String,
            required:true
        },
        guestNum:{
            type:Number,
            // required:true
        },
        time:{
            type:String,
            required:true
        },
        date:{
            type:String,
            required:true
        },
        note:{
            type:String,
            required:false
        }
        
    }
)

const userSchema=new Schema(
    {
        name:{
            type:String,
            required:true
        },
        email:{
            type:String,
            required:true
        },
        password:{
            type:String,
            required:true
        }
    }
)

const cartItemSchema=new mongoose.Schema(
    {
        userName:String,
        name:String,
        quantity:Number,
        price:Number
    }
)

const adminUsers=new mongoose.Schema({
    username:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
})

const cartItem = mongoose.model('CartItem',cartItemSchema);
const BookTable=mongoose.model('BookTable',BookTableSchema)
const users=mongoose.model('users',userSchema)
const admins=mongoose.model('admins',adminUsers)

export{BookTable,users,cartItem,admins}