import type {NextApiRequest, NextApiResponse} from 'next';
import type {respostaPadrao} from '../../types/respostaPadrao';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { DespesaModel } from '../../models/DespesaModel';
import { UsuarioModel } from '../../models/UsuarioModel';
import { validarToken } from '../../middlewares/validateTokenJWT';

const endpointDespesa = async (
    req : NextApiRequest,
    res : NextApiResponse<respostaPadrao | any>
) => {
    try{
        const {userId} = req?.query;
        const usuario = await UsuarioModel.findById(userId);

        if(!usuario){
            return res.status(400).json({error : 'Usuário não encontrado.'});
        }

        if(req.method === 'POST'){
            if(!req || !req.body){
                return res.status(400).json({error : 'Parâmetros de entrada não informados.'});
            }
            const {descricao, categoria, valor, dataVencimento, dataPagamento, parcelas, recorrencia} = req?.body;

            if(!descricao || descricao.length < 2){
                return res.status(400).json({error : 'Descrição não é válida.'});
            }

            if(!valor){
                return res.status(400).json({error : 'É necessário informar um valor.'});
            }

            if(!dataVencimento){
                return res.status(400).json({error : 'É necessário informar a data de vencimento.'});
            }

            const despesa = {
                idUsuario : usuario._id,
                descricao,
                categoria,
                valor,
                dataVencimento,
                dataPagamento,
                dataInclusao : new Date(),
                parcelas,
                recorrencia
            }
            
            await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: -despesa.valor } });

            await DespesaModel.create(despesa);
            return res.status(201).json({ msg: 'Despesa cadastrada com sucesso.' });

        }
            
    }catch(e){
        console.log(e);
        return res.status(400).json({error: 'Erro ao cadastrar despesa.'});
    }

}

export default validarToken(conectarMongoDB(endpointDespesa));