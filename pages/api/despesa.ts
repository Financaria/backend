import type {NextApiRequest, NextApiResponse} from 'next';
import type {respostaPadrao} from '../../types/respostaPadrao';
import { conectarMongoDB } from '../../middlewares/conectarMongoDB';
import { DespesaModel } from '../../models/DespesaModel';
import { UsuarioModel } from '../../models/UsuarioModel';
import { validarToken } from '../../middlewares/validateTokenJWT';
import nc from "next-connect";
import { CORSPolicy } from './../../middlewares/CORSpolicy';


const handler = nc()
    .post(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao | any>) => {
        try{
            const {userId} = req?.query;
            const usuario = await UsuarioModel.findById(userId);

            if(!usuario){
                return res.status(400).json({error : 'Usuário não encontrado.'});
            }

            //console.log(req.body)
            //console.log('categoria', req?.body?.categoria)
            console.log('req', req)

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

        }catch(e){
            console.log(e);
        }
        return res.status(400).json({error: 'Erro ao cadastrar despesa.'}); 
    })
    .get(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao | any[]>) => {
        try{
            const {userId} = req?.query;
            const usuario = await UsuarioModel.findById(userId);
            console.log('usuario', usuario);

            if(!usuario){
                return res.status(400).json({error: 'Usuário não encontrado.'});
            }

            const {filtro} = req.query;
            const anoAlvo = 2023;
            const mesAlvo = parseInt(filtro);
            
            if(!filtro || filtro.length < 2){
                const despesas = await DespesaModel.find({idUsuario: userId})
                .sort({dataInclusao : -1});;
                return res.status(200).json(despesas);
            }
            
            const despesasEncontradas = await DespesaModel.find({
                $or: [{ descricao: {$regex : filtro, $options : 'i'}},
                    { categoria: {$regex: filtro, $options : 'i'}},
                    { 
                        $expr: {
                            $and: [
                                { $eq: [{ $year: '$dataVencimento' }, anoAlvo]},
                                { $eq: [{ $month: '$dataVencimento' }, mesAlvo]}
                                
                            ]
                        }
                    },
                    { 
                        $expr: {
                            $and: [
                                { $eq: [{ $year: '$dataPagamento' }, anoAlvo]},
                                { $eq: [{ $month: '$dataPagamento' }, mesAlvo]}
                            ]
                        }
                    },
                    { dataVencimento: filtro },
                    { dataPagamento: filtro }
                ],
                $and: [{idUsuario : usuario._id}]
            });
            return res.status(200).json(despesasEncontradas);

        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível obter dados.'})
        }

    })
    .put(async(req : NextApiRequest, res : NextApiResponse<respostaPadrao> | any) => {
        try{
            const {id} = req?.query;
            //const usuario = await UsuarioModel.findById(userId);
            const despesa = await DespesaModel.findById(id);
            //.findOne(_idUsuario : userId && )

            if(!despesa){
                return res.status(400).json({error: 'Despesa não encontrada.'});
            }

            const {descricao} = req.body;
            console.log(descricao);
            if(descricao && descricao > 2){
                despesa.descricao = descricao;
                //console.log(descricao);

            }

            const {categoria} = req.body;
            if(categoria && categoria > 2){
                despesa.categoria = categoria;
            }

            const {valor} = req.body;
            if(valor){
                despesa.valor = valor;
            }

            const {dataVencimento} = req.body;
            if(dataVencimento){
                despesa.dataVencimento = dataVencimento;
            }

            const {dataPagamento} = req.body;
            if(dataPagamento){
                despesa.dataPagamento = dataPagamento;
            }

            return res.status(200).json({despesa})

            await DespesaModel
                .findByIdAndUpdate({_id : despesa._id}, despesa);
            return res.status(200).json({msg: 'Despesa alterada com sucesso.'});
            //console.log('despesa atualizada', despesa)


        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível atualizar a despesa.'})
        }
    });

export const config = {
    api : {
        bodyParser : false
    }
}

export default CORSPolicy(validarToken(conectarMongoDB(handler)));
