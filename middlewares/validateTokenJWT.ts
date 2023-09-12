
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import jwt, {JwtPayload} from "jsonwebtoken";

export const validarToken = (handler : NextApiHandler) => (req : NextApiRequest, res: NextApiResponse<respostaPadrao>) => {

    try {
        const { JWT_PRIVATE_KEY } = process.env;

        if(!JWT_PRIVATE_KEY){
            return res.status(500).json({error : 'Erro interno do servidor: A chave privada JWT não está configurada corretamente.'});
        }
    
        if(!req || !req.headers){
            return res.status(400).json({error : 'Erro interno do servidor: A requisição não contém cabeçalhos válidos.'});
        }

        if(req.method === 'OPTIONS'){
            
            //pegar o token no authorization
            const authorization = req.headers['authorization'];
            if (!authorization){
                return res.status(401).json({ error: 'Ocorreu um erro ao validar o token de acesso.'});
            }

            //retirar "bearer "
            const token = authorization.substring(7);
            if (!token){
                return res.status(401).json({ error: 'Ocorreu um erro ao validar o token de acesso.'});
            }

            //Recebe o token a ser verificado e a chave de assinatura e criptografia.
            const decoded = jwt.verify(token, JWT_PRIVATE_KEY as string) as JwtPayload;
            if (!decoded){
                return res.status(401).json({ error: 'Ocorreu um erro ao validar o token de acesso.'});
            }

            // verificar se existe query na requisição, se não, cria ela com array vazio.
            if (!req.query){
                req.query = {};
            }

            //A propriedade userId está sendo adicionada ao objeto req.query, se ela ainda não existir. Se já existir, seu valor será atualizado com o valor de decoded._id.
            req.query.userId = decoded._id;
        
        }
    
        
     
    } catch (e) {
        console.log(e);
        res.status(500).json({ error: 'Ocorreu um erro ao validar o token de acesso.' });
    }
    
    return handler(req, res);

}