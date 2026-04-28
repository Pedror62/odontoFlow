import React, { createContext, useContext, useState, useEffect } from 'react';

const MaterialContext = createContext();

export const useMaterial = () => {
  const context = useContext(MaterialContext);
  if (!context) {
    throw new Error('useMaterial must be used within MaterialProvider');
  }
  return context;
};

// Dados iniciais de materiais
const INITIAL_MATERIAIS = [
  { id: 1, nome: 'Luvas de Procedimento', tipo: 'Descartável', unidade: 'par', estoque: 500, estoqueMinimo: 100, custoUnitario: 0.50 },
  { id: 2, nome: 'Máscara Cirúrgica', tipo: 'Descartável', unidade: 'un', estoque: 1000, estoqueMinimo: 200, custoUnitario: 0.30 },
  { id: 3, nome: 'Gaze Estéril', tipo: 'Descartável', unidade: 'pacote', estoque: 200, estoqueMinimo: 50, custoUnitario: 2.00 },
  { id: 4, nome: 'Algodão', tipo: 'Descartável', unidade: 'rolo', estoque: 150, estoqueMinimo: 30, custoUnitario: 3.00 },
  { id: 5, nome: 'Anestésico', tipo: 'Medicamento', unidade: 'ampola', estoque: 100, estoqueMinimo: 20, custoUnitario: 5.00 },
  { id: 6, nome: 'Resina Composta', tipo: 'Material', unidade: 'seringa', estoque: 50, estoqueMinimo: 10, custoUnitario: 45.00 },
  { id: 7, nome: 'Álcool 70%', tipo: 'Limpeza', unidade: 'litro', estoque: 20, estoqueMinimo: 5, custoUnitario: 8.00 },
  { id: 8, nome: 'Papel Toalha', tipo: 'Limpeza', unidade: 'pacote', estoque: 80, estoqueMinimo: 15, custoUnitario: 4.00 },
];

// Materiais por procedimento
const INITIAL_MATERIAIS_POR_PROCEDIMENTO = {
  1: { // Limpeza
    materiais: [
      { materialId: 1, quantidade: 2 },
      { materialId: 2, quantidade: 1 },
      { materialId: 4, quantidade: 1 },
      { materialId: 7, quantidade: 0.1 },
    ],
    custoTotal: 0
  },
  2: { // Canal
    materiais: [
      { materialId: 1, quantidade: 3 },
      { materialId: 2, quantidade: 2 },
      { materialId: 3, quantidade: 5 },
      { materialId: 5, quantidade: 2 },
      { materialId: 7, quantidade: 0.2 },
    ],
    custoTotal: 0
  },
  3: { // Extração
    materiais: [
      { materialId: 1, quantidade: 3 },
      { materialId: 2, quantidade: 2 },
      { materialId: 3, quantidade: 3 },
      { materialId: 5, quantidade: 1 },
      { materialId: 7, quantidade: 0.1 },
    ],
    custoTotal: 0
  },
  4: { // Restauração
    materiais: [
      { materialId: 1, quantidade: 2 },
      { materialId: 2, quantidade: 1 },
      { materialId: 3, quantidade: 2 },
      { materialId: 6, quantidade: 1 },
      { materialId: 7, quantidade: 0.1 },
    ],
    custoTotal: 0
  },
};

// Distribuição de materiais por sala - VALORES ALTOS PARA GARANTIR ESTOQUE
const INITIAL_DISTRIBUICAO_SALA = {
  '01': [
    { materialId: 1, quantidade: 500 },
    { materialId: 2, quantidade: 500 },
    { materialId: 3, quantidade: 500 },
    { materialId: 4, quantidade: 500 },
    { materialId: 5, quantidade: 500 },
    { materialId: 6, quantidade: 500 },
    { materialId: 7, quantidade: 500 },
    { materialId: 8, quantidade: 500 },
  ],
  '02': [
    { materialId: 1, quantidade: 500 },
    { materialId: 2, quantidade: 500 },
    { materialId: 3, quantidade: 500 },
    { materialId: 4, quantidade: 500 },
    { materialId: 5, quantidade: 500 },
    { materialId: 6, quantidade: 500 },
    { materialId: 7, quantidade: 500 },
    { materialId: 8, quantidade: 500 },
  ],
  '03': [
    { materialId: 1, quantidade: 500 },
    { materialId: 2, quantidade: 500 },
    { materialId: 3, quantidade: 500 },
    { materialId: 4, quantidade: 500 },
    { materialId: 5, quantidade: 500 },
    { materialId: 6, quantidade: 500 },
    { materialId: 7, quantidade: 500 },
    { materialId: 8, quantidade: 500 },
  ],
};

