import type { NextApiRequest, NextApiResponse } from "next";
import type { respostaPadrao } from "../../types/respostaPadrao";
import type { cadastroRequisicao } from "../../types/cadastroRequisicao";
import { UsuarioModel } from "../../models/UsuarioModel"

const endpointCadastro = async (
    req : NextApiRequest,
    res : NextApiResponse<respostaPadrao>
)  => {

    if(req.method === 'POST'){
        const usuario = req.body as cadastroRequisicao;

        if (!usuario.nome || usuario.nome.length < 2){
            return res.status(400).json({error : 'Nome inválido.'})
        }

        if(!usuario.email || usuario.email.length < 5
            || !usuario.email.includes('@')
            || !usuario.email.includes('.')){
            return res.status(400).json({error : 'Email inválido.'});
        }

        if(!usuario.senha || usuario.senha.length < 4){
            return res.status(400).json({error : 'Senha inválida.'});
        }

        await UsuarioModel.create(usuario);
        return res.status(200).json({msg : 'Usuário criado com sucesso.'})
    }
    return res.status(405).json({error : 'Método informado não é válido.'})
}

export default endpointCadastro;