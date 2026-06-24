import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// Inicializar Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Inicializar Supabase (Opcional si se quiere guardar directo desde el backend)
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
// const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { text, currentDate } = await req.json();

        if (!text) {
            return NextResponse.json({ error: 'Falta el texto dictado' }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Falta la API Key de Gemini' }, { status: 500 });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `
Eres un asistente financiero experto. Extrae la información de la siguiente transacción dictada por el usuario.
La fecha actual es ${currentDate || new Date().toISOString()}.
Aplica las siguientes reglas estrictas:
1. "monto": debe ser un número exacto (ej. "50 mil" -> 50000). Si no se menciona, devuelve null.
2. "tipo": debe ser estrictamente "gasto" o "ingreso". Si dice "compré", "gasté", "pagué", es gasto. Si dice "recibí", "me pagaron", "gané", es ingreso.
3. "categoria": sugiere una categoría corta (ej. "Alimentación", "Transporte", "Vivienda", "Suscripciones", "Servicios", "Otros" o "Ingresos").
4. "fecha": infiere la fecha en formato ISO (YYYY-MM-DD). Si dice "hoy", usa la fecha actual. Si dice "ayer", resta 1 día, etc. Si no se especifica, usa la fecha actual.
5. "descripcion": un resumen muy breve de la transacción (ej. "Gasolina", "Cena con amigos").

Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta, sin formato de markdown extra ni comentarios:
{
  "monto": number | null,
  "tipo": "gasto" | "ingreso",
  "categoria": string,
  "fecha": string,
  "descripcion": string
}

Texto dictado: "${text}"
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Limpiar el resultado en caso de que Gemini devuelva markdown
        const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        let parsedData;
        try {
            parsedData = JSON.parse(cleanedText);
        } catch (parseError) {
            console.error("Error al parsear JSON de Gemini:", cleanedText);
            return NextResponse.json({ error: 'El modelo no devolvió un JSON válido' }, { status: 500 });
        }

        if (parsedData.monto === null || parsedData.monto === undefined) {
             return NextResponse.json({ error: 'No se pudo detectar el monto de la transacción.' }, { status: 400 });
        }

        // --- LÓGICA PREPARADA PARA SUPABASE ---
        // Descomenta y ajusta si deseas insertar directamente desde este endpoint en lugar del cliente.
        /*
        const { data, error } = await supabase
            .from('transactions')
            .insert([
                {
                    amount: parsedData.monto,
                    type: parsedData.tipo === 'gasto' ? 'expense' : 'income',
                    category: parsedData.categoria,
                    date: parsedData.fecha,
                    description: parsedData.descripcion,
                    // Necesitarías el user_id para insertar aquí
                    // user_id: '...' 
                }
            ]);

        if (error) {
             console.error("Error al guardar en Supabase:", error);
             return NextResponse.json({ error: 'Error al guardar en base de datos' }, { status: 500 });
        }
        */

        return NextResponse.json({ success: true, data: parsedData });

    } catch (error: any) {
        console.error('Error en el endpoint de dictado:', error);
        return NextResponse.json({ error: error.message || 'Error interno del servidor' }, { status: 500 });
    }
}
