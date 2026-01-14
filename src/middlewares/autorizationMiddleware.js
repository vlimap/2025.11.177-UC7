function normalizePerfil(perfil) {
	return String(perfil ?? "").trim().toLowerCase();
}

function permitirPerfis(...perfisPermitidos) {
	const permitidos = new Set(perfisPermitidos.map(normalizePerfil));

	return (req, res, next) => {
		// O perfil vem do JWT, mas quem decodifica o token é o middleware `autenticarToken`.
		// Então aqui só usamos `req.usuario`.
		if (!req.usuario) {
			return res.status(401).json({ erro: "Não autenticado" });
		}

		const perfil = normalizePerfil(req.usuario.perfil);
		if (!perfil) {
			return res.status(403).json({ erro: "Acesso negado: perfil não informado" });
		}

		if (!permitidos.has(perfil)) {
			return res.status(403).json({ erro: "Acesso negado: perfil sem permissão" });
		}

		return next();
	};
}

// Mantém o nome usado nas rotas: autorization['admin'].
// Observação: o token precisa conter `perfil` (ex.: "admin").
export const autorization = {
	admin: permitirPerfis("admin"),
	user: permitirPerfis("user"),
	funcionario: permitirPerfis("funcionario"),
};

export { permitirPerfis };

export default autorization;
