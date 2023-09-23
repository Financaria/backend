import { NextApiRequest, NextApiResponse } from "next";
import { respostaPadrao } from "@/types/respostaPadrao";
import { UsuarioModel } from "@/models/UsuarioModel";
import { ReceitaModel } from "@/models/ReceitaModel";
import { conectarMongoDB } from "@/middlewares/conectarMongoDB";
import { validarToken } from "@/middlewares/validateTokenJWT";

const endpointReceita = async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
    try {
        // Pegar o ID do usuário a partir dos parâmetros da URL
        const userId = req?.query.userId;
        console.log(userId);
        const usuario = await UsuarioModel.findById(userId);
        console.log(usuario);
        
        // Verificar o método da solicitação HTTP (apenas POST é permitido)
        if(req.method === "POST"){
            // Verificar se o usuário existe no banco de dado
            if(!usuario){
                return res.status(400).json({ error: "Usuário não encontrado." });
            }
            
            if (!req || !req.body) {
                return res.status(400).json({ error: "O corpo da solicitação é obrigatório." });
            }
            
            // Extrair os parâmetros preenchidos no corpo da solicitação
            const {
                nomeCategoria,
                valor,
                dataRecebimento,
                parcelas,
                recorrencia
            } = req?.body;
            
            if (!nomeCategoria || nomeCategoria.length < 2) {
                console.log(nomeCategoria);
                return res.status(400).json({ error: "O nome da categoria deve ter pelo menos 2 caracteres." });
            }
            

            if(!valor || valor < 1){
                return res.status(400).json({ error: "O valor deve ser maior que zero." });
            }

            if(!dataRecebimento){
                return res.status(400).json({error : 'É necessário informar a data de recebimento.'});

            }

            const dataConvertida = converteData(dataRecebimento);

            // Instanciar o objeto Receita
            const receita = new ReceitaModel({
                IdUsuario: usuario._id,
                nomeCategoria : nomeCategoria,
                valor,
                dataInclusao: new Date(),
                dataRecebimento : dataConvertida,
                parcelas,
                recorrencia
            });

            // Salvar a nova receita no banco de dados
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

// Função para converter a data no formato "ddmmaaaa"
function converteData(dataString: string) {
    // O método match() não apenas verifica se a string atende ao padrão definido pela expressão regular (regex), mas também divide a string em partes com base nos grupos de captura na expressão regular.

    const regex = /^(\d{2})(\d{2})(\d{4})$/ ;
    const match = dataString.match(regex); //match agora é um array

    // Verifica se a dataString corresponde ao padrão regex
    if (!match) {
        throw new Error("Formato de data inválido. Use 'ddmmaaaa'.");
    }

    const dia = parseInt(match[1]);
    const mes = parseInt(match[2]) - 1; // O mês é base 0 (janeiro = 0)
    const ano = parseInt(match[3]);

    // Verifica se os valores extraídos são numéricos válidos
    if (isNaN(dia) || isNaN(mes) || isNaN(ano)) {
        throw new Error("Data inválida.");
    }

    //instancia objeto Date
    const data = new Date(ano, mes, dia);

    return data;
}

export default validarToken(conectarMongoDB(endpointReceita));