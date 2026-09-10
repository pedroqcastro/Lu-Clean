import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo_limpeza, quartos, banheiros, metragem, valor_simulado } = body;

    // Conecta ao banco usando a variável de ambiente segura
    const connectionString = process.env.DATABASE_URL || '';
    const sql = neon(connectionString);

    // Insere os dados na tabela que criamos na Neon
    await sql`
      INSERT INTO orcamentos_gerados (tipo_limpeza, quartos, banheiros, metragem, valor_simulado, clicou_whatsapp)
      VALUES (${tipo_limpeza}, ${quartos}, ${banheiros}, ${metragem}, ${valor_simulado}, TRUE)
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao registrar orçamento:', error);
    return NextResponse.json({ success: false, error: 'Erro ao salvar' }, { status: 500 });
  }
}