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

            //falta incluir a lógica para pegar apenas as despesas do mês escolhido.

            const {filtro} = req.query;
            if(!filtro || filtro.length < 2){
                const despesas = await DespesaModel.find({idUsuario: userId})
                .sort({dataInclusao : -1});;
                return res.status(200).json(despesas);
            }

            const anoAlvo = 2023;
            // const mesAlvo = parseInt(filtro[0]);
            const mesAlvo = parseInt(filtro);
            console.log(filtro)
            console.log(typeof filtro)
            console.log(mesAlvo)
            console.log(typeof mesAlvo)

            const despesasEncontradas = await DespesaModel.find({
                $or: [{ descricao: {$regex: filtro, $options : 'i'}},
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
                    }
                ]
            });
            return res.status(200).json(despesasEncontradas);

        }catch(e){
            console.log(e);
        }

        return res.status(400).json({error : 'Não foi possível obter dados.'})
    });

export default CORSPolicy(validarToken(conectarMongoDB(handler)));
