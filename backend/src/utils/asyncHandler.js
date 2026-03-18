// This is a higher order function - fn which accept fn as parameter 
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}


export {asyncHandler}

// by async await 
/*
const as=()=>{} // creating a function
const as=(fn)=>{} // sending function into a function (higher order fn)
const as=(fn)=>()=>{} // sending fn to next function
const as=(fn)=>async()=>{} // making it async fn
*/

//Making a wrapper function which we will use it many times later 
/*
const asyncHandler=(fn)=> async(req,res,next)=>{
    try {
        await(req,res,next)
    } catch (error) {
        res.status(err.code || 400).jason({
            sucess:false,
            message:err.message
        })
    }
}
*/