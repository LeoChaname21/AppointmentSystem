const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const Doctor = require("../models/doctorModel");
const Appointment = require("../models/appointmentModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authmiddleware");
const mongoose = require("mongoose");
const moment = require("moment");
const {whatsapp}= require("../lib/whatsapp");

router.post("/register", async (req, res) => {

    try {
        const userExist = await User.findOne({ name: req.body.name });
        const EmailExist = await User.findOne({ email: req.body.email });
        if (userExist) {
            return res.status(200).send({ message: "Nombre de usuario ya existe", status: false });
        }
        if (EmailExist) {
            return res.status(200).send({ message: "Email ya existe", status: false });
        }

        const password = req.body.password;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        req.body.password = hashedPassword;
        const newuser = new User(req.body);
        await newuser.save();
        res.status(200).send({ message: "Usuario Creado Exitosamente", success: true });

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al crear usuario", success: false, error });

    }

});

router.get("/list", authMiddleware, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send({
            message: "Usuarios encontrados", success: true,
            data: users
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al obtener usuarios", success: false, error });
    }
});

router.post("/login", async (req, res) => {

    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(200).send({ message: "Usuario no existe", success: false });
        }
        const isMatch = await bcrypt.compare(req.body.password, user.password);
        if (!isMatch) {
            return res.status(200).send({ message: "La contraseña es incorrecta", success: false });
        }
        else {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
                expiresIn: "1d"
            })
            res.status(200).send({ message: "Ha accedido exitosamente", success: true, data: token });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al iniciar sesión", success: false, error });
    }

});

router.post("/get-user-info-by-id", authMiddleware, async (req, res) => {

    try {
        const user = await User.findOne({ _id: req.body.userId });
        user.password = undefined;
        if (!user) {
            return res.status(200).send({
                message: "Usuario no existe",
                success: false
            });
        } else {
            res.status(200).send({
                success: true,
                data: user
            });
        }

    } catch (error) {
        res.status(500).send({
            message: "Error al cargar informacion del usuario",
            success: false
        });

    }

});

router.post("/delete", authMiddleware, async (req, res) => {
    try {
        const userId = await User.findOne({ _id: req.body.userId });
        if (userId.isAdmin) {

            if (!mongoose.Types.ObjectId.isValid(req.body._id)) {
                return res.status(400).send({ message: "ID inválido", success: false });
            }
            const user = await User.findOne({ _id: req.body._id });
            if (!user) {
                return res.status(200).send({ message: "Usuario no existe", success: false });
            } else {
                await User.deleteOne({ _id: req.body._id });
                res.status(200).send({ message: "Usuario Eliminado Exitosamente", success: true });
            }
        }
        else {
            return res.status(400).send({ message: "Usuario no tiene permisos necesarios", success: false });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al eliminar usuario", success: false, error });
    }
});


router.post("/update", authMiddleware, async (req, res) => {
    try {
        const userId = await User.findOne({ _id: req.body.userId });
        if (userId.isAdmin) {

            if (!mongoose.Types.ObjectId.isValid(req.body._id)) {
                return res.status(400).send({ message: "ID inválido", success: false });
            }
            const user = await User.findOne({ _id: req.body._id });
            if (!user) {
                return res.status(200).send({ message: "Usuario no existe", success: false });
            }
            else {
                await User.updateOne({ _id: req.body._id }, req.body);
                res.status(200).send({ message: "Usuario Editado Exitosamente", success: true });

            }
        } else {
            return res.status(400).send({ message: "Usuario no tiene permisos necesarios", success: false })
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al editar usuario", success: false, error });
    }
});

router.post("/apply-doctor-account", authMiddleware, async (req, res) => {
    try {
        const newDoctor = new Doctor({ ...req.body, status: "pending" });
        await newDoctor.save();
        const adminUser = await User.findOne({ "isAdmin": true });
        const unseenNotifications = adminUser.unseenNotifications;

        unseenNotifications.push({
            type: "new-doctor-request",
            message: `${newDoctor.firstName} ${newDoctor.lastname} ha aplicado para la cuenta de Doctor`,
            data: {
                doctorId: newDoctor._id,
                name: newDoctor.firstName + " " + newDoctor.lastname
            },
            onclickPath: "/admin/doctorslist"
        })
        await User.findByIdAndUpdate(adminUser._id, { unseenNotifications });

        res.status(200).send({ message: "Ha Aplicado a Cuenta de Doctor Exitosamente", success: true });

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error al aplicar cuenta de Doctor",
            success: false,
            error
        })

    }
})

