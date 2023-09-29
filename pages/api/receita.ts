import { NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import { UsuarioModel } from "@/models/UsuarioModel";
import { ReceitaModel } from "@/models/ReceitaModel";
import { conectarMongoDB } from "@/middlewares/conectarMongoDB";
import { validarToken } from "@/middlewares/validateTokenJWT";
import moment from "moment";

const endpointReceita = async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
    try {
        if(req.method === "POST"){

            const userId = req?.query.userId;
            const usuario = await UsuarioModel.findById(userId);
            
            if(!usuario){
                return res.status(400).json({ error: "Usuário não encontrado." });
            }
            
            if (!req || !req.body) {
                return res.status(400).json({ error: "O corpo da solicitação é obrigatório." });
            }
            
            const {
                nomeCategoria,
                valor,
                dataRecebimento,
                parcelas,
                recorrencia
            } = req?.body;
            
            const minimoCaractere = 2;

            if (!nomeCategoria || nomeCategoria.length < minimoCaractere) {
                return res.status(400).json({ error: "O nome da categoria deve ter pelo menos 2 caracteres." });
            }
            
            const valorMinimo = 1;

            if(!valor || valor < valorMinimo){
                return res.status(400).json({ error: "O valor deve ser maior que zero." });
            }

            if(!dataRecebimento){
                return res.status(400).json({error : 'É necessário informar a data de recebimento.'});

            }

            const dataConvertida = converteData(dataRecebimento);

            const receita = new ReceitaModel({
                IdUsuario: usuario._id,
                nomeCategoria : nomeCategoria,
                valor,
                dataInclusao: new Date(),
                dataRecebimento : dataConvertida,
                parcelas,
                recorrencia
            });

            await receita.save();

            return res.status(200).json({msg : "Receita cadastrada com sucesso!"})
        }else{
            return res.status(405).json({ error: "Método não encontrado." });
        }

       
    } catch (e) {
        console.log(e);
        return res.status(500).json({error : "Ocorreu um erro ao criar a receita."})
    }
}

function converteData(dataString: string) {
    const formatoData = 'DD/MM/YYYY';
    const data = moment(dataString, formatoData);

    if (!data.isValid()) {
        throw new Error("Formato de data inválido ou data inválida.");
    }

    return data.toDate();

    
    /*const regex = /^(\d{2})(\d{2})(\d{4})$/ ;
    const match = dataString.match(regex); //match agora é um array

    if (!match) {
        throw new Error("Formato de data inválido. Use 'ddmmaaaa'.");
    }

    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]) - 1;
    const ano = parseInt(match[3]);

    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
        throw new Error("Data inválida.");
    }

    const data = new Date(ano, mes, dia);

    return data;*/
}

export default validarToken(conectarMongoDB(endpointReceita));