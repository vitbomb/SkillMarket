const API_URL = 'http://localhost:3000/api';

// --- CONFIGURAÇÃO DE CABEÇALHO DINÂMICO ---
function configurarHeaderDinamico() {
    const token = localStorage.getItem('token');
    const usuarioId = localStorage.getItem('usuarioId');
    const menuSignIn = document.getElementById('menu-signin');
    const menuSignUp = document.getElementById('menu-signup');
    const menuPerfil = document.getElementById('menu-perfil');

    const linkMeuPerfil = document.getElementById('linkMeuPerfil');
    const linkMeuPerfilMenu = document.getElementById('linkMeuPerfilMenu');

    if (usuarioId) {
        if (linkMeuPerfil) linkMeuPerfil.href = `perfil.html?id=${usuarioId}`;
        if (linkMeuPerfilMenu) linkMeuPerfilMenu.href = `perfil.html?id=${usuarioId}`;
    }

    if (token) {
        if (menuSignIn) menuSignIn.style.display = 'none';
        if (menuSignUp) menuSignUp.style.display = 'none';
        if (menuPerfil) menuPerfil.style.display = 'block';

        if (usuarioId) {
            fetch(`${API_URL}/perfil/${usuarioId}`)
                .then(res => res.json())
                .then(prof => {
                    if (prof && prof.foto_perfil) {
                        document.querySelectorAll('.imagem2-header').forEach(img => {
                            img.src = prof.foto_perfil;
                        });
                    }
                })
                .catch(() => {});
        }
    } else {
        if (menuSignIn) menuSignIn.style.display = 'block';
        if (menuSignUp) menuSignUp.style.display = 'block';
        if (menuPerfil) menuPerfil.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    configurarHeaderDinamico();
    preencherFormularioPerfil();
});


// --- SAIR DA CONTA ---
const btnSair = document.getElementById('btnSair');
if (btnSair) {
    btnSair.addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.clear();
        alert('Sessão encerrada!');
        window.location.href = 'index.html';
    });
}


// --- PROCESSAMENTO DO LOGIN (SIGN IN) ---
const formLogin = document.getElementById('formLogin');
const mensagemErroLogin = document.getElementById('mensagemErroLogin');

