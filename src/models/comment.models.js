import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentModel = new Schema ({
    comment:{
        type:String,
        required:true
    },
    video:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true})

commentModel.plugin(mongooseAggregatePaginate)
export const Comment=mongoose.model("Comment",commentModel)