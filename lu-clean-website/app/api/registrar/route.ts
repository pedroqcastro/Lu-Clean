import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      tipo_limpeza = 'padrao', 
      quartos = 0, 
      banheiros = 0, 
      metragem = 0, 
      valor_simulado = 0,
      evento_tipo = 'orcamento_clicado',
      visitante_id = 'desconhecido'
    } = body;

    // Captura o dispositivo do usuário através dos headers da requisição
    const userAgent = request.headers.get('user-agent') || '';
    const dispositivo = /mobile/i.test(userAgent) ? 'Celular' : 'Computador';

    const connectionString = process.env.DATABASE_URL || '';
    const sql = neon(connectionString);

    await sql`
      INSERT INTO orcamentos_gerados (
        tipo_limpeza, quartos, banheiros, metragem, 
        valor_simulado, clicou_whatsapp, evento_tipo, 
        visitante_id, dispositivo
      )
      VALUES (
        ${tipo_limpeza}, ${quartos}, ${banheiros}, ${metragem}, 
        ${valor_simulado}, ${evento_tipo === 'orcamento_clicado'}, ${evento_tipo}, 
        ${visitante_id}, ${dispositivo}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar métrica:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar' }, { status: 500 });
  }
}