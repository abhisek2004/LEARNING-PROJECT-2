// const mongoose=require('mongoose')
import mongoose from 'mongoose'

const {Schema}=mongoose

const BookTableSchema=new Schema(
    {
        firstName:String,
        email:String,
        tableNum:BigInt,
        time:Date,
        
    }
)

