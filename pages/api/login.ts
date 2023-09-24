import { CORSPolicy } from './../../middlewares/CORSpolicy';
import type { NextApiRequest, NextApiResponse } from "next";
import { conectarMongoDB } from '../../middlewares/conectarMongoDB'
import type { respostaPadrao } from "../../types/respostaPadrao"
import type { loginResposta } from "../../types/loginResposta"
import md5 from "md5";
import { UsuarioModel } from "../../models/UsuarioModel";
import jwt from 'jsonwebtoken';

const endpointLogin = async (
    req : NextApiRequest, 
    res : NextApiResponse<respostaPadrao | loginResposta>
) => {

    const {JWT_PRIVATE_KEY} = process.env;
    if(!JWT_PRIVATE_KEY){
        return res.status(500).json({error : 'ENV JWT não informada.'});
    }

    if(req.method === 'POST'){
        const {login, senha} = req.body;
       
        // checar se o usuário existe no banco
        const usuariosEncontrados = await UsuarioModel.find({email : login, senha : md5(senha)});

        if(usuariosEncontrados && usuariosEncontrados.length > 0){
            const usuarioEncontrado = usuariosEncontrados[0];

            const token = jwt.sign({_id : usuarioEncontrado._id}, JWT_PRIVATE_KEY);
            return res.status(200).json({
                nome : usuarioEncontrado.nome, 
                email : usuarioEncontrado.email, 
                token});
        }
        return res.status(400).json({msg : 'Usuário ou senha não encontrados.'});
    }
    return res.status(405).json({error : 'Método informado não é válido.'});
}

export default CORSPolicy(conectarMongoDB(endpointLogin));