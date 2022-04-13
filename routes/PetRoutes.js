const router = require('express').Router()
const PetController = require('../controllers/PetControllers')

// middlewares
const verifyToken = require('../helpers/verify-token')
const { imageUpload } = require('../helpers/image-upload')

router.post('/create', verifyToken, imageUpload.array('images'), PetController.createPet)

module.exports = router