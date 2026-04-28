# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# 🦷 OdontoFlow - Sistema de Gestão Odontológica

## 📋 Sobre o Projeto
Sistema completo para gestão de consultórios odontológicos com controle de agenda, prontuário eletrônico, estoque de materiais e muito mais.

## 🚀 Funcionalidades

### 👨‍💼 Administrador
- Gerenciar procedimentos e valores
- Gerenciar planos de saúde
- Controle de estoque de materiais
- Relatórios financeiros
- Gestão de usuários

### 👩‍⚕️ Dentista
- Agenda de atendimentos
- Prontuário eletrônico
- Prescrições e receitas
- Upload de exames (raio-x)
- Controle de materiais utilizados

### 📋 Secretária
- Agendamento de consultas
- Cadastro de pacientes
- Cálculo automático de planos
- Notificações de retorno

## 🛠️ Tecnologias
- React 18
- Vite
- TailwindCSS
- Lucide React (ícones)
- LocalStorage (persistência)

## 🏃‍♂️ Como executar

```bash
# Clone o repositório
git clone https://github.com/Pedror62/odontoFlow.git

# Entre na pasta
cd odontoFlow

# Instale as dependências
npm install

# Execute o projeto
npm run dev