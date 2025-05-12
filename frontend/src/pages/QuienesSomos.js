import React from 'react';

export default function QuienesSomos() {
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 40 }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#8B4513', marginBottom: 20 }}>Quiénes Somos</h1>
      <img
        src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80"
        alt="Restaurante Osadía"
        style={{ width: '100%', borderRadius: 12, marginBottom: 30, maxHeight: 350, objectFit: 'cover' }}
      />
      <h2 style={{ color: '#A0522D', marginBottom: 10 }}>Nuestra Historia</h2>
      <p>
        Restaurante Osadía nació en 2010 en el corazón de Monterrey, con la visión de fusionar la tradición culinaria mexicana con un toque contemporáneo y elegante. Desde nuestros inicios, nos hemos dedicado a ofrecer experiencias gastronómicas únicas, donde cada platillo cuenta una historia y cada detalle importa.
      </p>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>Nuestra Filosofía</h2>
      <ul style={{ marginLeft: 20, marginBottom: 20 }}>
        <li><b>Calidad:</b> Utilizamos ingredientes frescos y de la más alta calidad, seleccionados cuidadosamente cada día.</li>
        <li><b>Innovación:</b> Nuestro menú se renueva constantemente, combinando recetas clásicas con creaciones originales de nuestro chef.</li>
        <li><b>Servicio:</b> Nos apasiona brindar una atención cálida, personalizada y profesional a cada uno de nuestros comensales.</li>
        <li><b>Ambiente:</b> Osadía es un espacio elegante y acogedor, ideal para celebraciones, reuniones familiares o cenas románticas.</li>
      </ul>
      <img
        src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80"
        alt="Ambiente Restaurante Osadía"
        style={{ width: '100%', borderRadius: 12, marginBottom: 30, maxHeight: 350, objectFit: 'cover' }}
      />
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>Nuestro Equipo</h2>
      <p>
        Contamos con un equipo de chefs apasionados, sommeliers expertos y personal de sala comprometido con la excelencia. Cada miembro de Osadía comparte el objetivo de crear momentos inolvidables para nuestros clientes.
      </p>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>Datos de Contacto</h2>
      <ul style={{ marginLeft: 20 }}>
        <li><b>Dirección:</b> Av. Gastronómica 123, Col. Centro, Monterrey, NL</li>
        <li><b>Teléfono:</b> (81) 1234-5678</li>
        <li><b>Email:</b> contacto@osadiarestaurante.com</li>
        <li><b>Horarios:</b> Lunes a Sábado 12:00 pm - 11:00 pm | Domingo 1:00 pm - 8:00 pm</li>
      </ul>
      <img
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
        alt="Equipo Restaurante Osadía"
        style={{ width: '100%', borderRadius: 12, marginBottom: 10, maxHeight: 350, objectFit: 'cover' }}
      />
      <p style={{ marginTop: 30, color: '#555' }}>
        ¡Te invitamos a vivir la experiencia Osadía!
      </p>
    </div>
  );
}