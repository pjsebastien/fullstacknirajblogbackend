const { check, validationResult } = require('express-validator');

exports.postValidator = [
    check('title').trim().not().isEmpty().withMessage('Veuillez saisir un titre !'),
    check('content').trim().not().isEmpty().withMessage('Veuillez saisir un contenu !'),
    check('slug').trim().not().isEmpty().withMessage('Veuillez saisir un slug !'),
    check('meta')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Veuillez saisir les metas description !'),
    check('tags')
        .isArray()
        .withMessage('Les Tags doivent être un tableaux !')
        .custom(tags => {
            for (let t of tags) {
                if (typeof t !== 'string') {
                    throw Error('Les tags doivent être écris en toute lettre');
                }
            }
            return true;
        }),
];

exports.validate = (req, res, next) => {
    const error = validationResult(req).array();
    if (error.length) {
        return res.status(401).json({ error: error[0].msg });
    }
    next();
};
