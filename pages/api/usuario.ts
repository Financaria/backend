import type {NextApiRequest, NextApiResponse} from 'next';
import type {respostaPadrao} from '../../types/respostaPadrao';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { UsuarioModel } from '../../models/UsuarioModel';
import { validarToken } from '../../middlewares/validateTokenJWT';
import nc from "next-connect";
import { CORSPolicy } from './../../middlewares/CORSpolicy';


const handler = nc()
    .post(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao | any>) => {
        try{
            
        }catch(e){
            console.log(e);
        }
        return res.status(400).json({error : 'Não foi possível obter dados.'})
    });

    export default CORSPolicy(validarToken(conectarMongoDB(handler)));
