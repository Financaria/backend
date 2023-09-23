import { NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import { UsuarioModel } from "@/models/UsuarioModel";
import { ReceitaModel } from "@/models/ReceitaModel";
import { conectarMongoDB } from "@/middlewares/conectarMongoDB";
import { validarToken } from "@/middlewares/validateTokenJWT";

const endpointReceita = async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
    try {
        // Pegar o ID do usuário a partir dos parâmetros da URL
        const userId = req.query.userId;
        console.log(userId);

        // Verificar se o usuário existe no banco de dados
        const usuario = await UsuarioModel.findById(userId);
        console.log(usuario);
        
        // Verificar o método da solicitação HTTP (apenas POST é permitido)
        if(req.method === "post"){
            if(!usuario){
                return res.status(400).json({ error: "Usuário não encontrado." });
            }
            
            if (!req || !req.body) {
                return res.status(400).json({ error: "O corpo da solicitação é obrigatório." });
            }
            
            // Extrair os parâmetros preenchidos no corpo da solicitação
            const {
                IdUsuario,
                nomeCategoria,
                valor,
                dataRecebimento,
                parcelas,
                recorrencia
            } = req.body;
            
            if(!IdUsuario){
                return res.status(400).json({ error: "ID do Usuário não encontrado." });
            }

            if (!nomeCategoria || nomeCategoria.length < 2) {
                return res.status(400).json({ error: "O nome da categoria deve ter pelo menos 2 caracteres." });
            }
            

            if(!valor || valor < 1){
                return res.status(400).json({ error: "O valor deve ser maior que zero." });
            }

            if(!dataRecebimento){
                return res.status(400).json({error : 'É necessário informar a data de recebimento.'});

            }

            // Instanciar o objeto Receita
            const receita = new ReceitaModel({
                IdUsuario: usuario,
                nomeCategoria,
                valor,
                dataInclusao: new Date(),
                dataRecebimento,
                parcelas,
                recorrencia
            });

            // Salvar a nova receita no banco de dados
            await receita.save();

            return res.status(200).json({msg : "Receita cadastrada com sucesso!"})
        } 

        return res.status(405).json({ error: "Método não encontrado." });
       
    } catch (e) {
        console.log(e);
        return res.status(500).json({error : "Ocorreu um erro ao criar a receita."})
    }
}

export default validarToken(conectarMongoDB(endpointReceita));