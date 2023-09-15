import type {NextApiRequest, NextApiResponse} from 'next';
import type {respostaPadrao} from '../../types/respostaPadrao';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { DespesaModel } from '../../models/DespesaModel';
import { UsuarioModel } from '../../models/UsuarioModel';
// import { validarToken } from '../../middlewares/';

const endpointDespesa = (
    req : NextApiRequest,
    res : NextApiResponse<respostaPadrao>
) => {

    if(req.method === 'POST'){
        // pegar os dados do usuário logado  -  como eu pego os dados do usuario logado?

        const {descricao, valor, dataVencimento, parcelas, recorrencia, categoria} = req.body;

        if(!req || !req.body){
            return res.status(400).json({error : 'Parâmetros de entrada não informados.'});
        }

        if(!descricao || descricao.length < 2){
            return res.status(400).json({error : 'Descrição não é válida.'});
        }

        if(!valor){
            return res.status(400).json({error : 'É necessário informar um valor.'});
        }

        if(!dataVencimento){
            return res.status(400).json({error : 'É necessário informar uma data.'});
        }

        return res.status(200).json({msg : 'Despesa está válida.'});

    }else{
        return res.status(405).json({error : 'Método informado não é válido.'});
    }
}

export default conectarMongoDB(endpointDespesa);