const INITIAL_HISTORICO_CONSUMO = [];

export const MaterialProvider = ({ children }) => {
  // Forçar reset se o localStorage estiver corrompido
  const [materiais, setMateriais] = useState(() => {
    const saved = localStorage.getItem('materiais');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verificar se tem estoque suficiente
        const luvas = parsed.find(m => m.id === 1);
        if (luvas && luvas.estoque > 0) {
          return parsed;
        }
      } catch (e) {
        console.log('Erro ao carregar materiais, resetando...');
      }
    }
    // Resetar com dados iniciais
    localStorage.setItem('materiais', JSON.stringify(INITIAL_MATERIAIS));
    return INITIAL_MATERIAIS;
  });
  
  const [materiaisPorProcedimento, setMateriaisPorProcedimento] = useState(() => {
    const saved = localStorage.getItem('materiaisPorProcedimento');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.log('Erro ao carregar materiais por procedimento, resetando...');
      }
    }
    // Calcular custo total para cada procedimento
    const comCusto = { ...INITIAL_MATERIAIS_POR_PROCEDIMENTO };
    Object.keys(comCusto).forEach(procId => {
      let custoTotal = 0;
      comCusto[procId].materiais.forEach(item => {
        const material = INITIAL_MATERIAIS.find(m => m.id === item.materialId);
        if (material) {
          custoTotal += material.custoUnitario * item.quantidade;
        }
      });
      comCusto[procId].custoTotal = custoTotal;
    });
    localStorage.setItem('materiaisPorProcedimento', JSON.stringify(comCusto));
    return comCusto;
  });
  
  const [distribuicaoSala, setDistribuicaoSala] = useState(() => {
    const saved = localStorage.getItem('distribuicaoSala');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Verificar se a Sala 01 tem luvas
        if (parsed['01']) {
          const luvas = parsed['01'].find(item => item.materialId === 1);
          if (luvas && luvas.quantidade > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.log('Erro ao carregar distribuição, resetando...');
      }
    }
    localStorage.setItem('distribuicaoSala', JSON.stringify(INITIAL_DISTRIBUICAO_SALA));
    return INITIAL_DISTRIBUICAO_SALA;
  });
  
  const [historicoConsumo, setHistoricoConsumo] = useState(() => {
    const saved = localStorage.getItem('historicoConsumo');
    return saved ? JSON.parse(saved) : INITIAL_HISTORICO_CONSUMO;
  });

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('materiais', JSON.stringify(materiais));
  }, [materiais]);
  
  useEffect(() => {
    localStorage.setItem('materiaisPorProcedimento', JSON.stringify(materiaisPorProcedimento));
  }, [materiaisPorProcedimento]);
  
  useEffect(() => {
    localStorage.setItem('distribuicaoSala', JSON.stringify(distribuicaoSala));
  }, [distribuicaoSala]);
  
  useEffect(() => {
    localStorage.setItem('historicoConsumo', JSON.stringify(historicoConsumo));
  }, [historicoConsumo]);

  // Função para diagnosticar o estoque
  const diagnosticarEstoque = () => {
    console.log('=== DIAGNÓSTICO DE ESTOQUE ===');
    console.log('Materiais:', materiais);
    console.log('Distribuição Sala 01:', distribuicaoSala['01']);
    console.log('Materiais do Canal:', materiaisPorProcedimento[2]);
    
    const luvasEstoque = materiais.find(m => m.id === 1);
    const luvasSala = distribuicaoSala['01']?.find(d => d.materialId === 1);
    const luvasNecessarias = materiaisPorProcedimento[2]?.materiais.find(m => m.materialId === 1);
    
    console.log('Luvas no estoque geral:', luvasEstoque?.estoque);
    console.log('Luvas na Sala 01:', luvasSala?.quantidade);
    console.log('Luvas necessárias para Canal:', luvasNecessarias?.quantidade);
    
    if (luvasSala && luvasNecessarias && luvasSala.quantidade >= luvasNecessarias.quantidade) {
      console.log('✅ Estoque OK');
    } else {
      console.log('❌ Estoque INSUFICIENTE! Executando reset...');
      resetarEstoque();
    }
  };

  // Função para normalizar o nome da sala (extrai apenas o número)
  const normalizarSala = (sala) => {
    if (!sala) return '01';
    const salaStr = String(sala).trim().toLowerCase();
    // Extrair apenas os números da string (ex: "sala 01" -> "01", "Sala 02" -> "02")
    const numeros = salaStr.match(/\d+/);
    if (numeros) {
      return numeros[0].padStart(2, '0');
    }
    return '01';
  };

  // Função para garantir que a sala existe na distribuição
  const garantirSala = (salaKey) => {
    if (!distribuicaoSala[salaKey]) {
      console.log(`📦 Criando sala ${salaKey} com estoque padrão...`);
      const novaDistribuicao = { ...distribuicaoSala };
      novaDistribuicao[salaKey] = materiais.map(m => ({
        materialId: m.id,
        quantidade: 500
      }));
      setDistribuicaoSala(novaDistribuicao);
      return true;
    }
    return false;
  };

  // Função para consumir materiais de um procedimento - VERSÃO CORRIGIDA
  const consumirMateriais = (procedimentoId, sala, pacienteNome, dentistaNome) => {
    // Normalizar o nome da sala (ex: "sala 01" -> "01")
    const salaKey = normalizarSala(sala);
    
    console.log(`🔍 Consumindo materiais - Procedimento: ${procedimentoId}, Sala original: "${sala}", Sala normalizada: "${salaKey}"`);
    console.log(`📋 Salas disponíveis:`, Object.keys(distribuicaoSala));
    
    // Garantir que a sala existe
    garantirSala(salaKey);
    
    // Verificar se a sala existe após garantir
    if (!distribuicaoSala[salaKey]) {
      console.log(`❌ Sala ${salaKey} não encontrada mesmo após tentativa de criação`);
      return { success: false, message: `Sala ${sala} não encontrada no sistema` };
    }
    
    const materiaisNecessarios = materiaisPorProcedimento[procedimentoId];
    if (!materiaisNecessarios) {
      return { success: false, message: 'Procedimento não possui materiais cadastrados' };
    }
    
    const consumo = [];
    let podeConsumir = true;
    
    // Verificar se há material suficiente na sala
    for (const item of materiaisNecessarios.materiais) {
      const material = materiais.find(m => m.id === item.materialId);
      const materialNaSala = distribuicaoSala[salaKey].find(d => d.materialId === item.materialId);
      
      console.log(`📦 Verificando ${material?.nome}: Disponível ${materialNaSala?.quantidade || 0}, Necessário ${item.quantidade}`);
      
      if (!material) {
        podeConsumir = false;
        break;
      }
      
      if (!materialNaSala || materialNaSala.quantidade < item.quantidade) {
        return { 
          success: false, 
          message: `Material insuficiente na sala ${salaKey}: ${material.nome}. Disponível: ${materialNaSala?.quantidade || 0}, Necessário: ${item.quantidade}` 
        };
      }
      
      consumo.push({
        materialId: item.materialId,
        materialNome: material.nome,
        quantidade: item.quantidade,
        custo: material.custoUnitario * item.quantidade
      });
    }
    
    // Realizar consumo
    if (podeConsumir) {
      console.log('✅ Materiais suficientes, realizando consumo...');
      
      // Atualizar estoque da sala
      const novaDistribuicao = { ...distribuicaoSala };
      for (const item of materiaisNecessarios.materiais) {
        const index = novaDistribuicao[salaKey].findIndex(d => d.materialId === item.materialId);
        if (index !== -1) {
          novaDistribuicao[salaKey][index].quantidade -= item.quantidade;
          console.log(`📉 ${materiais.find(m => m.id === item.materialId)?.nome}: nova quantidade ${novaDistribuicao[salaKey][index].quantidade}`);
        }
      }
      setDistribuicaoSala(novaDistribuicao);
      
      // Atualizar estoque geral
      const novosMateriais = [...materiais];
      for (const item of materiaisNecessarios.materiais) {
        const materialIndex = novosMateriais.findIndex(m => m.id === item.materialId);
        if (materialIndex !== -1) {
          novosMateriais[materialIndex].estoque -= item.quantidade;
        }
      }
      setMateriais(novosMateriais);
      
      // Registrar histórico
      const novoHistorico = {
        id: Date.now(),
        data: new Date().toISOString(),
        procedimentoId,
        procedimentoNome: obterNomeProcedimento(procedimentoId),
        sala: salaKey,
        pacienteNome,
        dentistaNome,
        materiais: consumo,
        custoTotal: consumo.reduce((sum, item) => sum + item.custo, 0)
      };
      setHistoricoConsumo([novoHistorico, ...historicoConsumo]);
      
      console.log(`✅ Consumo realizado! Custo total: R$ ${novoHistorico.custoTotal.toFixed(2)}`);
      return { success: true, message: 'Materiais consumidos com sucesso!', consumo };
    }
    
    return { success: false, message: 'Erro ao consumir materiais' };
  };
  
  // Função para repor materiais em uma sala
  const reporMaterialSala = (sala, materialId, quantidade) => {
    const salaKey = normalizarSala(sala);
    const materialGeral = materiais.find(m => m.id === materialId);
    if (!materialGeral || materialGeral.estoque < quantidade) {
      return { success: false, message: `Estoque geral insuficiente de ${materialGeral?.nome || 'material'}` };
    }
    
    // Garantir que a sala existe
    garantirSala(salaKey);
    
    // Atualizar distribuição da sala
    const novaDistribuicao = { ...distribuicaoSala };
    const materialSala = novaDistribuicao[salaKey].find(d => d.materialId === materialId);
    if (materialSala) {
      materialSala.quantidade += quantidade;
    } else {
      novaDistribuicao[salaKey].push({ materialId, quantidade });
    }
    setDistribuicaoSala(novaDistribuicao);
    
    // Atualizar estoque geral
    const novosMateriais = [...materiais];
    const materialIndex = novosMateriais.findIndex(m => m.id === materialId);
    if (materialIndex !== -1) {
      novosMateriais[materialIndex].estoque -= quantidade;
    }
    setMateriais(novosMateriais);
    
    return { success: true, message: `${quantidade} ${materialGeral?.unidade}(s) de ${materialGeral?.nome} reposto(s) com sucesso!` };
  };
  
  // Função para adicionar material ao estoque geral
  const adicionarEstoque = (materialId, quantidade, custoUnitario) => {
    const novosMateriais = [...materiais];
    const index = novosMateriais.findIndex(m => m.id === materialId);
    if (index !== -1) {
      novosMateriais[index].estoque += quantidade;
      if (custoUnitario) {
        novosMateriais[index].custoUnitario = custoUnitario;
      }
    } else {
      novosMateriais.push({
        id: materialId,
        nome: 'Novo Material',
        tipo: 'Descartável',
        unidade: 'un',
        estoque: quantidade,
        estoqueMinimo: 10,
        custoUnitario: custoUnitario || 0
      });
    }
    setMateriais(novosMateriais);
  };
  
  const obterNomeProcedimento = (id) => {
    const nomes = {
      1: 'Limpeza',
      2: 'Canal',
      3: 'Extração',
      4: 'Restauração',
      5: 'Clareamento'
    };
    return nomes[id] || 'Procedimento';
  };
  
  // Alertas de estoque baixo
  const obterAlertasEstoque = () => {
    const alertas = materiais.filter(m => m.estoque <= m.estoqueMinimo);
    const alertasPorSala = {};
    Object.keys(distribuicaoSala).forEach(sala => {
      distribuicaoSala[sala].forEach(item => {
        if (item.quantidade < 10) {
          if (!alertasPorSala[sala]) alertasPorSala[sala] = [];
          const material = materiais.find(m => m.id === item.materialId);
          alertasPorSala[sala].push({
            materialNome: material?.nome,
            quantidade: item.quantidade
          });
        }
      });
    });
    return { geral: alertas, porSala: alertasPorSala };
  };

  // Função para resetar o estoque
  const resetarEstoque = () => {
    console.log('🔄 Resetando estoque para valores iniciais...');
    setMateriais(INITIAL_MATERIAIS);
    setMateriaisPorProcedimento(INITIAL_MATERIAIS_POR_PROCEDIMENTO);
    setDistribuicaoSala(INITIAL_DISTRIBUICAO_SALA);
    setHistoricoConsumo([]);
    localStorage.setItem('materiais', JSON.stringify(INITIAL_MATERIAIS));
    localStorage.setItem('materiaisPorProcedimento', JSON.stringify(INITIAL_MATERIAIS_POR_PROCEDIMENTO));
    localStorage.setItem('distribuicaoSala', JSON.stringify(INITIAL_DISTRIBUICAO_SALA));
    localStorage.setItem('historicoConsumo', JSON.stringify([]));
    console.log('✅ Estoque resetado com sucesso!');
    return { success: true, message: 'Estoque resetado com sucesso!' };
  };

  const value = {
    materiais,
    materiaisPorProcedimento,
    distribuicaoSala,
    historicoConsumo,
    consumirMateriais,
    reporMaterialSala,
    adicionarEstoque,
    obterAlertasEstoque,
    resetarEstoque,
    diagnosticarEstoque,
    normalizarSala,
    garantirSala,
    setMateriais,
    setMateriaisPorProcedimento,
    setDistribuicaoSala
  };

  return (
    <MaterialContext.Provider value={value}>
      {children}
    </MaterialContext.Provider>
  );
};