import mongoose, {Schema} from "mongoose";

const UsuarioSchema = new Schema({
    nome: {type : String, required : true},
    email: {type : String, required : true},
    senha: {type : String, required : true},
    saldo: {type: Number, default : 0}
});

export const UsuarioModel = (mongoose.models.users || 
    mongoose.model('users', UsuarioSchema));