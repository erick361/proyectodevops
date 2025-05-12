import React from 'react';

export default function Politicas() {
  return (
    <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0001', padding: 40 }}>
      <h1 style={{ fontFamily: 'Playfair Display, serif', color: '#8B4513', marginBottom: 20 }}>Políticas de Privacidad</h1>
      <p>
        En <b>Restaurante Osadía</b> nos comprometemos a proteger la privacidad de nuestros clientes y usuarios. Esta política describe cómo recopilamos, usamos y protegemos tu información personal.
      </p>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>1. Información que recopilamos</h2>
      <ul style={{ marginLeft: 20 }}>
        <li>Datos de contacto: nombre, correo electrónico, teléfono.</li>
        <li>Información de reservas: fecha, hora, número de personas, peticiones especiales.</li>
        <li>Datos de navegación en nuestro sitio web.</li>
      </ul>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>2. Uso de la información</h2>
      <ul style={{ marginLeft: 20 }}>
        <li>Gestionar y confirmar tus reservas.</li>
        <li>Contactarte para resolver dudas o incidencias.</li>
        <li>Mejorar nuestros servicios y la experiencia del usuario.</li>
        <li>Enviar información relevante sobre promociones o eventos (solo si lo autorizas).</li>
      </ul>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>3. Protección de datos</h2>
      <p>
        Tus datos personales se almacenan de forma segura y nunca serán compartidos con terceros sin tu consentimiento, salvo obligación legal.
      </p>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>4. Derechos del usuario</h2>
      <ul style={{ marginLeft: 20 }}>
        <li>Acceder, corregir o eliminar tus datos personales.</li>
        <li>Solicitar la limitación u oposición al tratamiento de tus datos.</li>
        <li>Retirar tu consentimiento en cualquier momento.</li>
      </ul>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>5. Políticas de Respaldo y Recuperación</h2>
      <h3 style={{ color: '#8B4513' }}>¿Qué se respalda?</h3>
      <ul style={{ marginLeft: 20 }}>
        <li>Código fuente de la aplicación y scripts de automatización.</li>
        <li>Imágenes y archivos estáticos almacenados en S3.</li>
        <li>Definiciones de infraestructura (CloudFormation).</li>
        <li>Contenedores y configuraciones Docker.</li>
        <li>Base de datos de reservas, usuarios y mesas.</li>
        <li>Logs de aplicación y del sistema.</li>
        <li>Escaneos de seguridad y métricas.</li>
      </ul>
      <h3 style={{ color: '#8B4513' }}>¿Cómo y cuándo se respalda?</h3>
      <ul style={{ marginLeft: 20 }}>
        <li><b>Código fuente:</b> Respaldo diario automático en repositorios Git.</li>
        <li><b>Base de datos:</b> Respaldo diario automático y exportación cifrada a S3.</li>
        <li><b>Archivos S3:</b> Versionado y replicación automática.</li>
        <li><b>Contenedores:</b> Archivos Docker y configuraciones respaldados junto con el código.</li>
        <li><b>Logs:</b> Envío automático a CloudWatch y respaldo semanal en S3.</li>
      </ul>
      <h3 style={{ color: '#8B4513' }}>Restauración</h3>
      <ul style={{ marginLeft: 20 }}>
        <li><b>Código fuente:</b> Clonado desde repositorio y redeploy.</li>
        <li><b>Base de datos:</b> Importar último respaldo o snapshot.</li>
        <li><b>Archivos S3:</b> Recuperación desde historial de versiones.</li>
        <li><b>Contenedores:</b> Reconstrucción desde Dockerfile o imágenes de respaldo.</li>
        <li><b>Infraestructura:</b> Despliegue desde plantillas CloudFormation.</li>
      </ul>
      <h3 style={{ color: '#8B4513' }}>Responsables</h3>
      <ul style={{ marginLeft: 20 }}>
        <li><b>Equipo de Desarrollo:</b> Código, Docker y CloudFormation.</li>
        <li><b>Administrador DevOps:</b> Respaldos automáticos, base de datos y validación de restauraciones.</li>
        <li><b>Líder de Proyecto:</b> Aprobar políticas y validar reportes mensuales.</li>
      </ul>
      <h3 style={{ color: '#8B4513' }}>Pruebas de restauración</h3>
      <ul style={{ marginLeft: 20 }}>
        <li>Pruebas mensuales de restauración de base de datos e infraestructura.</li>
        <li>Restauración parcial en entorno de prueba y despliegue desde plantillas.</li>
      </ul>
      <h3 style={{ color: '#8B4513' }}>RTO y RPO</h3>
      <ul style={{ marginLeft: 20 }}>
        <li><b>RTO:</b> 2 horas máximo para recuperación funcional.</li>
        <li><b>RPO:</b> Máximo 24 horas de pérdida de datos aceptable.</li>
      </ul>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>6. Técnicas de Data Loss Prevention (DLP)</h2>
      <ul style={{ marginLeft: 20 }}>
        <li><b>Clasificación de datos sensibles:</b> Identificación y etiquetado de información personal, historial de reservas y credenciales.</li>
        <li><b>Encriptación:</b> Toda comunicación usa HTTPS/TLS 1.2+; datos en S3 y respaldos cifrados con KMS.</li>
        <li><b>Restricción de accesos:</b> Acceso mínimo necesario, separación de entornos y uso de Secrets Manager.</li>
        <li><b>Auditoría y monitoreo:</b> CloudTrail y CloudWatch para registrar y alertar sobre accesos y cambios.</li>
        <li><b>Revisión y pruebas:</b> Revisiones automáticas de código y políticas DLP en repositorios.</li>
      </ul>
      <h2 style={{ color: '#A0522D', marginTop: 30, marginBottom: 10 }}>7. Contacto</h2>
      <p>
        Si tienes dudas sobre nuestra política de privacidad o deseas ejercer tus derechos, puedes contactarnos en:<br />
        <b>Email:</b> privacidad@osadiarestaurante.com<br />
        <b>Teléfono:</b> (81) 1234-5678
      </p>
      <p style={{ marginTop: 30, color: '#555' }}>
        Última actualización: Mayo 2025
      </p>
    </div>
  );
}