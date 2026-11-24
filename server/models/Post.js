import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        caption: {
            type: String,
            default: "",
            trim: true,
            maxlength: 2200,
        },
        image: {
            type: String,
            required: true,
        },
        imagePublicId: {
            type: String,
            required: true,
        },
        likes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

    },
    {
        timestamps: true,
    }
);

postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ likes: 1 });
postSchema.index({ caption: "text" });

const Post = mongoose.model("Post" , postSchema);
export default Post;