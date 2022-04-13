const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

// Helpers
const createUserToken = require('../helpers/create-user-token')
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class UserController {

    static async register(req, res) {
        
        const { name, email , phone, password, confirmpassword } = req.body

        //validations
        if(!name) {
            res.status(422).json({ message: 'O nome é obrigatório!'})
            return
        }

        if(!email) {
            res.status(422).json({ message: 'O email é obrigatório!'})
            return
        }

        if(!phone) {
            res.status(422).json({ message: 'O seu numero é obrigatório!'})
            return
        }

        if(!password) {
            res.status(422).json({ message: 'Definir uma senha é obrigatório!'})
            return
        }

        if(!confirmpassword) {
            res.status(422).json({ message: 'Você não confirmou sua senha'})
            return
        }

        if(password !== confirmpassword) {
            res.status(422).json({ message: 'As senhas não sãi iguais, tente novamente!'})
            return
        }
    //check if user exists
    
        const userExists = await User.findOne( { email: email} )

        if(userExists) {
            res.status(422).json({
                message: 'Por favor, utilize outro e-mail'
            })
            return
        }

        // create a password
        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

        // create a user
        const user = new User({
            name:name,
            email: email,
            phone: phone,
            password: passwordHash

        })

        try {
            
            const newUser = await user.save()
            
            await createUserToken(newUser, req, res)
        } catch (err) {
            res.status(500).json({ message: error})
        }
     
    }

    static async login(req, res) {

        const { email, password } = req.body

        if(!email) {
            res.status(422).json({ message: 'Preencha todos os campos'})
            return
        }
        if(!password) {
            res.status(422).json({ message: 'Preencha todos os campos'})
            return
        }

        //check if user exists
    
        const user = await User.findOne( { email: email} )

        if(!user) {
            res.status(422).json({
                message: 'Não há usuario cadastrado com esse e-mail.'
            })
            return
        }

        // check if password with db password
        const checkPassword = await bcrypt.compare(password, user.password)

        if(!checkPassword) {
            res.status(422).json({
                message: 'Senha incorreta, tente novamente'
            })
            return
        }

        await createUserToken(user, req, res)
    }

    static async checkUser(req, res) {

        let currentUser


        if(req.headers.authorization) {

            const token = getToken(req)
            const decoded = jwt.verify(token, 'nossosecret')

            currentUser = await User.findById(decoded.id)

            currentUser.password = undefined

        } else {
            currentUser = null
        }

        res.status(200).send(currentUser)
    }

    static async getUserById(req, res) {

        const id = req.params.id
        const user = await User.findById(id).select('-password')

        if(!user) {
            res.status(422).json({ message: 'Usuario não encontrado'})
            return
        }

        res.status(200).json({ user })

    }

    static async editUser(req, res) {

        const id = req.params.id
        const token = getToken(req)
        const user = await getUserByToken(token)
        const { name, email, phone, password, confirmpassword } = req.body

        let image = ''


        // validations  
        
        if(!name) {
            res.status(422).json({ message: 'O nome é obrigatório!'})
            return
        }

        user.name = name

        if(!email) {
            res.status(422).json({ message: 'O email é obrigatório!'})
            return
        }

        //check if email has already taken
        const userExists = await User.findOne({email: email})

        if(user.email !== email && userExists) {
            res.status(422).json({ message: 'Por favor, tente outro e-mail!'})
            return
        }

        user.email = email

        if(!phone) {
            res.status(422).json({ message: 'O seu numero é obrigatório!'})
            return
        }

        user.phone = phone

        if(password != confirmpassword) {
            res.status(422).json({ message: 'As senhas não conferem'})
            return
        } else if( password === confirmpassword && password != null) {
            
            //creating password
            const salt = await bcrypt.genSalt(12)
            const passwordHash = await bcrypt.hash(password, salt)

            user.password = passwordHash
        }

        try {
            
            //returns user updated data
            await User.findOneAndUpdate(
                {_id: user._id},
                {$set: user},
                {new: true},
            )

            res.status(200).json({
                message: 'Usuario atualizado com sucesso'
            })

        } catch (err) {
            res.status(500).json({ message: err})
            return
        }
 
   
    }

}