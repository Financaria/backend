import { NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import { UsuarioModel } from "@/models/UsuarioModel";
import { ReceitaModel } from "@/models/ReceitaModel";
import { conectarMongoDB } from "@/middlewares/conectarMongoDB";
import { validarToken } from "@/middlewares/validateTokenJWT";
import moment, { months } from "moment";
import nc from 'next-connect';

const handler = nc()
    .post(async (req: NextApiRequest, res: NextApiResponse<respostaPadrao>) => {
        try {
            const {userId} = req?.query;
            const user = await buscarUsuarioLogado(res, req);

            if (!req || !req.body) {
                return res.status(400).json({ error: "O corpo da solicitação é obrigatório." });
            }

            const {
                descricao,
                categoria,
                valor,
                dataRecebimento,
                recebido,
                parcelas,
                recorrencia
            } = req?.body;

            const minCharLength = 2;
            const maxCharLength = 15;

            if (!categoria || categoria.length < minCharLength || categoria.length > maxCharLength) {
                return res.status(400).json({ error: "A categoria deve ter pelo menos 2 e no máximo 15 caracteres." });
            }

            if (!descricao || descricao.length < minCharLength || descricao.length > maxCharLength) {
                return res.status(400).json({ error: "O descricao da descricao deve ter pelo menos 2 e no máximo 15 caracteres." });
            }

            const minValue = 1;

            if (!valor || valor < minValue) {
                return res.status(400).json({ error: "O valor deve ser maior que zero." });
            }

            if (!dataRecebimento) {
                return res.status(400).json({ error: 'É necessário informar a data de recebimento.' });

            }

            if(recebido === undefined){
                return res.status(400).json({error : 'Informe se a despesa está paga ou não.'});
            }

            const convertedDate = convertDate(dataRecebimento);

            const existingRevenue = await ReceitaModel.findOne({
                IdUsuario: user._id,
                descricao: descricao
            });

            if (existingRevenue) {
                return res.status(400).json({ error: "Já existe uma receita com a mesmo descricao." });
            }

            const receita = new ReceitaModel({
                IdUsuario: user._id,
                descricao: descricao,
                categoria: categoria,
                valor,
                dataInclusao: new Date(),
                dataRecebimento: convertedDate,
                recebido,
                parcelas,
                recorrencia
            });

            if(recebido) {
                await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: +receita.valor } });
            }

            await receita.save();
            return res.status(200).json({ msg: "Receita cadastrada com sucesso!" })

        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: "Ocorreu um erro ao criar a receita." })
        }
    })
    .get(async (req: NextApiRequest, res: NextApiResponse<respostaPadrao | any[] | any>)  => {

        try {
            const { filtro } = req?.query;

            const user = await buscarUsuarioLogado(res, req);

            if (filtro) {
                const filtroString = Array.isArray(filtro) ? filtro[0] : filtro;
                const receitasEncontradas = await buscarReceitaPorFiltro(req, res, user, filtroString);
                return res.status(200).json({ receitasEncontradas });
            }

            const {mes} = req?.query;
            if(mes){
                //buscar no banco todas as despesas do usuário do mês selecionado (vencimento e/ou pagamento).
                const mesAlvo = parseInt(mes.toString());
                console.log("mês", mesAlvo)
                const anoAlvo = new Date().getFullYear();
                console.log("ano", anoAlvo)

                const receitaMes = await ReceitaModel.find({
                    $and: [{
                        $or: [{
                            $expr: {
                                $and: [
                                    { $eq: [{ $year: '$dataRecebimento' }, anoAlvo]},
                                    { $eq: [{ $month: '$dataRecebimento' }, mesAlvo]}
                                ]
                            }
                        }],
                        IdUsuario : user._id
                    }]
                });

                 // Calcular a soma dos valores das despesas do mês alvo
                const somaReceitasMes = receitaMes.reduce((total, receita) => total + receita.valor, 0);
                console.log(receitaMes);

                return res.status(200).json({
                    receita: receitaMes,
                    total: somaReceitasMes  // Adiciona o total ao JSON de resposta
                });
            }
            
            const todasAsReceitas = await ReceitaModel.find({
                IdUsuario: user._id
            }).sort({
                dataRecebimento : 1
            });

            if(todasAsReceitas.length === 0){
                return res.status(400).json({ error: "Nenhuma receita encontrada para este usuário." });
            }

            return res.status(200).json(todasAsReceitas);

        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: "Ops! Algo deu errado ao buscar as receitas. Por favor, tente novamente mais tarde." })
        }
    })
    .put(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
        try {
            const {userId, id} = req?.query;
            const user = await buscarUsuarioLogado(res, req);

            const receitaId = id;
            const receita = await ReceitaModel.findById(receitaId);

            if (!receita) {
                return res.status(400).json({ error: "Id da Receita não encontrada." });
            }

            const {
                descricao,
                categoria,
                valor,
                dataRecebimento,
                recebido,
                parcelas,
                recorrencia
            } = req?.body;

            const minCharLength = 1;
            const maxCharLength = 16;

            if (categoria && categoria.length > 2) {
               receita.categoria = categoria;
            }

            if (descricao && descricao.length > 2) {
                receita.descricao = descricao;
            }

            const minValue = 0;

            if (valor && valor > minValue) {
               receita.valor = valor;
            }

            if (dataRecebimento) {
                const convertedDate = convertDate(dataRecebimento);

                receita.dataRecebimento = convertedDate;
            }

            if (parcelas) {
                receita.parcelas = parcelas;
            }

            if (recorrencia) {
                receita.recorrencia = recorrencia;
            }

            if (recebido === undefined) {
                // Se o campo recebido não foi alterado, não faz nada...
            } else {
                if (recebido === false) {
                    // A receita foi marcada como NÃO recebida, então diminui o saldo.
                    await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: -receita.valor } });
                } else {
                    // A receita foi marcada como recebida, então aumenta o saldo
                    await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: +receita.valor } });
                }
            }

            await ReceitaModel.findByIdAndUpdate(receitaId, receita, { new: true });
            return res.status(200).json({msg: `Receita alterada com sucesso.`});
    
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: "Ops! Algo deu errado ao atualizar as receitas. Por favor, tente novamente mais tarde." })
        
        }
      
      })
    .delete(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
        try {
            const user = await buscarUsuarioLogado(res, req);

            const receitaId = req?.query._id;

            if (!receitaId) {
                await ReceitaModel.deleteMany({ IdUsuario: user._id });
                return res.status(200).json({msg: `Todas as Receita Excluida com sucesso.`});
            };
    
            if(req.query._id && req.query._id !== null && req.query._id !== undefined){
                await ReceitaModel.findByIdAndDelete(receitaId);
                return res.status(200).json({msg: `Receita Excluida com sucesso.`});
            };
    
        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: "Ops! Algo deu errado ao Excluir as receitas. Por favor, tente novamente mais tarde." })
        }


    });

async function buscarReceitaPorFiltro(req: NextApiRequest, res: NextApiResponse, user: any, filtro: string) {
    try {

        const regex = new RegExp(`^${filtro}$`, 'i');
        
        const receitasEncontradas = await ReceitaModel.find({
            $and: [
                { $or: [{ descricao: regex }, { categoria: regex }] },
                { IdUsuario: user._id }
            ]
        });

        return res.status(200).json({ receitasEncontradas });

    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Ops! Algo deu errado ao buscar as receitas. Por favor, tente novamente mais tarde.' });
    }
}

async function buscarUsuarioLogado(res : NextApiResponse, req : NextApiRequest){
    const user = await UsuarioModel.findById(req.query.userId);
            if (!user) {
                return res.status(400).json({ error: "Usuário não encontrado." });
            };
    return user;
}

function convertDate(dataString: string) {
    
    const formatoData = 'DD/MM/YYYY';
    const data = moment(dataString, formatoData);

    if (!data.isValid()) {
        throw new Error("Formato de data inválido ou data inválida.");
    }

    return data.toDate();

}

export default validarToken(conectarMongoDB(handler));