'use client';
import Head from 'next/head';
import { useLanguage } from '../../context/LanguageContext';

export default function Terms() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-pattern pt-24 pb-16">
      <Head>
        <title>Términos y Condiciones | Pantcookie</title>
        <meta name="description" content="Términos y Condiciones de la Fan Page Pantcookie: uso del sitio, propiedad intelectual, conducta y cookies." />
      </Head>
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-black neon-text-pink uppercase italic tracking-tighter">
            {t('footer.legal.termsTitle') || 'Términos y Condiciones'}
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Aceptación de Uso</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Al acceder y utilizar este sitio, aceptas estos Términos y Condiciones de Uso.
              Si no estás de acuerdo con alguno de ellos, te pedimos que no utilices la Fan Page Pantcookie.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Uso del Sitio</h2>
            <ul className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed space-y-2">
              <li>El uso del sitio debe realizarse de manera responsable y respetuosa, tanto con la comunidad como con ShuraHiwa. En particular:</li>
              <li>1. No se permite el envío de spam, el acoso a otros usuarios ni la realización de actividades ilícitas.</li>
              <li>2. Los juegos, rankings y contenidos interactivos tienen fines recreativos; no está permitido el uso de trampas, manipulaciones o cualquier práctica que altere su funcionamiento.</li>
            </ul>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Propiedad Intelectual</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Todo el contenido pertenece a sus respectivos autores originales. Este sitio es un proyecto no oficial, creado por fans, y no reclama la propiedad sobre marcas, imágenes, música u otros materiales referenciados.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Cambios y contacto</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Cualquier actualización será publicada en esta misma página. Para consultas o aclaraciones, puedes utilizar los canales de contacto de la comunidad.
            </p>
          </section>

          <section className="poke-card p-8">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-4">Contenido del Usuario</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Al enviar mensajes, puntajes, comentarios u otro contenido, garantizas que tienes el derecho de compartirlo y que dicho contenido no infringe derechos de terceros. Asimismo, aceptas que sea mostrado dentro del sitio conforme a su finalidad.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Cookies y Analítica</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Utilizamos cookies funcionales y métricas analíticas básicas con el objetivo de mejorar la experiencia del usuario y el funcionamiento del sitio. No vendemos ni comercializamos datos personales.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Moderación de contenido</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Nos reservamos el derecho de revisar, moderar, ocultar o eliminar cualquier contenido enviado por los usuarios que no cumpla con estas normas o que afecte negativamente a la comunidad.
            </p>
            <h2 className="text-2xl font-black uppercase tracking-tighter mt-8 mb-4">Uso recreativo del contenido</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              Los juegos, rankings, clasificaciones y demás contenidos interactivos del sitio tienen fines exclusivamente recreativos y comunitarios. No poseen valor comercial, económico ni competitivo oficial.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
