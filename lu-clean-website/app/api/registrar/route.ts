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
      visitante_id = 'desconhecido',
      tempo_permanencia_segundos = 0,
      utm_source = 'direto',
      utm_medium = 'nenhum',
      utm_campaign = 'nenhuma'
    } = body;

    const userAgent = request.headers.get('user-agent') || '';
    const dispositivo = /mobile/i.test(userAgent) ? 'Celular' : 'Computador';

    const connectionString = process.env.DATABASE_URL || '';
    const sql = neon(connectionString);

    await sql`
      INSERT INTO orcamentos_gerados (
        tipo_limpeza, quartos, banheiros, metragem, 
        valor_simulado, clicou_whatsapp, evento_tipo, 
        visitante_id, dispositivo, tempo_permanencia_segundos,
        utm_source, utm_medium, utm_campaign
      )
      VALUES (
        ${tipo_limpeza}, ${quartos}, ${banheiros}, ${metragem}, 
        ${valor_simulado}, ${evento_tipo === 'orcamento_clicado'}, ${evento_tipo}, 
        ${visitante_id}, ${dispositivo}, ${tempo_permanencia_segundos},
        ${utm_source}, ${utm_medium}, ${utm_campaign}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar métrica:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar' }, { status: 500 });
  }
}