import type {NextApiRequest, NextApiResponse} from 'next';
import type {respostaPadrao} from '../../types/respostaPadrao';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { UsuarioModel } from '../../models/UsuarioModel';
import { validarToken } from '../../middlewares/validateTokenJWT';
import nc from "next-connect";
import { CORSPolicy } from './../../middlewares/CORSpolicy';
import md5 from "md5";


const handler = nc()
    .get(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao | any>) => {
        try{
            const {userId} = req?.query;
            const  usuario = await UsuarioModel.findById(userId);
            usuario.senha = null
            return res.status(200).json(usuario);
        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível obter dados.'})
        }
    })
    .put(async(req : NextApiRequest, res : NextApiResponse<respostaPadrao | any>) => {
        try{
            const {userId} = req?.query;
            const usuario = await UsuarioModel.findById(userId);

            if(!usuario){
                return res.status(400).json({error : 'Usuário não encontrado.'});
            }

            const { nome, email, senha} = req?.body;

            if(nome && nome.length > 2){
                usuario.nome = nome;
            }

            if(email && email.length > 5
                && email.includes('@')
                && email.includes('.')){
                usuario.email = email;
            }

            if(senha && senha.length > 3){
                usuario.senha = md5(senha);
            }

            await UsuarioModel.findByIdAndUpdate({_id : usuario._id}, usuario);
            return res.status(200).json({msg : 'Usuário alterado com sucesso', usuario})

        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível alterar os dados.'});
        }
    });

    export default CORSPolicy(validarToken(conectarMongoDB(handler)));
