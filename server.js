const express = require("express");
const {whatsapp} = require("./lib/whatsapp");
const cron = require('node-cron');
const moment = require("moment");
const User = require("./models/userModel");
const Doctor = require("./models/doctorModel");
const Appointments = require("./models/appointmentModel");

const app = express();

require("dotenv").config();

const dbConfig = require("./config/dbConfig");

app.use(express.json());

const userRoute = require("./routes/userRoute");

const adminRoute = require("./routes/adminRoute");

const doctorRoute = require("./routes/doctorsRoute")

console.log(new Date)

async function alertAppointments() {
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
            console.log("no estan aprobado el de la user"+appointment.userInfo.name)
        }
    }
}

cron.schedule('00 19 * * *', () => {
    alertsAppointments();
});

app.use("/api/user",userRoute);

app.use("/api/admin",adminRoute);

app.use("/api/doctor",doctorRoute);

const port = process.env.PORT || 5000;

whatsapp.initialize();


app.listen(port, () => console.log(`Node server started at port ${port}`));