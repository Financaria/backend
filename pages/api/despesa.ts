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

            const {descricao, categoria, valor, dataVencimento, dataPagamento, pago, parcelas, recorrencia} = req?.body;

            if(!descricao || descricao.length < 2){
                return res.status(400).json({error : 'Descrição não é válida.'});
            }

            if(!valor){
                return res.status(400).json({error : 'É necessário informar um valor.'});
            }

            if(!dataVencimento){
                return res.status(400).json({error : 'É necessário informar a data de vencimento.'});
            }

            if(pago === undefined){
                return res.status(400).json({error : 'Informe se a despesa está paga ou não.'});
            }

            const despesa = {
                idUsuario : usuario._id,
                descricao,
                categoria,
                valor,
                dataVencimento,
                dataPagamento,
                dataInclusao : new Date(),
                pago,
                parcelas,
                recorrencia
            }
            
            if(pago) {
                await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: -despesa.valor } });
            }

            await DespesaModel.create(despesa);
            return res.status(201).json({ msg: 'Despesa cadastrada com sucesso.' });

        }catch(e){
            console.log(e);
        }
        return res.status(400).json({error: 'Erro ao cadastrar despesa.'}); 
    })
    .get(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao | any>) => {
        try{
            const {userId} = req?.query;
            const usuario = await UsuarioModel.findById(userId);

            if(!usuario){
                return res.status(400).json({error: 'Usuário não encontrado.'});
            }

            const {filtro} = req?.query;
            if(filtro){
                //buscar no banco as despesas do usuário que contenham a descricao ou categoria igual ao filtro.
                const despesasEncontradas = await DespesaModel.find({
                    $or: [{ descricao: {$regex : filtro, $options : 'i'}},
                    { categoria: {$regex: filtro, $options : 'i'}
                    }],
                    $and: [{idUsuario : usuario._id}]
                });

                const somaDespesasFiltro = despesasEncontradas.reduce((total, despesa) => total + despesa.valor, 0);

                return res.status(200).json({
                    despesas: despesasEncontradas,
                    total: somaDespesasFiltro  // Adiciona o total ao JSON de resposta
                });
            }

            const {mes} = req?.query;
            if(mes){
                //buscar no banco todas as despesas do usuário do mês selecionado (vencimento e/ou pagamento).
                const mesAlvo = parseInt(mes.toString());
                const anoAlvo = new Date().getFullYear();
                const despesasMes = await DespesaModel.find({
                    $or: [{
                        $expr: {
                            $and: [
                                { $eq: [{ $year: '$dataVencimento' }, anoAlvo]},
                                { $eq: [{ $month: '$dataVencimento' }, mesAlvo]}
                                
                            ]
                        },
                    },
                    {
                        $expr: {
                            $and: [
                                { $eq: [{ $year: '$dataPagamento' }, anoAlvo]},
                                { $eq: [{ $month: '$dataPagamento' }, mesAlvo]}
                            ]
                        }
                    }],
                    $and: [{idUsuario : usuario._id}]            
                });

                 // Calcular a soma dos valores das despesas do mês alvo
                const somaDespesasMes = despesasMes.reduce((total, despesa) => total + despesa.valor, 0);

                return res.status(200).json({
                    despesas: despesasMes,
                    total: somaDespesasMes  // Adiciona o total ao JSON de resposta
                });
            }

            const {data} = req?.query;
            if(data){
                //buscar no banco todas as despesas do usuário na data informada.
                const despesasData = await DespesaModel.find({
                    $or: [
                        { dataVencimento: data },
                        { dataPagamento: data }
                    ],
                    $and: [{idUsuario : usuario._id}]
                });

                const somaDespesasData = despesasData.reduce((total, despesa) => total + despesa.valor, 0);

                return res.status(200).json({
                    despesas: despesasData,
                    total: somaDespesasData  // Adiciona o total ao JSON de resposta
                });
            }

            if(!filtro || !mes || !data){
                const despesas = await DespesaModel.find({idUsuario: userId})
                .sort({dataInclusao : -1});
                return res.status(200).json(despesas);
            }

        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível obter dados.'})
        }

    })
    .put(async(req : NextApiRequest, res : NextApiResponse<respostaPadrao> | any) => {
        try{
            const {userId, id} = req?.query;
            const usuario = await UsuarioModel.findById(userId);
            const despesaID = id;
            const despesa = await DespesaModel.findById(despesaID);
            const jaPago = despesa.pago;

            if(!usuario){
                return res.status(400).json({error: 'Usuário não encontrado.'});
            }

            if(!despesa){
                return res.status(400).json({error: 'Despesa não encontrada.'});
            }

            const { descricao, categoria, valor, dataVencimento, dataPagamento, pago } = req?.body;

            if(descricao && descricao.length > 2){
                despesa.descricao = descricao;
            }

            if(categoria && categoria.length > 2){
                despesa.categoria = categoria;
            }

            if(valor){
                despesa.valor = valor;
            }

            if(dataVencimento){
                despesa.dataVencimento = dataVencimento;
            }

            if(dataPagamento){
                despesa.dataPagamento = dataPagamento;
            }

            if (pago === undefined) {
                // Se o campo pago não foi alterado, não faz nada...
            } else {
                if(pago == false && pago != jaPago){
                    // A despesa estava paga, então altera o campo PAGO e altera o saldo, devolvendo o valor da despesa.
                    despesa.pago = pago;
                    await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: +despesa.valor } });
                }

                if (pago == true && pago != jaPago) {
                    // A despesa NÃO estava paga, então altera o campo PAGO e altera o saldo, diminuindo o valor da despesa.
                    await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: -despesa.valor } });
                    despesa.pago = pago;
                } 
            }
              
            await DespesaModel
                .findByIdAndUpdate(despesaID, despesa, { new: true });
            return res.status(200).json({msg: 'Despesa alterada com sucesso.', despesa});

        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível atualizar a despesa.'})
        }
    })
    .delete(async(req : NextApiRequest, res : NextApiResponse<respostaPadrao | any>) => {
        try{
            const {userId, id} = req?.query;
            const usuario = await UsuarioModel.findById(userId);
            const despesaId = id;
            const despesa = await DespesaModel.findById(despesaId);
            const jaPago = despesa.pago;

            if(!usuario){
                return res.status(400).json({error: 'Usuário não encontrado.'});
            }

            if(!despesa){
                return res.status(400).json({error: 'Despesa não encontrada.'});
            }

            if (jaPago) {
                // A despesa estava marcada como PAGA, então altera o saldo, devolvendo o valor da despesa.
                await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: +despesa.valor } });
            }

            await DespesaModel
                .findByIdAndDelete(despesaId, despesa);
            return res.status(200).json({msg: 'Despesa excluída com sucesso.', despesa});

        }catch(e){
            console.log(e);
            return res.status(400).json({error : 'Não foi possível deletar a despesa.'});
        }
    });

export default CORSPolicy(validarToken(conectarMongoDB(handler)));
