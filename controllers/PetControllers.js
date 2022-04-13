const Pet = require('../models/Pet')

//helpers
const getToken = require('../helpers/get-token')
const getUserByToken = require('../helpers/get-user-by-token')

module.exports = class PetController {

    static async createPet(req, res) {
        
        const {name, age, weight, color } = req.body
        const images = req.files
        const available = true

        // images upload

        // validations
        if(!name) {
            res.status(422).json({message: 'O nome é obrigatorio!'})
            return
        }
        if(!age) {
            res.status(422).json({message: 'A idade é obrigatorio!'})
            return
        }
        if(!weight) {
            res.status(422).json({message: 'O peso é obrigatorio!'})
            return
        }
        if(!color) {
            res.status(422).json({message: 'A cor é obrigatoria!'})
            return
        }
        if(images.length === 0) {
            res.status(422).json({message: 'A imagem é obrigatoria!'})
            return
        }

        // get pet owner
        const token = getToken(req)
        const user = await getUserByToken(token)

        // create a pet
        const pet = new Pet({
            name,
            age,
            weight,
            color,
            available,
            images: [],
            user: {
                _id : user._id,
                name: user.name,
                image: user.image,
                phone : user.phone,
            }
        })

        images.map((image) => {
            pet.images.push(image.filename)
        })

        try {

            const newPet = await pet.save()
            res.status(201).json({
                message: "Pet registrado com sucesso!",
                newPet
            })
            
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: err})
        }
    }

}