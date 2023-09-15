import type {NextApiRequest, NextApiResponse} from 'next';
import type {respostaPadrao} from '../../types/respostaPadrao';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { DespesaModel } from '../../models/DespesaModel';
import { UsuarioModel } from '../../models/UsuarioModel';
// import { validarToken } from '../../middlewares/';

const endpointDespesa = async (
    req : NextApiRequest,
    res : NextApiResponse<respostaPadrao>
) => {

    if(req.method === 'POST'){
        // pegar os dados do usuário logado  -  como eu pego os dados do usuario logado?

        try{
            // const {userId} = req.query;

            const {idUsuario, descricao, categoria, valor, dataVencimento, dataPagamento, parcelas, recorrencia} = req.body;
            
            const usuario = await UsuarioModel.findById(idUsuario);   // ({email : login, senha : md5(senha)})
            if(!usuario){
                return res.status(400).json({error : 'Usuário não encontrado.'});
            }

            

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

            if(!dataPagamento){
                dataPagamento : dataVencimento;
                console.log('dataVencimento', dataVencimento)
            }

            const despesa = {
                // idUsuario : usuario._id,
                idUsuario,
                descricao,
                categoria,
                valor,
                dataVencimento,
                dataPagamento : dataVencimento,
                dataInclusao : new Date(),
                parcelas,
                recorrencia    
            }

            await DespesaModel.create(despesa)
            return res.status(200).json({msg : 'Despesa criada com sucesso.'});
        }catch(e){
            console.log(e);
            return res.status(400).json({error: 'Erro ao cadastrar despesa.'});
        }

    }

}

export default conectarMongoDB(endpointDespesa);