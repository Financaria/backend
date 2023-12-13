import type { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { respostaPadrao } from "@/types/respostaPadrao";

export const conectarMongoDB = (handler : NextApiHandler) => async (req : NextApiRequest, res : NextApiResponse<respostaPadrao>) => {
    const estadoDeConexaoDesconectado = mongoose.connections[0].readyState ;
    if(estadoDeConexaoDesconectado){
        return handler(req,res);
    }

    const { DB_CONNECTION_STRING } = process.env;
    if(!DB_CONNECTION_STRING){
        return res.status(500).json({ error : 'Env de configuracao não informado.'});
    }

    mongoose.connection.on('connected', () => console.log('Banco de dados CONECTADO!'));  
    mongoose.connection.on('error', error => console.log(`ERRO ao conectar banco de dados. ${error}`));

    await mongoose.connect(DB_CONNECTION_STRING as string);

    return handler(req,res);
}