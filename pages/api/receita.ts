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
                parcelas,
                recorrencia
            });

            await UsuarioModel.findOneAndUpdate({ _id: userId }, { $inc: { saldo: +receita.valor } });

            await receita.save();
            
            return res.status(200).json({ msg: "Receita cadastrada com sucesso!" })

        } catch (e) {
            console.log(e);
            return res.status(500).json({ error: "Ocorreu um erro ao criar a receita." })
        }
    })
    .get(async (req: NextApiRequest, res: NextApiResponse<respostaPadrao | any[] | any>)  => {

        try {
            const { filtro, mes } = req?.query;

            const user = await buscarUsuarioLogado(res, req);

            if (filtro) {
                const filtroString = Array.isArray(filtro) ? filtro[0] : filtro;
                const receitasEncontradas = await buscarReceitaPorFiltro(req, res, user, filtroString);
                return res.status(200).json({ receitasEncontradas });
            }

            if (mes) {
                const filtroString = Array.isArray(mes) ? mes[0] : mes;
                await buscarReceitaPorMes(req, res, user, filtroString);
                console.log(mes);
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

            const user = await buscarUsuarioLogado(res, req);

            const receitaId = req?.query._id;
            const receita = await ReceitaModel.findById(receitaId);

            if (!receita) {
                return res.status(400).json({ error: "Id da Receita não encontrada." });
            }

            const {
                descricao,
                categoria,
                valor,
                dataRecebimento,
                parcelas,
                recorrencia
            } = req?.body;

            const minCharLength = 1;
            const maxCharLength = 16;

            if (categoria && categoria.length > minCharLength && categoria.length < maxCharLength) {
               receita.categoria = categoria;
            } else {
                return res.status(400).json({ error: "A categoria deve ter pelo menos 2 e no máximo 15 caracteres." });
            }

            if (descricao && descricao.length > minCharLength && descricao.length < maxCharLength) {
                receita.descricao = descricao;
            } else {
                return res.status(400).json({ error: "A descrição deve ter pelo menos 2 e no máximo 15 caracteres." });
            }

            const minValue = 0;

            if (valor && valor > minValue) {
               receita.valor = valor;
            } else {
                return res.status(400).json({ error: "O valor deve ser maior que zero." });
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

async function buscarReceitaPorMes(req: NextApiRequest, res: NextApiResponse, user: any, mes: string) {
    try {
        let query = { IdUsuario: user._id };

            const filtroPorMes = moment(dataRecebimento, 'MM');

            if (filtroPorMes.isValid()) {
                const inicioDoMes = filtroPorMes.startOf('month').toISOString();
                const fimDoMes = filtroPorMes.endOf('month').toISOString();

                query.dataRecebimento = {
                    $gte: new Date(inicioDoMes),
                    $lt: new Date(fimDoMes)
                };
            } else {
                return res.status(400).json({ error: 'O parâmetro "mês" deve ser um número de 01 a 12.' });
            }

        console.log('Query:', query);

        const receitasEncontradas = await ReceitaModel.find(query);

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