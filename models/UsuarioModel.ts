import mongoose, {Schema} from "mongoose";

const UsuarioSchema = new Schema({
    nome: {type : String, required : true},
    email: {type : String, required : true},
    senha: {type : String, required : true},
    despesas: {type : Array, required : true, default : []},
});

export const UsuarioModel = (mongoose.models.users || 
    mongoose.model('users', UsuarioSchema));