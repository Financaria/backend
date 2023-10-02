import mongoose from "mongoose";

const ReceitaSchema = new mongoose.Schema({
    IdUsuario: {type : String, required : true},
    categoria : {type : String, required : true},
    nome : {type : String, required : true},
    valor : {type : Number, required : true},
    dataInclusao : {type : Date, required : true},
    dataRecebimento : {type : Date, required : true},
    parcelas : {type : Number, required : false, default : 1}, 
    recorrencia : {type : Boolean, required : false, default : false} 
});

// compilar nosso esquema em um Model
export const ReceitaModel = (mongoose.models.receita || mongoose.model('receita', ReceitaSchema));