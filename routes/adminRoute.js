const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Appointments = require("../models/appointmentModel");
const authMiddleware = require("../middlewares/authmiddleware");
const { whatsapp } = require("../lib/whatsapp");
const moment = require("moment");

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
        res.status(500).send({
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
        res.status(500).send({
            message: "Error al encontrar doctores",
            success: false,
            error
        });

    }
});


router.post("/change-doctor-account-status", authMiddleware, async (req, res) => {
    try {
        const { doctorId, status } = req.body;
        const doctor = await Doctor.findByIdAndUpdate(doctorId, { status });
        const user = await User.findOne({ _id: doctor.userId });

        const unseenNotifications = user.unseenNotifications;

        unseenNotifications.push({
            type: "request-doctor-acccount-changed",
            message: `Tu cuenta de doctor ha sido ${status}`,
            onclickPath: "/notifications"
        })
        user.isDoctor = status === "approved" ? true : false;
        await user.save();

        res.status(200).send({
            message: "Estado del doctor actualizado correctamente",
            success: true,
            data: doctor
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error al cambiar el estado del doctor",
            success: false,
            error
        });

    }
});

router.get("/get-all-appointments", authMiddleware, async (req, res) => {
    try {
        const appointments = (await Appointments.find({}));
        res.status(200).send({
            message: "Citas encontradas",
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

router.get("/message-next-day", authMiddleware, async (req, res) => {
    try {

        processAppointments();

        res.status(200).send({
            message: "Mensajes mandados correctamente",
            success: true,
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error al mandar mensajes de aviso",
            success: false,
            error
        });

    }
});


async function processAppointments() {
    const today = new Date(); // Fecha actual
    today.setHours(0, 0, 0, 0);

    // Obtener la fecha de mañana
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const appointments = await Appointments.find({});

    const appointmentsForTomorrow = appointments.filter(a => {
        const appointmentDate = new Date(a.date);
        appointmentDate.setHours(0, 0, 0, 0); // Reiniciar las horas para comparar solo la fecha
        return appointmentDate.getTime() === tomorrow.getTime();
    });

    for (const a of appointmentsForTomorrow) {
        console.log((a._id).toString());

        // Buscar la cita en la base de datos
        const appointment = await Appointments.findOne({ _id: a._id });

        // Verificar si el estado es aprobado
        if (appointment.status === "approved") {

            // Buscar el usuario y el doctor relacionados con la cita
            const user = await User.findOne({ _id: appointment.userId });
            const doctor = await Doctor.findOne({ userId: appointment.doctorInfo.userId });

            // Construir el número de teléfono
            const tel = '+51' + user.phonenumber;
            const normalDate = moment(appointment.date).format("DD-MM-YYYY");
            const normalTime = moment(appointment.time).format("HH:mm");
            console.log(tel);

            // Crear el chatId para enviar el mensaje por WhatsApp
            const chatId = tel.substring(1) + "@c.us";
            const number_details = await whatsapp.getNumberId(chatId);

            // Si el número es válido, enviar el mensaje de aprobación
            if (number_details) {
                const mensaje = `¡Hola ${user.name}! Tiene cita con el Doctor ${doctor.firstName} ${doctor.lastname} el día de mañana ${normalDate} a las ${normalTime}.`;
                await whatsapp.sendMessage(chatId, mensaje);
            }
        }
        else {
            console.log("no estan aprobadosxd")
        }
    }
}

module.exports = router;