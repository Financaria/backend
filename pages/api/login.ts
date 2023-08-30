import type { NextApiRequest, NextApiResponse } from "next";
import { conectarMongoDB } from '../../middlewares/conectarMongoDB'
import type { respostaPadrao } from "../../types/respostaPadrao"

const endpointLogin = (
    req : NextApiRequest, 
    res : NextApiResponse<respostaPadrao>
) => {
    if(req.method === 'POST'){
        const {login, senha} = req.body;

        if(login === 'admin@admin.com' &&
            senha === 'Admin@123'){
                return res.status(200).json({msg : 'Usuário autenticado com sucesso.'});
            }
            return res.status(400).json({msg : 'Usuário ou senha não encontrados.'});
    }
    return res.status(405).json({error : 'Método informado não é válido.'});
}

export default conectarMongoDB(endpointLogin);