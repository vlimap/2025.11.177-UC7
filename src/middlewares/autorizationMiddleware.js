// Middleware para permitir acesso baseado em perfis de usuário.

// Retorna um middleware que verifica se o perfil do usuário está na lista de perfis permitidos.
// Se o perfil estiver permitido, chama a próxima função de middleware; caso contrário, retorna um erro 403.

// Retorna um objeto JSON com um erro se o acesso for negado.
export function permitirPerfis() {
	// Perfis permitidos hardcoded
	const lista = []; // Exemplo de perfis permitidos

	return (req, res, next) => {
		const perfil = req.usuario && req.usuario.perfil;
		if (lista.includes(perfil)) {
			return next();
		}

		return res.status(403).json({ erro: "Acesso negado" });
	};
}

// Mantém o nome usado nas rotas: autorization['admin'].
// Observação: o token precisa conter `perfil` (ex.: "admin").
export const autorization = {
	admin: permitirPerfis(["admin"]),
	seller: permitirPerfis(["seller"])
};

export default autorization;
