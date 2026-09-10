"use client";

import { useEffect, useState, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';

// --- DADOS PARA OS CARROSSÉIS ---
const comparacoesData = [
  { id: 1, imagem: "/sala-pos-obra.jpg", titulo: "Sala Pós-Obra" },
  { id: 2, imagem: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800", titulo: "Cozinha Pesada" },
  { id: 3, imagem: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800", titulo: "Quarto e Janelas" }
];

const avaliacoesData = [
  { id: 1, nome: "Maria Silva", texto: "A limpeza pós-obra foi impecável. Tiraram toda a poeira e manchas de tinta que pareciam impossíveis.", rating: "★★★★★" },
  { id: 2, nome: "João Pereira", texto: "Contratei a limpeza pesada antes de me mudar e o apartamento parecia novo. Atendimento rápido e direto.", rating: "★★★★★" },
  { id: 3, nome: "Ana Souza", texto: "A manutenção da LU CLEAN facilita muito minha vida. São pontuais, discretos e deixam tudo cheiroso.", rating: "★★★★★" },
  { id: 4, nome: "Carlos Mendes", texto: "Impressionante o cuidado com os detalhes. Minha cozinha nunca brilhou tanto! Vale cada centavo.", rating: "★★★★★" },
  { id: 5, nome: "Fernanda Lima", texto: "Equipe super de confiança. Deixei a chave e quando voltei a casa estava um brinco. Muito obrigada!", rating: "★★★★★" },
];

export default function Home() {
  // --- ESTADO PARA CONTROLAR SE O USUÁRIO JÁ INTERAGIU COM O SIMULADOR ---
  const [jaInteragiuSimulador, setJaInteragiuSimulador] = useState(false);

  const dispararLeadSimulador = () => {
    if (jaInteragiuSimulador) return;
    setJaInteragiuSimulador(true);

    const visitorId = localStorage.getItem('luclean_visitor_id') || 'desconhecido';

    fetch('/api/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        evento_tipo: 'simulador_interagido',
        visitante_id: visitorId,
        tipo_limpeza: tipo,
        quartos: quartos,
        banheiros: banheiros,
        metragem: metragem,
        valor_simulado: precoFinal,
      }),
    }).catch(err => console.error("Erro ao registrar lead do simulador:", err));
  };

  // --- GERENCIAMENTO DE VISITANTE ÚNICO, PAGE VIEW & TEMPO DE PERMANÊNCIA ---
  useEffect(() => {
    // --- ESPIÃO DE PROFUNDIDADE DE ROLAGEM (SCROLL DEPTH) ---
    const marcosDisparados = { 25: false, 50: false, 75: false, 100: false };

    const lidarComScroll = () => {
      const alturaJanela = window.innerHeight;
      const alturaTotalDoc = document.documentElement.scrollHeight - alturaJanela;
      const scrollTop = window.scrollY;
      const porcentagemScroll = Math.round((scrollTop / alturaTotalDoc) * 100);

      [25, 50, 75, 100].forEach((marco) => {
        if (porcentagemScroll >= marco && !marcosDisparados[marco as keyof typeof marcosDisparados]) {
          marcosDisparados[marco as keyof typeof marcosDisparados] = true;

          const visitorId = localStorage.getItem('luclean_visitor_id') || 'desconhecido';

          // Usa sendBeacon para garantir o envio sem atrasar a página
          navigator.sendBeacon('/api/registrar', JSON.stringify({
            evento_tipo: `scroll_${marco}`,
            visitante_id: visitorId,
          }));
        }
      });
    };

    window.addEventListener('scroll', lidarComScroll, { passive: true });

    let visitorId = localStorage.getItem('luclean_visitor_id');
    if (!visitorId) {
      visitorId = 'user_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('luclean_visitor_id', visitorId);
    }

    // Registra a visita inicial
    const registrarVisita = async () => {
      try {
        await fetch('/api/registrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento_tipo: 'visita_pagina',
            visitante_id: visitorId,
          }),
        });
      } catch (err) {
        console.error("Erro ao registrar visita", err);
      }
    };

    registrarVisita();

    // Cronômetro de tempo de permanência
    const tempoInicio = Date.now();

    const lidarComSaida = () => {
      const segundosGastos = Math.round((Date.now() - tempoInicio) / 1000);
      
      if (segundosGastos > 1) {
        const payload = JSON.stringify({
          evento_tipo: 'tempo_permanencia',
          visitante_id: visitorId,
          tempo_permanencia_segundos: segundosGastos,
        });
        
        navigator.sendBeacon('/api/registrar', payload);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        lidarComSaida();
      }
    });
  }, []);

  // --- ESTADOS DO SIMULADOR ---
  const [quartos, setQuartos] = useState(1);
  const [banheiros, setBanheiros] = useState(1);
  const [metragem, setMetragem] = useState(50);
  const [tipo, setTipo] = useState('padrao');
  const [frequencia, setFrequencia] = useState('unico');
  const [dataEspecifica, setDataEspecifica] = useState('');
  const [frequenciaRecorrente, setFrequenciaRecorrente] = useState('semanal');
  const [diaSemana, setDiaSemana] = useState('segunda');

  const [emblaRefResultados, emblaApiResultados] = useEmblaCarousel({ loop: true, align: 'center' });
  const [emblaRefAvaliacoes, emblaApiAvaliacoes] = useEmblaCarousel({ loop: true, align: 'center' });

  const scrollPrevResultados = useCallback(() => emblaApiResultados && emblaApiResultados.scrollPrev(), [emblaApiResultados]);
  const scrollNextResultados = useCallback(() => emblaApiResultados && emblaApiResultados.scrollNext(), [emblaApiResultados]);
  
  const scrollPrevAvaliacoes = useCallback(() => emblaApiAvaliacoes && emblaApiAvaliacoes.scrollPrev(), [emblaApiAvaliacoes]);
  const scrollNextAvaliacoes = useCallback(() => emblaApiAvaliacoes && emblaApiAvaliacoes.scrollNext(), [emblaApiAvaliacoes]);

  // --- LÓGICA DE PREÇO COM DESCONTO PARA RECORRÊNCIA ---
  const calcularPreco = () => {
    let valorBase = 80; 
    valorBase += quartos * 30; 
    valorBase += banheiros * 30; 
    valorBase += metragem * 1.5; 
    
    if (tipo === 'pesada') valorBase *= 1.4;
    if (tipo === 'pos-obra') valorBase *= 1.8;
    
    // 10% de desconto se for recorrente para incentivar contrato fixo
    if (frequencia === 'recorrente') {
      valorBase *= 0.9;
    }

    return Math.round(valorBase);
  };

  const precoFinal = calcularPreco();
  const numeroWhatsApp = "556131426835"; 

  // Montagem da preferência de data/horário para a mensagem
  const detalheAgenda = frequencia === 'unico' 
    ? `Data preferencial: ${dataEspecifica || 'A definir'}` 
    : `Plano Recorrente: ${frequenciaRecorrente} (preferência às ${diaSemana}s)`;

  // Mensagem Padrão (Simulador)
  const mensagem = `Olá, vim pelo site! Gostaria de agendar uma limpeza ${tipo.replace('-', ' ')} (${frequencia === 'unico' ? 'Pontual' : 'Recorrente'}). Imóvel: ${metragem}m², ${quartos} quarto(s), ${banheiros} banheiro(s). ${detalheAgenda}. Estimativa: R$ ${precoFinal}. Podemos confirmar?`;
  const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;

  // Mensagem Genérica (Cabeçalho)
  const mensagemGenerica = `Olá! Vim pelo site da LU CLEAN e gostaria de tirar algumas dúvidas sobre os serviços de limpeza.`;
  const linkWhatsAppGenerico = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagemGenerica)}`;

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    const href = e.currentTarget.getAttribute('href');
    if (!href || !href.startsWith('#')) return;
    
    const targetId = href.substring(1);
    const elem = document.getElementById(targetId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const Seta = ({ direcao, onClick }: { direcao: 'esq' | 'dir', onClick: () => void }) => (
    <button 
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur text-[#0F4C5C] p-3 rounded-full shadow-lg border border-zinc-200 hover:bg-[#0F4C5C] hover:text-white transition-colors hover:scale-110 active:scale-95"
      style={{ [direcao === 'esq' ? 'left' : 'right']: '1rem' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
        {direcao === 'esq' ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        )}
      </svg>
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans overflow-x-hidden">
      
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-zinc-200 shadow-sm">
        <div className="flex items-center justify-between p-4 md:p-6 max-w-7xl mx-auto w-full">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/logo.png" alt="Logo LU CLEAN" className="h-18 md:h-24 w-auto drop-shadow-sm rounded-full" />
            </a>
            <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-600">
              <a href="#resultados" onClick={handleScroll} className="hover:text-[#0F4C5C] transition-colors">Resultados</a>
              <a href="#avaliacoes" onClick={handleScroll} className="hover:text-[#0F4C5C] transition-colors">Avaliações</a>
              <a href="#simulador" onClick={handleScroll} className="hover:text-[#0F4C5C] transition-colors">Simulador</a>
            </nav>

            {/* ESPIÃO DO CABEÇALHO (Contato Direto) */}
            <button 
              onClick={() => {
                fetch('/api/registrar', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    tipo_limpeza: 'contato_direto_cabecalho',
                    quartos: 0,
                    banheiros: 0,
                    metragem: 0,
                    valor_simulado: 0,
                  }),
                }).catch(err => console.error("Erro no tracker:", err));
                window.open(linkWhatsAppGenerico, '_blank');
              }}
              className="bg-[#0F4C5C] text-white px-4 py-2 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-semibold hover:bg-[#0B3A46] transition-colors shadow-md cursor-pointer"
            >
              Falar no WhatsApp
            </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main className="relative flex flex-col items-center text-center pt-32 md:pt-48 pb-20 md:pb-32 w-full mt-[72px] md:mt-[88px] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1920&q=80" alt="Ambiente Limpo" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-zinc-50/85 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center">
          <span className="bg-white text-[#0F4C5C] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-6 shadow-sm border border-blue-100">
            Atendimento em Brasília e Entorno
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-zinc-900 mb-6 leading-tight drop-shadow-sm">
            Limpeza profissional, sem dor de cabeça.
          </h1>
          <p className="text-base md:text-xl text-zinc-700 mb-10 max-w-2xl font-medium">
            Especialistas em limpeza residencial, comercial e pós-obra. Deslize para ver nossos resultados e simule seu orçamento online.
          </p>
          
          {/* BOTÃO DA HERO (Apenas rola a tela para o simulador) */}
          <a href="#simulador" onClick={handleScroll} className="bg-[#0F4C5C] text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-[#0B3A46] transition-all shadow-lg hover:shadow-[#0F4C5C]/30">
            Simular Orçamento
          </a>
        </div>
      </main>

      {/* RESULTADOS (CARROSSEL DE IMAGENS SIMPLES) */}
      <section id="resultados" className="bg-white py-24 w-full scroll-mt-24 border-y border-zinc-100 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-4">Resultados que Impressionam</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
            Deslize para o lado para ver a qualidade dos nossos projetos concluídos.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <Seta direcao="esq" onClick={scrollPrevResultados} />
          
          <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRefResultados}>
            <div className="flex touch-pan-y">
              {comparacoesData.map((item) => (
                <div key={item.id} className="flex-[0_0_90%] md:flex-[0_0_70%] min-w-0 px-3 md:px-4">
                  <div className="w-full aspect-[4/3] md:aspect-[16/9] rounded-3xl overflow-hidden shadow-xl border-4 border-white ring-1 ring-zinc-200 relative group">
                    <img src={item.imagem} alt={item.titulo} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur px-4 py-1.5 text-xs font-bold rounded-full text-zinc-900 shadow-md">
                      {item.titulo}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Seta direcao="dir" onClick={scrollNextResultados} />
        </div>
      </section>

      {/* AVALIAÇÕES (CARROSSEL) */}
      <section id="avaliacoes" className="py-24 w-full scroll-mt-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-4">O que nossos clientes dizem</h2>
          <p className="text-lg text-zinc-600 max-w-2xl mx-auto">Confira a experiência de quem já contratou a LU CLEAN.</p>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <Seta direcao="esq" onClick={scrollPrevAvaliacoes} />
          
          <div className="overflow-hidden cursor-grab active:cursor-grabbing py-4" ref={emblaRefAvaliacoes}>
            <div className="flex touch-pan-y">
              {avaliacoesData.map((av) => (
                <div key={av.id} className="flex-[0_0_85%] md:flex-[0_0_40%] lg:flex-[0_0_30%] min-w-0 px-3">
                  <div className="bg-white h-full p-8 rounded-3xl shadow-sm border border-zinc-100 flex flex-col gap-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-[#0F4C5C] font-bold text-lg shrink-0">
                        {av.nome.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-zinc-900">{av.nome}</h4>
                        <div className="text-yellow-400 text-xs tracking-widest">{av.rating}</div>
                      </div>
                    </div>
                    <p className="text-zinc-600 italic leading-relaxed text-sm md:text-base">"{av.texto}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Seta direcao="dir" onClick={scrollNextAvaliacoes} />
        </div>
      </section>

      {/* SIMULADOR */}
      <section id="simulador" className="max-w-xl mx-auto px-6 pb-24 w-full scroll-mt-28">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-zinc-100">
          <h2 className="text-2xl font-bold mb-6 text-zinc-800 text-center">Simule seu orçamento</h2>
          <div className="flex flex-col gap-8">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-600">Quartos</label>
              <input type="range" min="1" max="5" value={quartos} onChange={(e) => setQuartos(Number(e.target.value))} className="w-full accent-[#0F4C5C]" />
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5+</span>
              </div>
              <div className="text-center font-bold text-[#0F4C5C] mt-1">{quartos} {quartos === 1 ? 'quarto' : 'quartos'}</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-600">Banheiros</label>
              <input type="range" min="1" max="5" value={banheiros} onChange={(e) => setBanheiros(Number(e.target.value))} className="w-full accent-[#0F4C5C]" />
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>1</span><span>2</span><span>3</span><span>4</span><span>5+</span>
              </div>
              <div className="text-center font-bold text-[#0F4C5C] mt-1">{banheiros} {banheiros === 1 ? 'banheiro' : 'banheiros'}</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-600">Metragem Aproximada (m²)</label>
              <input type="range" min="30" max="300" step="10" value={metragem} onChange={(e) => setMetragem(Number(e.target.value))} className="w-full accent-[#0F4C5C]" />
              <div className="flex justify-between text-xs text-zinc-400 font-medium">
                <span>30</span><span>150</span><span>300+</span>
              </div>
              <div className="text-center font-bold text-[#0F4C5C] mt-1">{metragem} m²</div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-600">Tipo de Limpeza</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium focus:ring-2 focus:ring-[#0F4C5C] focus:outline-none">
                <option value="padrao">Padrão (Manutenção)</option>
                <option value="pesada">Pesada (Com faxina de janelas e armários)</option>
                <option value="pos-obra">Pós-Obra (Remoção de tinta, rejunte, etc)</option>
              </select>
            </div>

            {/* FREQUÊNCIA DO SERVIÇO */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-zinc-600">Frequência</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFrequencia('unico')}
                  className={`py-3 rounded-xl font-bold text-sm border transition-all ${
                    frequencia === 'unico' ? 'bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-md' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  Único (Pontual)
                </button>
                <button
                  type="button"
                  onClick={() => setFrequencia('recorrente')}
                  className={`py-3 rounded-xl font-bold text-sm border transition-all relative ${
                    frequencia === 'recorrente' ? 'bg-[#0F4C5C] text-white border-[#0F4C5C] shadow-md' : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  Recorrente
                  <span className="absolute -top-2 -right-2 bg-[#8CD3C4] text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shadow">
                    -10% Off
                  </span>
                </button>
              </div>
            </div>

            {/* CAMPOS DINÂMICOS BASEADOS NA FREQUÊNCIA */}
            {frequencia === 'unico' ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-600">Data Preferencial</label>
                <input type="date" value={dataEspecifica} onChange={(e) => setDataEspecifica(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium focus:ring-2 focus:ring-[#0F4C5C] focus:outline-none" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-zinc-600">Plano</label>
                  <select value={frequenciaRecorrente} onChange={(e) => setFrequenciaRecorrente(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium focus:ring-2 focus:ring-[#0F4C5C] focus:outline-none text-sm">
                    <option value="semanal">Semanal</option>
                    <option value="quinzenal">Quinzenal</option>
                    <option value="mensal">Mensal</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-zinc-600">Dia Preferido</label>
                  <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)} className="w-full p-3 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-800 font-medium focus:ring-2 focus:ring-[#0F4C5C] focus:outline-none text-sm">
                    <option value="segunda">Segunda-feira</option>
                    <option value="terca">Terça-feira</option>
                    <option value="quarta">Quarta-feira</option>
                    <option value="quinta">Quinta-feira</option>
                    <option value="sexta">Sexta-feira</option>
                    <option value="sabado">Sábado</option>
                  </select>
                </div>
              </div>
            )}
            
            <hr className="border-zinc-100" />
            
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-medium text-zinc-600 block">Estimativa:</span>
                {frequencia === 'recorrente' && (
                  <span className="text-xs text-[#8CD3C4] font-bold">Inclui 10% de desconto recorrente</span>
                )}
              </div>
              <span className="text-3xl md:text-4xl font-black text-zinc-900">R$ {precoFinal}</span>
            </div>
            
            {/* ESPIÃO DO SIMULADOR (Conversão Qualificada) */}
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/registrar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      tipo_limpeza: tipo,
                      quartos: quartos,
                      banheiros: banheiros,
                      metragem: metragem,
                      valor_simulado: precoFinal,
                    }),
                  });
                } catch (err) {
                  console.error("Falha ao registrar métrica", err);
                }
                window.open(linkWhatsApp, '_blank');
              }}
              className="bg-[#8CD3C4] text-zinc-900 w-full py-4 rounded-xl text-lg font-bold hover:bg-[#6EBAA9] transition-colors shadow-lg hover:shadow-[#8CD3C4]/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              Agendar pelo WhatsApp
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}