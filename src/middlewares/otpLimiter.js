const { RateLimiterMemory } = require("rate-limiter-flexible")

//5 requests per day
const otpDailyLimiter = new RateLimiterMemory({
    points : 5,
    duration: 24 * 60 * 60
})

const otpRateLimiter = async(req, res, next) => {
    const phone = req.body.mobile;
    if(!phone){
        return res.status(400).json({ error: "Phone number is required" });
    }
    
    // ✅ Check daily rule
    try {
        await otpDailyLimiter.consume(phone);
    } catch (rejRes) {
        const retrySec = Math.round(rejRes.msBeforeNext / 1000) || 1;

        return res.status(429).json({
            status : 0,    
            message: `OTP limit has been reached. Please try after 24 hour`
        });
    }

    next();

}

module.exports = otpRateLimiter