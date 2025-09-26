


import mongoose from "mongoose";
import { IToken } from "./models.dto";

const tokenSchema = new mongoose.Schema<IToken>({
  jti: {type: String, required:true ,unique :true},
  expiresIn: {type: Number, required:true }, 
  userId: {type: mongoose.Schema.Types.ObjectId,ref:"User", required:true }, 

},{
  timestamps:true,



});

const TokenModels=  mongoose.models.Token  || mongoose.model("Token", tokenSchema)
//  mongoose.Model.User  ||
TokenModels.syncIndexes()

export default TokenModels;