router.post("/mark-all-notifications-as-seen", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId });
        const seenNotifications = user.seenNotifications;
        const unseenNotifications = user.unseenNotifications;
        seenNotifications.push(...unseenNotifications);
        user.unseenNotifications = [];
        user.seenNotifications = seenNotifications;
        const updateUser = await user.save();
        updateUser.password = undefined;
        res.status(200).send({
            message: "Las notificaciones han sido marcadas como vistas",
            success: true
        });


    } catch (error) {
        res.status(500).send({
            message: "Las notificaciones no fueron marcadas",
            success: false
        })

    }

});

router.post("/delete-all-notifications", authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.userId })
        user.seenNotifications = [];
        user.unseenNotifications = [];
        const updateUser = await user.save();
        updateUser.password = undefined;
        res.status(200).send({
            message: "Todas las notificaciones han sido eliminadas",
            success: true
        });

    } catch (error) {
        console.log(error);
        res.status(200).send({
            message: "Error al eliminar las notificaciones",
            success: false,
            error
        });
    }

});

router.get("/get-all-approved-doctors", authMiddleware, async (req, res) => {
    try {
        const doctors = await Doctor.find({ status: "approved" });
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

router.post("/book-appointment", authMiddleware, async (req, res) => {
    try {
        req.body.status = "pending";
        const dcita = req.body.date;
        req.body.date = moment(req.body.date,"DD-MM-YYYY").toISOString();
        const hcita = req.body.time;
        req.body.time = moment(req.body.time,"HH:mm").toISOString();
        const newappointment = new Appointment(req.body);
        await newappointment.save();
        const user = await User.findOne({ _id: req.body.doctorInfo.userId });
        user.unseenNotifications.push({
            type: "new-appointment-request",
            message: `Una nueva cita se ha realizado por ${req.body.userInfo.name}`,
            onclickPath: "/doctor/appointments"
        });
        await user.save();

        const tel = '+51'+req.body.userInfo.phonenumber;
        console.log(tel);
        const chatId = tel.substring(1) + "@c.us";
        const number_details = await whatsapp.getNumberId(chatId);
        if(number_details){
            const mensaje = "¡Hola "+req.body.userInfo.name+"!"+" Se ha registrado su cita con el Doctor "+
            req.body.doctorInfo.firstName + " "+ req.body.doctorInfo.lastname+
            " a las "+ hcita +" el dia "+dcita;
            await whatsapp.sendMessage(chatId,mensaje);
            res.status(200).send({
                message: "La cita ha sido registrada con exito",
                success: true
            });
        }
        else{
            res.status(200).send({
                message: "se dio la cita pero no se ha mandado el mensaje de wsp",
                success: true
            });
        }
        
        

    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error al registrar la cita",
            success: false,
            error
        });

    }

});

router.post("/check-booking-avilability",authMiddleware, async(req,res)=>{
    try {
        const date = moment(req.body.date, "DD-MM-YYYY").toISOString();
        const fromTime = moment(req.body.time, "HH:mm").subtract(59 ,"minutes").toISOString();
        const toTime = moment(req.body.time, "HH:mm").add(59, "minutes").toISOString();
        const doctorId = req.body.doctorId;
        const appointments = await Appointment.find({
           doctorId,
           date,
           time: {$gte: fromTime, $lte: toTime },
        });

        if(appointments.length > 0){
            return res.status(200).send({
                message: "Cita no disponible",
                success: false
            })
        }
        else{
            return res.status(200).send({
                message: "Cita disponible",
                success: true
            })
        }
        
        
    } catch (error) {
        console.log(error);

        res.status(500).send({
            message: "Error al ver la disponibilidad de la cita",
            success: false,
            error
        })
        
    }
});

router.post("/get-appointments-by-user-id",authMiddleware,async(req,res)=>{
    try {
        const appointments = await Appointment.find({userId: req.body.userId});
        res.status(200).send({
            message: "Citas encontradas",
            success: true,
            data: appointments
        })
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error al encontrar citas",
            sucess: false,
            error
        })
        
    }
});


module.exports = router;


// {
//     "userId":"ss",
//     "firstName":"ss",
//     "lastname":"ss",
//     "email":"ss",
//     "phoneNumber":15,
//     "website":"ss",
//     "address":"ss",
//     "specialization":"ss",
//     "experience":"ss",
//     "feePerConsultation": 15,
//     "timings":{
//         "name": "leo",
//         "name2": "sex"
//     }
//     }