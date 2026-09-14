# Persefone — Botanical Archival System

> **Persefone** é um sistema híbrido entre um aplicativo de cuidado com plantas e um explorador taxonômico em estilo "Pokedex", construído com uma identidade visual marcante no estilo **"Chlorophyll Noir"** (Neobrutalismo com bordas sólidas de 4px, sombras rígidas e cantos retos de 0px).

---

## 🌿 Tecnologias Utilizadas

### Backend
- **Python 3.12+** & **Django 5.x** / **Django REST Framework (DRF)**
- **SQLite** (Desenvolvimento) / **PostgreSQL** (Produção)
- **JWT & Session Auth** (`djangorestframework-simplejwt`)
- **Pytest & Pytest-Django** (Suíte de testes automatizados)
- Integradores de Caching Local: **GBIF Species API** e **Open-Meteo Weather API**

### Frontend
- **React 18+** & **Vite**
- **Tailwind CSS 3.4+** (Configurado com os tokens de design *Chlorophyll Noir*)
- **TanStack Query (React Query v5)** (Gerenciamento de cache e estado assíncrono)
- **React Router v6**
- **Vitest & React Testing Library** (Suíte de testes de componentes UI)

---

## 🚀 Como Iniciar o Projeto

### Pró-requisitos
- **Python 3.10+** e `pip`
- **Node.js 18+** e `npm`

---

### 1. Configurando e Executando o Backend (Django DRF)

Navegue até o diretório `backend/`:

```bash
cd backend
```

1. **Crie e ative um ambiente virtual (venv):**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   # No Windows (PowerShell): .\venv\Scripts\Activate.ps1
   ```

2. **Instale as dependências Python:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Execute as migrações do banco de dados:**
   ```bash
   python manage.py migrate
   ```

4. **(Opcional) Crie um usuário Administrador:**
   ```bash
   python manage.py createsuperuser
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   python manage.py runserver
   ```
   > O servidor estará rodando em: `http://127.0.0.1:8000`  
   > Painel administrativo em: `http://127.0.0.1:8000/admin`

6. **Executando os testes do Backend:**
   ```bash
   pytest
   ```

---

### 2. Configurando e Executando o Frontend (React + Vite)

Em um novo terminal, navegue até o diretório `frontend/`:

```bash
cd frontend
```

1. **Instale as dependências do Node.js:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento do Vite:**
   ```bash
   npm run dev
   ```
   > A aplicação estará acessível em: `http://localhost:5173`

3. **Executando os testes do Frontend:**
   ```bash
   npm test
   ```

---

## 🏛 Arquitetura e Princípios de Design

- **Chlorophyll Noir Aesthetic**: Interface neobrutalista com bordas sólidas de 4px, sombras projetadas de 4px a 6px sem desfoque (`shadow-hard`), cantos totalmente retos (`border-radius: 0px`) e paleta baseada em Lime vibrante (`#BDFF00`), Off-White e Charcoal (`#1A1A1A`).
- **Diferenciação Visual de Status**: Espécimes **Possuídos** são exibidos com cores vibrantes e limão; Espécimes **Faltantes** (não catalogados) aparecem em tons de cinza dessaturados.
- **Caching Local-First**: Consultas externas a APIs (GBIF para dados taxonômicos e Open-Meteo para clima) são armazenadas em cache no banco de dados local para garantir tempos de resposta abaixo de 100ms.
- **Componentes Modulares**: Todos os elementos de UI reaproveitáveis (Tabelas, Cards, Modais, Badges, Botões) ficam centralizados em `frontend/src/components/ui/`.

---

## 📂 Estrutura de Diretórios

```text
persefone/
├── backend/
│   ├── catalog/        # Modelos e views para Espécies & Caching da GBIF
│   ├── specimens/      # Espécimes do usuário & Histórico de Cuidados (CareLog)
│   ├── weather/        # Caching de clima via Open-Meteo
│   ├── core/           # Configurações do Django, CORS e URLs
│   ├── pytest.ini      # Configuração do Pytest
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/     # Biblioteca modular reutilizável (<Card/>, <Table/>, etc.)
│   │   │   └── layout/ # Shell responsivo, Navbar e Sidebar
│   │   ├── pages/      # Telas (Dashboard, Catalogo de Espécimes, Explorer)
│   │   ├── services/   # Cliente Axios e hooks de cache (TanStack Query)
│   │   └── styles/     # Estilos globais e tokens Chlorophyll Noir
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```
