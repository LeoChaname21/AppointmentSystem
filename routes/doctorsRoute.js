const express = require("express");
const router = express.Router();
const Doctor = require("../models/doctorModel");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const authmiddleware = require("../middlewares/authmiddleware");
const { findOne } = require("../models/userModel");

router.post("/get-doctor-info-by-user-id", authmiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.body.userId });
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

router.post("/get-doctor-info-by-id", authmiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ _id: req.body.doctorId });
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

router.post("/update-doctor-profile", authmiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOneAndUpdate({ userId: req.body.userId }, req.body);
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
});

router.post("/get-appoitments-by-doctor-id", authmiddleware, async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ userId: req.body.userId });
        const appointments = await Appointment.find({ doctorId: doctor._id });
        res.status(200).send({
            message: "citas encontradas del doctor",
            success: true,
            data: appointments
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error al encontrar citas",
            success: false,
            error
        });

    }
});

router.post("/change-status", authmiddleware, async (req, res) => {
    try {
        const { appointmentId, status } = req.body;
        const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status });

        const user = await User.findOne({ _id: appointment.userId });
        const unseenNotifications = user.unseenNotifications;
        unseenNotifications.push({
            type: "appointment-status-changed",
            message: `Se ha ${status} tu cita`,
            onclickPath: "/appointments"
        })
        await user.save();

        res.status(200).send({
            message: `Estado de la cita actualizada correctamente`,
            sucess: true,
            appointment
        });
    } catch (error) {
        res.status(500).send({
            message: "Error al cambiar el estado de la cita",
            sucess: false,
            error
        });

    }
});

module.exports = router;