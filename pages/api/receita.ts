import { NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import { UsuarioModel } from "@/models/UsuarioModel";
import { ReceitaModel } from "@/models/ReceitaModel";
import { conectarMongoDB } from "@/middlewares/conectarMongoDB";
import { validarToken } from "@/middlewares/validateTokenJWT";
import moment from "moment";
import nc from 'next-connect';

const handler = nc()
    .post(async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
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
    
                const receitaExistente = await ReceitaModel.findOne({
                    IdUsuario: usuario._id,
                    nomeCategoria : nomeCategoria
                });
    
                if(receitaExistente){
                    return res.status(400).json({ error: "Já existe uma receita com a mesma categoria." });
                }
    
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
    });


function converteData(dataString: string) {
    const formatoData = 'DD/MM/YYYY';
    const data = moment(dataString, formatoData);

    if (!data.isValid()) {
        throw new Error("Formato de data inválido ou data inválida.");
    }

    return data.toDate();

}

export default validarToken(conectarMongoDB(handler));