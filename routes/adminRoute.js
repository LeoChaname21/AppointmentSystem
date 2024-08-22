const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const authMiddleware = require("../middlewares/authmiddleware");

router.get("/get-all-users", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send({
            message: "Usuarios encontrados",
            success: true,
            data: users
        });

    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: "Error al encontrar usuarios",
            success: false,
            error
        });

    }
});

router.get("/get-all-doctors", authMiddleware, async (req, res) => {
    try {
        const doctors = await Doctor.find({});
        res.status(200).send({
            message: "Doctores encontrados",
            success: true,
            data: doctors
        });

    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: "Error al encontrar doctores",
            success: false,
            error
        });

    }
});


router.post("/change-doctor-status", authMiddleware, async (req, res) => {
    try {
        const {doctorId,status,userIde} = req.body;
        const doctor = await Doctor.findByIdAndUpdate(doctorId,{ status });
        const user = await User.findOne({_id: userIde});

        const unseenNotifications = user.unseenNotifications;
        
        unseenNotifications.push({
            type:"request-doctor-acccount-changed",
            message: `Tu cuenta de doctor ha sido ${status}`,
            onclickPath: "/notifications"
        })
        await User.findByIdAndUpdate(user._id,{ unseenNotifications });

        res.status(200).send({
            message:"Estado del doctor actualizado correctamente",
            success: true,
            data: doctor
        });

    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: "Error al cambiar el estado del doctor",
            success: false,
            error
        });

    }
});


module.exports = router;