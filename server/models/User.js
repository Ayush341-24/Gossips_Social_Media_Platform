import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
    {
        username : {
            type : String , 
            required : true , 
            trim : true ,
            maxlength : 20 , 
            unique : true , 
        },
        
        email : {
            type : String , 
            required : true , 
            unique : true , 
            lowercase : true , 
            trim : true ,
        },

        fullName : {
            type : String,
            trim : true,
            maxlength : 50,
            default : "",
        },

        password : {
            type : String , 
            required : true , 
            minlength : 6
        },

        profilePic : {
            type : String ,
            default : "",
        },

        profilePicPublicId : {
            type : String,
            default : "",
        },

        bio : {
            type : String , 
            default : "" , 
            maxlength : 150,
        },

        followers: [
            {
                type : mongoose.Schema.Types.ObjectId ,
                ref : "User" ,
            },
        ],

        following : [
            {
                type : mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps : true,
    }
);

userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.index({ fullName: 1 });

export default mongoose.model("User" , userSchema);