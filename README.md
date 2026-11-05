#CodeStars

> **CodeStars** é uma plataforma web gamificada focada no ensino prático e de alto nível de programação (HTML, CSS e JavaScript), desenvolvida como Trabalho de Conclusão de Curso (TCC).

🌐 **Acesse a plataforma ao vivo:** [https://joseaugusto271.github.io/CodeStars/](https://joseaugusto271.github.io/CodeStars/)

O grande diferencial do projeto é a integração com um **Tutor Socrático baseado em Inteligência Artificial**, que orienta o aprendizado através de reflexões e pistas pedagógicas sem entregar as respostas prontas. Além disso, a plataforma conta com um sistema de avaliação focado em qualidade e otimização de código (*Clean Code*).

---

## Funcionalidades

- 💻 **IDE Interativa (Split-Screen):** Ambiente de desenvolvimento com editor de código de um lado e renderização visual em tempo real do outro.
- 🤖 **Tutor Socrático por IA:** Integração com o Google Gemini para fornecer dicas pedagógicas e reflexivas em momentos de dificuldade.
- ⚙️ **Avaliação Automática de Código:** Algoritmo que atribui de 1 a 3 estrelas com base na funcionalidade, estruturação e ausência de redundâncias no código (Clean Code). Se a IA for acionada, a nota máxima é travada em 1 estrela.
- 🎮 **Gamificação:** Sistema de progressão de módulos, ofensivas (dias seguidos de estudo) e tabela de classificação global (Leaderboard).
- 🎨 **Personalização:** Interface responsiva com suporte a temas Claro e Escuro (Light/Dark mode) e design lúdico focado em usabilidade.

---

## Tecnologias Utilizadas

**Front-end**
- HTML5, CSS3, JavaScript
- Arquitetura planejada para escalabilidade (React/Next.js)
- Hospedagem contínua via **GitHub Pages**

**Back-end & Banco de Dados**
- **Supabase:** Gerenciamento de banco de dados relacional (PostgreSQL).
- **Supabase Auth:** Autenticação segura de usuários (Email/Senha e Google OAuth).
- **RLS (Row Level Security):** Políticas de segurança nativas do banco para proteger os dados e o progresso dos alunos.

**Inteligência Artificial**
- **API do Google Gemini:** Modelo `gemini-1.5-flash` atuando via Edge Functions para a correção dos projetos finais e tutoria socrática.

---

## Como executar o projeto localmente

Como o projeto já está hospedado no GitHub Pages, você pode acessá-lo diretamente pelo link acima. Caso deseje rodar uma versão local para desenvolvimento, siga os passos:

### 1. Clonar o repositório
```bash
git clone [https://github.com/joseaugusto271/CodeStars.git](https://github.com/joseaugusto271/CodeStars.git)
cd CodeStars
