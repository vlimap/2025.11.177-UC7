import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ erro: "Token não fornecido" });
  }

  try {
    const usuario = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = usuario;
    return next();
  } catch (erro) {
    return res.status(403).json({ erro: "Token inválido ou expirado" });
  }
}
