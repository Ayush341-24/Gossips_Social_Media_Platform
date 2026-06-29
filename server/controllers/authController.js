export const register = async (req , res) => {
    try{
        res.status(200).json({
            message : "Register route Working",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};

export const login = async (req , res) => {
    try{
        res.status(200).json({
            message : "Login route Working",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};
export const logout = async (req , res) => {
    try{
        res.status(200).json({
            message : "Logout Successful",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};
export const getProfile = async (req , res) => {
    try{
        res.status(200).json({
            message : "Profile route Working",
        });
    }
    catch(error){
        res.status(500).json({
            message : error.message,
        });
    }
};

