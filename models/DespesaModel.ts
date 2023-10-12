import mongoose, {Schema} from "mongoose";

const DespesaSchema = new Schema({
    idUsuario : {type : String, required : true},
    descricao: {type : String, required : true},
    categoria: {type : String, required: true},
    valor: {type : Number, required: true},
    dataVencimento : {type : Date, required : true},
    dataPagamento : {type : Date, required : true},
    dataInclusao : {type : Date, required : true},
    pago: {type : Boolean, required : true},
    parcelas : {type : Number, required : true}, // default : 0
    recorrencia : {type : Boolean, required : true} // default : false
});

export const DespesaModel = (mongoose.models.despesas || 
    mongoose.model('despesas', DespesaSchema));