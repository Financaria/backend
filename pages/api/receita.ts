import { NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import { UsuarioModel } from "@/models/UsuarioModel";
import { ReceitaModel } from "@/models/ReceitaModel";
import { conectarMongoDB } from "@/middlewares/conectarMongoDB";
import { validarToken } from "@/middlewares/validateTokenJWT";
import moment from "moment";
import nc from 'next-connect';

const handler = nc()
    .post(async (req: NextApiRequest, res: NextApiResponse<respostaPadrao>) => {
        try {
            const {userId} = req?.query;
            const user = await UsuarioModel.findById(userId);

            if (!user) {
                return res.status(400).json({ error: "Usuário não encontrado." });
            }

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
    .get(async (req: NextApiRequest, res: NextApiResponse<respostaPadrao | any[]>)  => {

        try {
            
            const user = await UsuarioModel.findById(req.query.userId);

            if (!user) {
                return res.status(400).json({ error: "Usuário não encontrado." });
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

        // buscar as receitar por categoria
        // validar
        // buscar as receitar por nome
        // validar
        // buscar as receitar por mês especifico(vou ter que tratar a data de recebimento)
        // validar
        // buscar as receitar por ano especifico(vou ter que tratar a data de recebimento)
        // validar

    });
// .put()
//.delete()

function convertDate(dataString: string) {
    
    const formatoData = 'DD/MM/YYYY';
    const data = moment(dataString, formatoData);

    if (!data.isValid()) {
        throw new Error("Formato de data inválido ou data inválida.");
    }

    return data.toDate();

}

export default validarToken(conectarMongoDB(handler));