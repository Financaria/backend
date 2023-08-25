import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { respostaPadrao } from "@/types/respostaPadrao";

export const conectarMongoDB = (handler : NextApiHandler) => async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
    //verificar o estado da conexão
    if(mongoose.connections[0].readyState){
        return handler(req,res);
    }

    //config e validar variavel de ambiente
    const { DB_CONNECTION_STRING } = process.env;
    if(!DB_CONNECTION_STRING){
        return res.status(500).json({ error : 'Env de configuracao não informado.'});
    }

    //Isso garante que o código estará preparado para lidar com esses eventos assim que a conexão for estabelecida
    mongoose.connection.on('connected', () => console.log('Banco de dados CONECTADO!'));  
    mongoose.connection.on('error', error => console.log(`ERRO ao conectar banco de dados. ${error}`));

    //Estabelecer Conexão com o Banco de Dados:
    await mongoose.connect(DB_CONNECTION_STRING as string);
    //manipulador da rota atual para continuar o processamento dessa rota 
    return handler(req,res);
}