if (formLogin) {
    formLogin.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const senha = document.getElementById('loginSenha').value;

        try {
            const resposta = await fetch(`${API_URL}/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                if (mensagemErroLogin) mensagemErroLogin.textContent = dados.erro || 'Falha ao autenticar.';
                return;
            }

            localStorage.setItem('token', dados.token);
            localStorage.setItem('usuarioId', dados.usuarioId);

            window.location.href = `perfil.html?id=${dados.usuarioId}`;

        } catch (erro) {
            if (mensagemErroLogin) mensagemErroLogin.textContent = 'Erro ao conectar ao servidor.';
        }
    });
}


// --- BUSCA NO CABEÇALHO ---
const campoBuscaHeader = document.getElementById('campoBuscaHeader');
const btnBuscarHeader = document.getElementById('btnBuscarHeader');

function executarBuscaHeader() {
    if (!campoBuscaHeader) return;
    const termo = campoBuscaHeader.value.trim();
    window.location.href = `busca.html?busca=${encodeURIComponent(termo)}`;
}

if (btnBuscarHeader && campoBuscaHeader) {
    btnBuscarHeader.addEventListener('click', executarBuscaHeader);
    campoBuscaHeader.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') executarBuscaHeader();
    });
}


// --- RENDERIZAR RESULTADOS DA BUSCA (BUSCA.HTML) ---
const containerResultados = document.getElementById('containerResultados');

async function carregarResultadosBusca() {
    if (!containerResultados) return;

    const parametros = new URLSearchParams(window.location.search);
    const termoBusca = parametros.get('busca') || '';

    if (campoBuscaHeader) campoBuscaHeader.value = termoBusca;

    try {
        const url = termoBusca ? `${API_URL}/perfis?busca=${encodeURIComponent(termoBusca)}` : `${API_URL}/perfis`;
        const resposta = await fetch(url);
        const profissionais = await resposta.json();

        containerResultados.innerHTML = '';

        if (profissionais.length === 0) {
            containerResultados.innerHTML = '<p style="color: white; font-size: 18px; width: 100%; text-align: center;">Nenhum profissional localizado.</p>';
            return;
        }

        profissionais.forEach(prof => {
            const card = document.createElement('div');
            card.className = 'card-resultado';
            const fotoExibicao = prof.foto_perfil || 'imagens/placeholder-usuario.png';

            card.innerHTML = `
                <img src="${fotoExibicao}" class="avatar-card-resultado">
                <h2>${prof.nome_completo || prof.nome}</h2>
                <div class="card-resultado-info">
                    <p>${prof.sobre_voce ? prof.sobre_voce.substring(0, 110) + '...' : 'Sem descrição no momento.'}</p>
                </div>
                <a href="perfil.html?id=${prof.usuario_id}" class="btn-resultado">Acessar Perfil</a>
            `;
            containerResultados.appendChild(card);
        });

    } catch (erro) {
        console.error(erro);
    }
}

if (containerResultados) {
    carregarResultadosBusca();
}


// --- EXIBIÇÃO DO PERFIL DINÂMICO COMPLETO (PERFIL.HTML) ---
const cNome = document.getElementById('cNome');

if (cNome) {
    async function carregarPerfilCompleto() {
        const parametros = new URLSearchParams(window.location.search);
        
        let usuarioId = parametros.get('id');
        if (!usuarioId) {
            usuarioId = localStorage.getItem('usuarioId');
        }

        if (!usuarioId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/perfil/${usuarioId}`);
            
            if (!resposta.ok) {
                if (usuarioId === localStorage.getItem('usuarioId')) {
                    alert('Você ainda não configurou seu perfil profissional. Vamos preencher seus dados agora!');
                    window.location.href = 'perfil-profissional.html';
                } else {
                    alert('Perfil ainda não configurado por este profissional.');
                    window.location.href = 'index.html';
                }
                return;
            }

            const prof = await resposta.json();

            cNome.textContent = prof.nome_completo || prof.nome;
            document.getElementById('cLocalizacao').textContent = prof.localizacao || 'Sem localização';
            document.getElementById('cEmpresa').textContent = prof.area_atuacao || 'Especialista';
            document.getElementById('cBio').textContent = prof.sobre_voce || 'Este profissional não adicionou descrição.';

            const avatarImg = document.getElementById('cAvatar');
            if (avatarImg) {
                avatarImg.src = prof.foto_perfil || 'imagens/placeholder-usuario.png';
            }

            const cQualidades = document.getElementById('cQualidades');
            cQualidades.innerHTML = '';
            if (prof.qualidades) {
                prof.qualidades.split(',').forEach(q => {
                    if (q.trim() !== '') {
                        const tag = document.createElement('span');
                        tag.className = 'tag-q';
                        tag.textContent = q.trim();
                        cQualidades.appendChild(tag);
                    }
                });
            }

            document.getElementById('cWhats').href = prof.email_contato ? `mailto:${prof.email_contato}` : '#';
            document.getElementById('cWhatsReal').href = prof.telefone ? `https://wa.me/${prof.telefone.replace(/\D/g, '')}` : '#';
            document.getElementById('cInsta').href = prof.instagram ? `https://instagram.com/${prof.instagram.replace('@', '')}` : '#';

            document.getElementById('numLikes').textContent = prof.likes || 0;
            document.getElementById('numDislikes').textContent = prof.dislikes || 0;

            const cPortfolio = document.getElementById('cPortfolio');
            cPortfolio.innerHTML = '';
            if (prof.fotos && prof.fotos.trim() !== '') {
                const arrayFotos = prof.fotos.split('|');
                arrayFotos.forEach(fotoBase64 => {
                    if (fotoBase64.trim() !== '') {
                        const imgDiv = document.createElement('div');
                        imgDiv.className = 'portfolio-img-c';
                        imgDiv.style.backgroundImage = `url(${fotoBase64})`;
                        cPortfolio.appendChild(imgDiv);
                    }
                });
            } else {
                for (let i = 0; i < 4; i++) {
                    const place = document.createElement('div');
                    place.className = 'portfolio-img-c';
                    cPortfolio.appendChild(place);
                }
            }

            configurarBotoesAvaliacao(usuarioId);

        } catch (erro) {
            console.error(erro);
        }
    }

    function configurarBotoesAvaliacao(usuarioId) {
        const btnLike = document.getElementById('btnLike');
        const btnDislike = document.getElementById('btnDislike');

        if (btnLike && btnDislike) {
            btnLike.addEventListener('click', () => votar(usuarioId, 'like'));
            btnDislike.addEventListener('click', () => votar(usuarioId, 'dislike'));
        }
    }

    async function votar(usuarioId, tipo) {
        try {
            const resposta = await fetch(`${API_URL}/perfil/${usuarioId}/avaliar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tipo })
            });
            const dados = await resposta.json();
            if (resposta.ok) {
                document.getElementById('numLikes').textContent = dados.likes;
                document.getElementById('numDislikes').textContent = dados.dislikes;
            }
        } catch (erro) {
            console.error(erro);
        }
    }

    carregarPerfilCompleto();
}


// --- FORMULÁRIO DE EDICÃO DE PERFIL ---
async function preencherFormularioPerfil() {
    const formPerfil = document.getElementById('formPerfil');
    if (!formPerfil) return;

    const usuarioId = localStorage.getItem('usuarioId');
    if (!usuarioId) return;

    try {
        const resposta = await fetch(`${API_URL}/perfil/${usuarioId}`);
        if (!resposta.ok) return;

        const prof = await resposta.json();

        if (document.getElementById('nomeCompleto')) document.getElementById('nomeCompleto').value = prof.nome_completo || '';
        if (document.getElementById('areaAtuacao')) document.getElementById('areaAtuacao').value = prof.area_atuacao || '';
        if (document.getElementById('localizacao')) document.getElementById('localizacao').value = prof.localizacao || '';
        if (document.getElementById('sobreVoce')) document.getElementById('sobreVoce').value = prof.sobre_voce || '';
        if (document.getElementById('telefone')) document.getElementById('telefone').value = prof.telefone || '';
        if (document.getElementById('instagram')) document.getElementById('instagram').value = prof.instagram || '';
        if (document.getElementById('emailContato')) document.getElementById('emailContato').value = prof.email_contato || '';
        if (document.getElementById('site')) document.getElementById('site').value = prof.site || '';

        if (prof.foto_perfil) {
            const previewAvatar = document.getElementById('previewAvatar');
            if (previewAvatar) previewAvatar.src = prof.foto_perfil;
        }

        // RECONSTRUÇÃO DAS QUALIDADES DINÂMICAS SALVAS
        const qualidadesContainer = document.getElementById('qualidadesContainer');
        const btnAddQualidade = document.getElementById('btnAddQualidade');
        if (qualidadesContainer && btnAddQualidade && prof.qualidades) {
            const inputsExistentes = qualidadesContainer.querySelectorAll('.input-qualidade');
            inputsExistentes.forEach(input => input.remove());

            prof.qualidades.split(',').forEach(q => {
                if (q.trim() !== '') {
                    const novoInput = document.createElement('input');
                    novoInput.type = 'text';
                    novoInput.className = 'input-qualidade';
                    novoInput.value = q.trim();
                    qualidadesContainer.insertBefore(novoInput, btnAddQualidade);
                }
            });
        }

        // RECONSTRUÇÃO DAS FOTOS DO PORTFÓLIO SALVAS
        const imagensContainer = document.getElementById('imagensContainer');
        const btnAddImagem = document.getElementById('btnAddImagem');
        if (imagensContainer && btnAddImagem && prof.fotos) {
            const labelsExistentes = imagensContainer.querySelectorAll('.imagem-upload');
            labelsExistentes.forEach(label => {
                const img = label.querySelector('img');
                if (img && img.id !== 'previewAvatar') {
                    label.remove();
                }
            });

            prof.fotos.split('|').forEach(fotoBase64 => {
                if (fotoBase64.trim() !== '') {
                    const novoLabel = document.createElement('label');
                    novoLabel.className = 'imagem-upload';

                    const novaImg = document.createElement('img');
                    novaImg.src = fotoBase64;
                    novaImg.className = 'preview-imagem';

                    const novoInputImagem = document.createElement('input');
                    novoInputImagem.type = 'file';
                    novoInputImagem.accept = 'image/*';
                    novoInputImagem.className = 'input-imagem';
                    novoInputImagem.hidden = true;

                    novoLabel.appendChild(novaImg);
                    novoLabel.appendChild(novoInputImagem);
                    imagensContainer.insertBefore(novoLabel, btnAddImagem);

                    ativarPreview(novoInputImagem);
                }
            });
        }

    } catch (erro) {
        console.error(erro);
    }
}


// --- FORMULÁRIO DE CADASTRO (SIGN UP) ---
const formCadastro = document.getElementById('formCadastro');
const mensagemErroCadastro = document.getElementById('mensagemErro');

if (formCadastro) {
    formCadastro.addEventListener('submit', async function (evento) {
        evento.preventDefault(); 

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;

        if (!nome || !email || !senha || !confirmarSenha) {
            mensagemErroCadastro.textContent = 'Preencha todos os campos.';
            return;
        }

        if (senha.length < 6) {
            mensagemErroCadastro.textContent = 'A senha precisa de pelo menos 6 caracteres.';
            return;
        }

        if (senha !== confirmarSenha) {
            mensagemErroCadastro.textContent = 'As senhas não coincidem.';
            return;
        }

        mensagemErroCadastro.textContent = '';

        try {
            const resposta = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                mensagemErroCadastro.textContent = dados.erro || 'Não foi possível cadastrar.';
                return;
            }

            localStorage.setItem('usuarioId', dados.usuarioId);
            localStorage.setItem('emailValidando', email);
            window.location.href = 'verificar.html';

        } catch (erro) {
            mensagemErroCadastro.textContent = 'Servidor offline.';
        }
    });
}


// --- INTENÇÃO ---
const opcaoContratar = document.getElementById('opcaoContratar');
const opcaoAmbos = document.getElementById('opcaoAmbos');

async function registrarIntencao(tipoIntencao, paginaRedirecionamento) {
    const usuarioId = localStorage.getItem('usuarioId');

    if (!usuarioId) {
        alert("Sessão expirada. Realize o cadastro novamente.");
        window.location.href = "signup.html";
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/intencao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: parseInt(usuarioId), intencao: tipoIntencao })
        });

        if (resposta.ok) {
            window.location.href = paginaRedirecionamento;
        } else {
            alert("Erro ao registrar intenção.");
        }
    } catch (erro) {
        alert("Erro de conexão.");
    }
}

if (opcaoContratar) {
    opcaoContratar.addEventListener('click', function(e) {
        e.preventDefault();
        registrarIntencao('Apenas contratar', 'perfil-contratante.html');
    });
}

if (opcaoAmbos) {
    opcaoAmbos.addEventListener('click', function(e) {
        e.preventDefault();
        registrarIntencao('Contratar e oferecer', 'perfil-profissional.html');
    });
}


// --- GESTÃO DE IMAGENS E PREVIEW DO PORTFÓLIO ---
function ativarPreview(inputImagem) {
    inputImagem.addEventListener('change', function () {
        const arquivo = inputImagem.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = function (evento) {
            const imgPreview = inputImagem.parentElement.querySelector('.preview-imagem');
            imgPreview.src = evento.target.result;
        };
        leitor.readAsDataURL(arquivo);
    });
}

document.querySelectorAll('.input-imagem').forEach(ativarPreview);

const btnAddImagem = document.getElementById('btnAddImagem');
const imagensContainer = document.getElementById('imagensContainer');

if (btnAddImagem && imagensContainer) {
    btnAddImagem.addEventListener('click', function () {
        const novoLabel = document.createElement('label');
        novoLabel.className = 'imagem-upload';

        const novaImg = document.createElement('img');
        novaImg.src = 'imagens/placeholder-paisagem.png';
        novaImg.alt = '';
        novaImg.className = 'preview-imagem';

        const novoInputImagem = document.createElement('input');
        novoInputImagem.type = 'file';
        novoInputImagem.accept = 'image/*';
        novoInputImagem.className = 'input-imagem';
        novoInputImagem.hidden = true;

        novoLabel.appendChild(novaImg);
        novoLabel.appendChild(novoInputImagem);

        imagensContainer.insertBefore(novoLabel, btnAddImagem);
        ativarPreview(novoInputImagem);
    });
}


// --- FORMULÁRIO SALVAR PERFIL COMPLETO ---
const formPerfil = document.getElementById('formPerfil'); // ADICIONADO: Declarado globalmente corrigindo o ReferenceError

if (formPerfil) {
    formPerfil.addEventListener('submit', async function (evento) {
        evento.preventDefault();

        const usuarioId = localStorage.getItem('usuarioId');
        if (!usuarioId) {
            alert('Erro: Usuário não identificado.');
            window.location.href = 'signup.html';
            return;
        }

        const nomeCompleto = document.getElementById('nomeCompleto').value.trim();
        const areaAtuacao = document.getElementById('areaAtuacao').value.trim();
        const localizacao = document.getElementById('localizacao').value.trim();
        const sobreVoce = document.getElementById('sobreVoce').value.trim();
        const telefone = document.getElementById('telefone').value.trim();
        const instagram = document.getElementById('instagram').value.trim();
        const emailContato = document.getElementById('emailContato').value.trim();
        const site = document.getElementById('site').value.trim();

        const previewAvatar = document.getElementById('previewAvatar');
        let fotoPerfilBase64 = null;
        if (previewAvatar && previewAvatar.src && previewAvatar.src.startsWith('data:image')) {
            fotoPerfilBase64 = previewAvatar.src;
        }

        const inputsQualidade = document.querySelectorAll('.input-qualidade');
        const listaQualidades = [];
        inputsQualidade.forEach(input => {
            if (input.value.trim() !== "") {
                listaQualidades.push(input.value.trim());
            }
        });
        const qualidadesTexto = listaQualidades.join(', ');

        const previews = document.querySelectorAll('.preview-imagem');
        const arrayImagens = [];
        previews.forEach(img => {
            if (img.id !== 'previewAvatar' && img.src && img.src.startsWith('data:image')) {
                arrayImagens.push(img.src);
            }
        });
        const fotosTexto = arrayImagens.join('|');

        try {
            const resposta = await fetch(`${API_URL}/perfil`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuario_id: parseInt(usuarioId),
                    nome_completo: nomeCompleto,
                    area_atuacao: areaAtuacao,
                    localizacao: localizacao,
                    sobre_voce: sobreVoce,
                    qualidades: qualidadesTexto,
                    telefone: telefone,
                    instagram: instagram,
                    email_contato: emailContato,
                    site: site,
                    fotos: fotosTexto,
                    foto_perfil: fotoPerfilBase64
                })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(dados.erro || 'Falha ao salvar perfil.');
                return;
            }

            alert('Perfil e portfólio atualizados com sucesso!');
            window.location.href = `perfil.html?id=${usuarioId}`;

        } catch (erro) {
            console.error(erro);
            alert('Não foi possível salvar o perfil.');
        }
    });
}


// --- ADICIONAR CAMPOS DE QUALIDADES ---
const btnAddQualidade = document.getElementById('btnAddQualidade');
const qualidadesContainer = document.getElementById('qualidadesContainer');

if (btnAddQualidade && qualidadesContainer) {
    btnAddQualidade.addEventListener('click', function () {
        const novoInput = document.createElement('input');
        novoInput.type = 'text';
        novoInput.className = 'input-qualidade';
        novoInput.placeholder = 'Qualidade';

        qualidadesContainer.insertBefore(novoInput, btnAddQualidade);
        novoInput.focus();
    });
}


// --- VERIFICAÇÃO DE E-MAIL (OTP) ---
const formVerificar = document.getElementById('formVerificar');
const msgErroVerificar = document.getElementById('mensagemErroVerificacao');

if (formVerificar) {
    formVerificar.addEventListener('submit', async function (e) {
        e.preventDefault();
        const codigo = document.getElementById('codigoVerificacao').value.trim();
        const email = localStorage.getItem('emailValidando');

        if (!email) {
            alert('Sessão expirada. Realize o cadastro novamente.');
            window.location.href = 'signup.html';
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/verificar-codigo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                msgErroVerificar.textContent = dados.erro || 'Falha na validação.';
                return;
            }

            alert('E-mail validado com sucesso!');
            localStorage.removeItem('emailValidando');
            window.location.href = 'intencao.html';

        } catch (erro) {
            msgErroVerificar.textContent = 'Erro ao processar validação.';
        }
    });
}


// --- RECUPERAÇÃO DE SENHA (ESQUECI A SENHA) ---
const formEsqueci = document.getElementById('formEsqueci');
const msgErroEsqueci = document.getElementById('mensagemErroEsqueci');

if (formEsqueci) {
    formEsqueci.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('esqueciEmail').value.trim();

        try {
            const resposta = await fetch(`${API_URL}/esqueci-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                msgErroEsqueci.textContent = dados.erro || 'Falha ao solicitar link.';
                return;
            }

            alert('Link de redefinição enviado para o seu e-mail!');
            window.location.href = 'signin.html';

        } catch (erro) {
            msgErroEsqueci.textContent = 'Falha ao processar solicitação.';
        }
    });
}


// --- REDEFINIÇÃO DE SENHA ---
const formRedefinir = document.getElementById('formRedefinir');
const msgErroRedefinir = document.getElementById('mensagemErroRedefinir');

if (formRedefinir) {
    formRedefinir.addEventListener('submit', async function (e) {
        e.preventDefault();
        const novaSenha = document.getElementById('novaSenha').value;
        const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;

        if (novaSenha !== confirmarNovaSenha) {
            msgErroRedefinir.textContent = 'As senhas não coincidem.';
            return;
        }

        const parametros = new URLSearchParams(window.location.search);
        const token = parametros.get('token');

        if (!token) {
            alert('Token de redefinição inválido.');
            window.location.href = 'index.html';
            return;
        }

        try {
            const resposta = await fetch(`${API_URL}/redefinir-senha`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, novaSenha })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                msgErroRedefinir.textContent = dados.erro || 'Falha ao redefinir a senha.';
                return;
            }

            alert('Senha alterada com sucesso! Faça login.');
            window.location.href = 'signin.html';

        } catch (erro) {
            msgErroRedefinir.textContent = 'Erro ao processar redefinição.';
        }
    });
}