import React from 'react';

export default function Contacto() {
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 40 }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#8B4513', marginBottom: 20 }}>Contacto</h1>
      <p>
        ¿Tienes alguna pregunta, comentario o sugerencia? En <b>Restaurante Osadía</b> estamos para escucharte. Puedes contactarnos a través de los siguientes medios:
      </p>
      <ul style={{ marginLeft: 20, marginBottom: 20 }}>
        <li><b>Dirección:</b> Av. Gastronómica 123, Col. Centro, Monterrey, NL</li>
        <li><b>Teléfono:</b> (81) 1234-5678</li>
        <li><b>Email:</b> contacto@osadiarestaurante.com</li>
        <li><b>Horario de atención:</b> Lunes a Sábado 12:00 pm - 11:00 pm | Domingo 1:00 pm - 8:00 pm</li>
      </ul>
      <img
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80"
        alt="Restaurante Osadía contacto"
        style={{ width: '100%', borderRadius: 12, marginBottom: 30, maxHeight: 350, objectFit: 'cover' }}
      />
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>¿Dónde estamos?</h2>
      <iframe
        title="Ubicación Restaurante Osadía"
        src="https://www.google.com/maps?q=Monterrey,+NL,+Mexico&output=embed"
        width="100%"
        height="300"
        style={{ border: 0, borderRadius: 12, marginBottom: 20 }}
        allowFullScreen=""
        loading="lazy"
      ></iframe>
      <p style={{ marginTop: 30, color: '#555' }}>
        También puedes escribirnos a través de nuestro formulario de servicio al cliente en la plataforma.
      </p>
    </div>
  );
}