const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const authmiddleware = require("../middlewares/authmiddleware");

router.post("/get-doctor-info-by-id", authmiddleware , async(req,res)=>{
    try {
        const doctor = await Doctor.findOne({userId: req.body.userId});
        res.status(200).send({
            message: "Informacion encontrada exitosamente",
            success: true,
            data: doctor
        });

    } catch (error) {
        res.status(500).send({
            message: "Error al encontrar la informacion",
            success: false,
            error
        });
        
    }
});

router.post("/update-doctor-info-by-id", authmiddleware , async(req,res)=>{
    try {
        const doctor = await Doctor.findOneAndUpdate({userId: req.body.userId},req.body);
        res.status(200).send({
            message: "Informacion actualiza exitosamente",
            success: true,
            data: doctor
        });

    } catch (error) {
        res.status(500).send({
            message: "Error al actualizar la informacion",
            success: false,
            error
        });
        
    }
})

module.exports = router;