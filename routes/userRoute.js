const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");

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
        res.status(500).send({ message: "Error al crear usuario", success: false, error });

    }

});

router.get("/list", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send({ message: "Usuarios encontrados", success: true, users });
    } catch (error) {
        res.status(500).send({ message: "Error al obtener usuarios", success: false, error });
    }
});

router.post("/login", async (req, res) => {

    try {

    } catch (error) {

    }

});

module.exports = router;