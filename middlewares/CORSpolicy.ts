import { respostaPadrao } from '@/types/respostaPadrao';
import { NextApiRequest, NextApiResponse } from 'next';
import { NextApiHandler } from "next/dist/shared/lib/utils";
import NextCors from 'nextjs-cors';

export const CORSPolicy = (handler: NextApiHandler) => async (req: NextApiRequest, res: NextApiResponse<respostaPadrao>) => {
  try{
    await NextCors(req, res,{
      origin: '*',
      methods: ['POST', 'GET', 'PUT', 'DELETE'],
      optionsSuccessStatus: 200
    });
    return handler(req, res);
  }catch(e){
    console.log('Erro ao tratar a poítica de CORS', e);
    return res.status(500).json({error: 'Erro aoo tratar a política de CORS'})
  }
}