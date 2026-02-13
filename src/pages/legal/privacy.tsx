'use client';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';

export default function Privacy() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-pattern pt-24 pb-16">
      <Head>
        <title>Privacidad | Pantcookie</title>
        <meta name="description" content="Política de Privacidad de Pantcookie: qué datos recopilamos, cómo los usamos y tus derechos." />
      </Head>
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black neon-text-pink uppercase italic tracking-tighter">
            {t('footer.legal.privacyTitle') || 'Política de Privacidad'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Recopilación de Datos</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>Recopilamos únicamente la información necesaria para el correcto funcionamiento del sitio y la experiencia del usuario, incluyendo:</li>
              <li>1. Nombre o alias que ingresas al participar en juegos o completar formularios.</li>
              <li>2. Puntajes, estadísticas y métricas de juego utilizadas para mostrar clasificaciones y rankings.</li>
              <li>3. Métricas técnicas mínimas (como rendimiento y estabilidad) para mejorar el funcionamiento del sitio.</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Finalidades</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>Los datos recopilados serán utilizados de manera responsable y únicamente para los siguientes fines:</li>
              <li>1. Mejorar y optimizar la experiencia del usuario, incluyendo la visualización de clasificaciones y resultados.</li>
              <li>2. Garantizar el correcto funcionamiento del sitio, así como su seguridad, estabilidad y protección frente a usos indebidos.</li>
              <li>3. Facilitar la comunicación dentro de la comunidad, siempre sin fines comerciales ni publicitarios.</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Contenido enviado por los usuarios</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>Los usuarios pueden enviar mensajes, textos e imágenes a través del sitio. Dicho contenido puede ser visible para otros miembros de la comunidad. Al enviar contenido, el usuario declara tener los derechos necesarios para compartirlo y autoriza su uso y visualización dentro del sitio, siempre sin fines comerciales.</li>
              <li>Para mantener un ambiente respetuoso y agradable para todos, se solicita no enviar contenido ofensivo, violento, sexual explícito, discriminatorio o inapropiado para la comunidad. Nos reservamos el derecho de moderar, ocultar o eliminar contenido que no cumpla con estas normas.</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Enlaces a sitios de terceros</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              El sitio puede incluir enlaces o contenido integrado de plataformas de terceros. No somos responsables por las prácticas de privacidad, el contenido ni el funcionamiento de dichos sitios externos.
            </p>
          </section>

          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Almacenamiento y Seguridad</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Los datos recopilados se conservan únicamente durante el tiempo necesario para cumplir con las finalidades descritas.
              Aplicamos medidas de seguridad razonables para proteger la información frente a accesos no autorizados, pérdidas o usos indebidos. En ningún caso vendemos ni comercializamos información personal.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Uso del chatbot con IA</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              El sitio incluye un chatbot que utiliza inteligencia artificial para generar respuestas automáticamente. Las interacciones pueden ser usadas para mejorar su funcionamiento y la experiencia del usuario. El chatbot no reemplaza asesoramiento profesional y no garantiza la exactitud total de sus respuestas.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Tus Derechos</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>Como usuario, tienes derecho a:</li>
              <li>1. Acceder, rectificar o solicitar la eliminación de tu información personal.</li>
              <li>2. Solicitar detalles sobre el tratamiento de los datos y las finalidades para las que se utilizan.</li>
              <li>3. Retirar tu consentimiento cuando corresponda, conforme a la normativa aplicable.</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Edad mínima</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              El sitio está dirigido a usuarios mayores de 13 años. Si eres menor de esa edad, se recomienda contar con el consentimiento de un adulto responsable para utilizar el sitio y sus funcionalidades.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Cookies</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Utilizamos cookies funcionales y analíticas básicas para garantizar el correcto funcionamiento del sitio y mejorar la experiencia del usuario.
              Puedes deshabilitarlas desde la configuración de tu navegador, aunque esto podría afectar algunas funcionalidades del sitio.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
