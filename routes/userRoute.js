const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middlewares/authmiddleware");
const mongoose = require("mongoose");

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
            users: users.map(item => ({
                id: item._id,
                name: item.name,
                email: item.email

            }))
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
        else{
            return res.status(400).send({ message: "Usuario no tiene permisos necesarios", success: false });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al eliminar usuario", success: false, error });
    }
});


router.post("/update", authMiddleware , async (req, res) => {
    try {
        const userId = await User.findOne({ _id: req.body.userId });
        if(userId.isAdmin)
        {

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
    }else {
        return res.status(400).send({ message: "Usuario no tiene permisos necesarios", success:false})
    }

    } catch (error) {
        console.log(error);
        res.status(500).send({ message: "Error al editar usuario", success: false, error });
    }
});


module.exports = router;